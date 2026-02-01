import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { socket } from '../socket';
import { 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  MousePointer2,
  MessageSquare
} from 'lucide-react';

// -- Helpers --
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const isPointInElement = (x, y, element) => {
  if (element.tool === 'rectangle' || element.tool === 'square') { // Handling square too
    const minX = Math.min(element.start.x, element.end.x);
    const maxX = Math.max(element.start.x, element.end.x);
    const minY = Math.min(element.start.y, element.end.y);
    const maxY = Math.max(element.start.y, element.end.y);
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  }
  if (element.tool === 'circle') {
     // Approx as ellipse or bounding box
     const minX = Math.min(element.start.x, element.end.x);
     const maxX = Math.max(element.start.x, element.end.x);
     const minY = Math.min(element.start.y, element.end.y);
     const maxY = Math.max(element.start.y, element.end.y);
     return x >= minX && x <= maxX && y >= minY && y <= maxY;
  }
  if (element.tool === 'text') {
    return x >= element.x && x <= element.x + (element.text.length * 10) && y >= element.y - 20 && y <= element.y + 10;
  }
  if (element.tool === 'arrow') {
     // Simple bounding box for line
     const minX = Math.min(element.start.x, element.end.x) - 10;
     const maxX = Math.max(element.start.x, element.end.x) + 10;
     const minY = Math.min(element.start.y, element.end.y) - 10;
     const maxY = Math.max(element.start.y, element.end.y) + 10;
     return x >= minX && x <= maxX && y >= minY && y <= maxY;
  }
    if (element.tool === 'image') {
      return x >= element.x && x <= element.x + element.width && y >= element.y && y <= element.y + element.height;
    }
  if (element.tool === 'brush') {
     // Check proximity to any point
     return element.points.some(p => Math.hypot(p.x - x, p.y - y) < 10);
  }
  return false;
};

const moveElement = (element, dx, dy) => {
   const newEl = { ...element };
   if (newEl.tool === 'brush' || newEl.tool === 'eraser') {
      newEl.points = newEl.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
  } else if (newEl.tool === 'text') {
      newEl.x += dx;
      newEl.y += dy;
  } else if (newEl.tool === 'image') {
    newEl.x += dx;
    newEl.y += dy;
   } else {
      newEl.start = { x: newEl.start.x + dx, y: newEl.start.y + dy };
      newEl.end = { x: newEl.end.x + dx, y: newEl.end.y + dy };
   }
   return newEl;
};

const Canvas = ({ activeTool, setActiveTool, color, strokeWidth, pageId, canvasRef, onUndo, onRedo, roomId, comments = [], user }) => {
  // const canvasRef = useRef(null); // Lifted to App.jsx
  const containerRef = useRef(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState([]); 
  const [currentElement, setCurrentElement] = useState(null); 
  const [commentInput, setCommentInput] = useState(null);
  const [hoveredComment, setHoveredComment] = useState(null);
  const [peerElements, setPeerElements] = useState({}); // { socketId: element }
  const [textInput, setTextInput] = useState(null); 
  const [clipboard, setClipboard] = useState(null);
  
  // Selection State
  const [selectedElement, setSelectedElement] = useState(null);
  const [dragOffset, setDragOffset] = useState(null); // {x, y} relative to element
  const [isDragging, setIsDragging] = useState(false);

  // Pan & Zoom State
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [canRedo, setCanRedo] = useState(false);
  const [redoStack, setRedoStack] = useState([]);

  const [peerCursors, setPeerCursors] = useState({});
  const lastEmitRef = useRef(0);
  const lastStrokeEmitRef = useRef(0);
  const saveTimeoutRef = useRef(null);
  const imageCacheRef = useRef({});

  // Resize
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [canvasRef]);

  // -- Drawing Logic --
  const drawElement = React.useCallback((ctx, element) => {
    ctx.beginPath();
    ctx.strokeStyle = element.color || '#000';
    ctx.fillStyle = element.fillColor || 'transparent'; 
    ctx.lineWidth = element.width || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Highlight if selected
    if (selectedElement && element.id === selectedElement.id) {
       ctx.shadowColor = '#00ff00';
       ctx.shadowBlur = 10;
    } else {
       ctx.shadowBlur = 0;
    }

    if (element.tool === 'brush' || element.tool === 'eraser') {
      if (element.points.length < 2) return;
      ctx.moveTo(element.points[0].x, element.points[0].y);
      for (let i = 1; i < element.points.length; i++) {
        ctx.lineTo(element.points[i].x, element.points[i].y);
      }
      ctx.stroke();
    } else if (element.tool === 'rectangle' || element.tool === 'square') {
       const start = element.start;
       const end = element.end;
       const w = end.x - start.x;
       // If square, constrain H to W
       let h = end.y - start.y;
       
       if (element.fillColor) ctx.fillRect(start.x, start.y, w, h);
       ctx.strokeRect(start.x, start.y, w, h);
    } else if (element.tool === 'circle') {
       const start = element.start;
       const end = element.end;
       // Ellipse
       const radiusX = Math.abs((end.x - start.x) / 2);
       const radiusY = Math.abs((end.y - start.y) / 2);
       const centerX = (start.x + end.x) / 2;
       const centerY = (start.y + end.y) / 2;
       
       ctx.beginPath();
       ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
       if (element.fillColor) ctx.fill();
       ctx.stroke();
    } else if (element.tool === 'triangle') {
        const start = element.start;
        const end = element.end;
        ctx.beginPath();
        ctx.moveTo((start.x + end.x) / 2, start.y); // Top Center
        ctx.lineTo(start.x, end.y); // Bottom Left
        ctx.lineTo(end.x, end.y); // Bottom Right
        ctx.closePath();
        if (element.fillColor) ctx.fill();
        ctx.stroke();
    } else if (element.tool === 'arrow') {
       const start = element.start;
       const end = element.end;
       ctx.moveTo(start.x, start.y);
       ctx.lineTo(end.x, end.y);
       ctx.stroke();
       const angle = Math.atan2(end.y - start.y, end.x - start.x);
       const headLength = 15;
       ctx.beginPath();
       ctx.moveTo(end.x, end.y);
       ctx.lineTo(end.x - headLength * Math.cos(angle - Math.PI / 6), end.y - headLength * Math.sin(angle - Math.PI / 6));
       ctx.moveTo(end.x, end.y);
       ctx.lineTo(end.x - headLength * Math.cos(angle + Math.PI / 6), end.y - headLength * Math.sin(angle + Math.PI / 6));
       ctx.stroke();
    } else if (element.tool === 'text') {
       ctx.font = `${element.width ? element.width * 10 : 20}px sans-serif`;
       ctx.fillStyle = element.color;
       ctx.fillText(element.text, element.x, element.y);
    } else if (element.tool === 'image') {
       if (!element.src) return;
       const cacheKey = element.id || element.src;
       if (!imageCacheRef.current[cacheKey]) {
         const img = new Image();
         img.src = element.src;
         imageCacheRef.current[cacheKey] = img;
       }
       const img = imageCacheRef.current[cacheKey];
       if (img.complete) {
         ctx.drawImage(img, element.x, element.y, element.width, element.height);
       }
    }
  }, [selectedElement]);

  const drawCursor = (ctx, user) => {
      // user: { x, y, color }
      const size = 10;
      ctx.beginPath();
      ctx.moveTo(user.x, user.y);
      ctx.lineTo(user.x + size, user.y + size * 1.5); // Pointer shape
      ctx.lineTo(user.x + size * 0.5, user.y + size * 1.5);
      ctx.lineTo(user.x + size * 0.5, user.y + size * 2.5); // tail
      // Just a simple arrow
      ctx.fillStyle = user.color || 'red';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      
      // Draw Cursor
      ctx.beginPath();
      ctx.moveTo(user.x, user.y);
      ctx.lineTo(user.x + 15, user.y + 10);
      ctx.lineTo(user.x + 5, user.y + 10);
      ctx.lineTo(user.x, user.y + 20); // Skewed
      ctx.lineTo(user.x, user.y);
      ctx.fill();
      ctx.stroke();

      // Nametag (Socket ID)
      ctx.font = '10px sans-serif';
      ctx.fillStyle = user.color || 'red';
      ctx.fillText(user.id.substr(0, 4), user.x + 10, user.y + 25);
  };

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply Pan & Zoom Transformation
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // FILTER: Only draw elements for this page
    const pageElements = elements.filter(el => el.pageId === pageId);
    
    pageElements.forEach(el => drawElement(ctx, el));
    
    // Draw dragging ghost or current
    if (currentElement) drawElement(ctx, currentElement);

    // Draw peer's current elements (what they are currently drawing)
    Object.values(peerElements).forEach(el => {
        if (el && el.pageId === pageId) drawElement(ctx, el);
    });

    ctx.restore();

    // -- Draw Peer Cursors (In Screen Space so they stay constant size) --
    Object.values(peerCursors).forEach(cursor => {
        if (cursor.pageId === pageId) {
            // World to Screen
            const screenX = cursor.x * zoom + panOffset.x;
            const screenY = cursor.y * zoom + panOffset.y;
            drawCursor(ctx, { ...cursor, x: screenX, y: screenY });
        }
    });

  }, [elements, currentElement, pageId, selectedElement, panOffset, zoom, peerCursors, peerElements, canvasRef, drawElement]);

  const emitSnapshot = React.useCallback(() => {
    if (!roomId || !canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      socket.emit('save_snapshot', { roomId, dataUrl });
    } catch {
      // Silent fail
    }
  }, [roomId, canvasRef]);

  // Auto-save snapshot to DB (debounced)
  useEffect(() => {
    if (!roomId || !canvasRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      emitSnapshot();
    }, 1200);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [elements, roomId, canvasRef, emitSnapshot]);
  // Socket
  useEffect(() => {
    socket.on('history_update', (historyData) => {
        if (Array.isArray(historyData)) {
            setElements(historyData);
        }
    });
    // Stroke Draw Listener
    socket.on('stroke_draw', (data) => {
        setPeerElements(prev => ({ ...prev, [data.userId]: data.element }));
    });

    socket.on('stroke_end', (data) => {
        const userId = data.userId;
        if (userId) {
            setPeerElements(prev => {
                const next = { ...prev };
                delete next[userId];
                return next;
            });
        }
    });

    socket.on('redo_update', (data) => {
      const list = Array.isArray(data) ? data : [];
      setRedoStack(list);
      setCanRedo(list.length > 0);
    });

    socket.on('stroke_update', () => {
        // Broad history_update handles this now, but we can keep it for specific optims if any
    });

    // Cursor Listeners
    socket.on('cursor_move', (data) => {
        setPeerCursors(prev => ({ ...prev, [data.id]: data }));
    });
    socket.on('user_disconnected', (id) => {
        setPeerCursors(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
        setPeerElements(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    });

    return () => {
      socket.off('history_update');
      socket.off('stroke_draw');
      socket.off('stroke_end');
      socket.off('redo_update');
      socket.off('cursor_move');
      socket.off('user_disconnected');
    };
  }, []);

  const applyUndoLocal = React.useCallback(() => {
    setElements((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      setRedoStack((redoPrev) => {
        const next = [...redoPrev, last];
        setCanRedo(next.length > 0);
        return next;
      });
      return prev.slice(0, -1);
    });
  }, []);

  const applyRedoLocal = React.useCallback(() => {
    setRedoStack((redoPrev) => {
      if (!redoPrev.length) return redoPrev;
      const redoItem = redoPrev[redoPrev.length - 1];
      setElements((prev) => [...prev, redoItem]);
      const next = redoPrev.slice(0, -1);
      setCanRedo(next.length > 0);
      return next;
    });
  }, []);

  const handleUndo = React.useCallback(() => {
    applyUndoLocal();
    onUndo && onUndo();
  }, [applyUndoLocal, onUndo]);

  const handleRedo = React.useCallback(() => {
    applyRedoLocal();
    onRedo && onRedo();
  }, [applyRedoLocal, onRedo]);

  useEffect(() => {
    const onUndoEvent = () => applyUndoLocal();
    const onRedoEvent = () => applyRedoLocal();
    window.addEventListener('canvas:undo', onUndoEvent);
    window.addEventListener('canvas:redo', onRedoEvent);
    return () => {
      window.removeEventListener('canvas:undo', onUndoEvent);
      window.removeEventListener('canvas:redo', onRedoEvent);
    };
  }, [applyUndoLocal, applyRedoLocal]);

  // Keyboard Shortcuts (Rule: Ctrl+Z for Undo, Ctrl+Shift+Z for Redo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.altKey && e.key.toLowerCase() === 'm') {
           e.preventDefault();
           setActiveTool('comment');
           return;
        }
        if (e.key === 'z') {
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
          e.preventDefault();
        } else if (e.key === 'y') {
          handleRedo();
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const getPos = (e) => {
     const canvas = canvasRef.current;
     if (!canvas) return { x: 0, y: 0 };
     const rect = canvas.getBoundingClientRect();
     
     // 1. Normalize for CSS Scaling (if any)
     const scaleX = canvas.width / rect.width;
     const scaleY = canvas.height / rect.height;
     
     // 2. Map screen to canvas pixels
     const x = (e.clientX - rect.left) * scaleX;
     const y = (e.clientY - rect.top) * scaleY;
     
     // 3. Subtract Pan and Scale by Zoom to get World Coordinates
     return { 
         x: (x - panOffset.x) / zoom, 
         y: (y - panOffset.y) / zoom 
     };
  };

  const handleZoom = (factor) => {
    setZoom(prev => {
        const newZoom = Math.min(Math.max(prev * factor, 0.1), 10);
        return newZoom;
    });
  };

  const resetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // External menu actions
  useEffect(() => {
    const handleZoomIn = () => handleZoom(1.2);
    const handleZoomOut = () => handleZoom(0.8);
    const handleReset = () => resetZoom();
    const handleSave = () => emitSnapshot();
    const handleImportImage = (e) => {
      const dataUrl = e?.detail?.dataUrl;
      if (!dataUrl) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const width = canvas.width / zoom;
      const height = canvas.height / zoom;

      const imageElement = {
        id: generateId(),
        pageId,
        tool: 'image',
        src: dataUrl,
        x: 0,
        y: 0,
        width,
        height,
        author: socket.id,
        timestamp: Date.now()
      };

      setElements(prev => [...prev, imageElement]);
      setRedoStack([]);
      setCanRedo(false);
      socket.emit('stroke_end', imageElement);
    };

    const handleSelectAll = () => {
        const pageElements = elements.filter(el => el.pageId === pageId);
        if (pageElements.length > 0) {
            // Standard behavior: selecting all might be complex if we only support single select.
            // For now, let's select the last one or implement a group select later.
            // But usually Select All highlights everything. 
            // Our drawElement only highlights selectedElement. 
            // Let's at least select the most recent one for now, 
            // or better, implement a "delete all" if that's what user expects.
            // Actually, let's just select the top element.
            setSelectedElement(pageElements[pageElements.length - 1]);
        }
    };

    const handleDeselect = () => setSelectedElement(null);

    const handleDeleteSelection = () => {
        if (selectedElement) {
            setElements(prev => prev.filter(el => el.id !== selectedElement.id));
            socket.emit('clear'); // Or a dedicated delete_stroke event. 
            // Wait, clearing the whole board is bad. Let's add update_state to drawingState.
            // For now, clear() is the only "delete-like" event we have.
            // Let's implement socket.emit('delete_stroke', selectedElement.id) in backend.
            socket.emit('delete_stroke', selectedElement.id);
            setSelectedElement(null);
        }
    };

    const handleFlipHorizontal = () => {
        if (selectedElement) {
            const flipped = { ...selectedElement, id: generateId() };
            // Flip logic depends on tool. For shapes, swap start.x and end.x
            if (flipped.start && flipped.end) {
                const temp = flipped.start.x;
                flipped.start.x = flipped.end.x;
                flipped.end.x = temp;
            } else if (flipped.points) {
                // Find bounds and flip points
                const minX = Math.min(...flipped.points.map(p => p.x));
                const maxX = Math.max(...flipped.points.map(p => p.x));
                const midX = (minX + maxX) / 2;
                flipped.points = flipped.points.map(p => ({ ...p, x: 2 * midX - p.x }));
            }
            setElements(prev => prev.map(el => el.id === selectedElement.id ? flipped : el));
            socket.emit('stroke_update', flipped);
            setSelectedElement(flipped);
        }
    };

    const handleCopy = () => {
        if (selectedElement) {
            setClipboard({ ...selectedElement });
        }
    };

    const handlePaste = () => {
        if (clipboard) {
            const pasted = { 
                ...clipboard, 
                id: generateId(),
                x: (clipboard.x || clipboard.start?.x || 0) + 20,
                y: (clipboard.y || clipboard.start?.y || 0) + 20
            };
            // If it has points (brush), shift them
            if (pasted.points) {
                pasted.points = pasted.points.map(p => ({ x: p.x + 20, y: p.y + 20 }));
            }
            // If it has start/end (shapes), shift them
            if (pasted.start && pasted.end) {
                pasted.start = { x: pasted.start.x + 20, y: pasted.start.y + 20 };
                pasted.end = { x: pasted.end.x + 20, y: pasted.end.y + 20 };
            }
            setElements(prev => [...prev, pasted]);
            socket.emit('stroke_end', pasted);
            setSelectedElement(pasted);
        }
    };

    window.addEventListener('canvas:zoom-in', handleZoomIn);
    window.addEventListener('canvas:zoom-out', handleZoomOut);
    window.addEventListener('canvas:reset-view', handleReset);
    window.addEventListener('canvas:save', handleSave);
    window.addEventListener('canvas:import-image', handleImportImage);
    window.addEventListener('canvas:select-all', handleSelectAll);
    window.addEventListener('canvas:deselect', handleDeselect);
    window.addEventListener('canvas:delete-selection', handleDeleteSelection);
    window.addEventListener('canvas:flip-horizontal', handleFlipHorizontal);
    window.addEventListener('canvas:copy', handleCopy);
    window.addEventListener('canvas:paste', handlePaste);

    return () => {
      window.removeEventListener('canvas:zoom-in', handleZoomIn);
      window.removeEventListener('canvas:zoom-out', handleZoomOut);
      window.removeEventListener('canvas:reset-view', handleReset);
      window.removeEventListener('canvas:save', handleSave);
      window.removeEventListener('canvas:import-image', handleImportImage);
      window.removeEventListener('canvas:select-all', handleSelectAll);
      window.removeEventListener('canvas:deselect', handleDeselect);
      window.removeEventListener('canvas:delete-selection', handleDeleteSelection);
      window.removeEventListener('canvas:flip-horizontal', handleFlipHorizontal);
      window.removeEventListener('canvas:copy', handleCopy);
      window.removeEventListener('canvas:paste', handlePaste);
    };
  }, [roomId, pageId, zoom, canvasRef, emitSnapshot, elements, selectedElement, clipboard]);

  // HANDLERS
  const handleMouseDown = (e) => {
    const pos = getPos(e); // World Pos for drawing/selecting

    // 0. PAN TOOL (Uses Raw Screen Coords for delta)
    if (activeTool === 'pan') {
        setIsPanning(true);
        setStartPan({ x: e.clientX, y: e.clientY });
        return;
    }

    // 1. SELECT / MOVE TOOL
    if (activeTool === 'select') {
        const pageElements = elements.filter(el => el.pageId === pageId);
        let hit = null;
        for (let i = pageElements.length - 1; i >= 0; i--) {
            if (isPointInElement(pos.x, pos.y, pageElements[i])) {
                hit = pageElements[i];
                break;
            }
        }

        if (hit) {
            setSelectedElement(hit);
            setIsDragging(true);
            setDragOffset({ x: pos.x, y: pos.y }); // World offset
        } else {
            setSelectedElement(null);
        }
        return;
    }

    if (activeTool === 'text') return; // Handled by Click

    // 2. FILL TOOL
    if (activeTool === 'fill') {
        const pageElements = elements.filter(el => el.pageId === pageId);
        for (let i = pageElements.length - 1; i >= 0; i--) {
            if (isPointInElement(pos.x, pos.y, pageElements[i])) {
                const el = pageElements[i];
                const updated = { ...el, fillColor: color, id: generateId() }; 
                if (!['rectangle', 'square', 'circle', 'triangle'].includes(el.tool)) {
                    updated.color = color;
                }
                setElements(prev => [...prev, updated]);
                setRedoStack([]);
                setCanRedo(false);
                socket.emit('stroke_end', updated);
                break;
            }
        }
        return;
    }

    // 3. DRAWING
    setIsDrawing(true);
    const id = generateId(); // Use helper

    if (activeTool === 'brush' || activeTool === 'eraser') {
      setCurrentElement({
        id, pageId,
        tool: activeTool,
        color: activeTool === 'eraser' ? '#ffffff' : color,
        width: activeTool === 'eraser' ? 20 : strokeWidth,
        points: [pos],
        author: socket.id, // Rule 18: Author
        timestamp: Date.now() // Rule 18: Timestamp
      });
    } else { // Shapes
      setCurrentElement({
        id, pageId,
        tool: activeTool,
        color: color,
        width: strokeWidth,
        start: pos,
        end: pos,
        author: socket.id, // Rule 18: Author
        timestamp: Date.now() // Rule 18: Timestamp
      });
    }
  };

  const handleMouseMove = (e) => {
    // -- 1. Emit Cursor Position (Throttled) --
    const now = Date.now();
    if (now - lastEmitRef.current > 50) {
        const pos = getPos(e);
        // We emit WORLD coordinates so if peer has different pan, it's correct relative to drawing
        socket.emit('cursor_move', {
            x: pos.x,
            y: pos.y,
            pageId,
            color: activeTool === 'eraser' ? 'gray' : color // Show tool color or simple logic
        });
        lastEmitRef.current = now;
    }

    // PAN LOGIC (Uses Raw Screen Coords)
    if (isPanning) {
        const dx = e.clientX - startPan.x;
        const dy = e.clientY - startPan.y;
        setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        setStartPan({ x: e.clientX, y: e.clientY }); // Reset start to current for next delta
        return;
    }

    const pos = getPos(e); // World Pos

    // MOVE LOGIC
    if (activeTool === 'select' && isDragging && selectedElement) {
        const dx = pos.x - dragOffset.x;
        const dy = pos.y - dragOffset.y;
        
        // DUPLICATE (Alt + Drag) - Trigger strictly once at start
        if (e.altKey && !selectedElement.isClone) {
             const clone = { 
                 ...selectedElement, 
                 id: generateId(),
                 isClone: true 
             };
             const movedClone = moveElement(clone, dx, dy);
             setElements(prev => [...prev, movedClone]);
             setRedoStack([]);
             setCanRedo(false);
             setSelectedElement(movedClone); 
             setDragOffset(pos); 
             socket.emit('stroke_end', movedClone);
             return;
        }

        const moved = moveElement(selectedElement, dx, dy);
        setElements(prev => prev.map(el => el.id === moved.id ? moved : el));
        setSelectedElement(moved);
        setDragOffset(pos);
        socket.emit('stroke_update', moved);
        return;
    }


    if (!isDrawing || !currentElement) return;

    let updated;
    if (currentElement.tool === 'brush' || currentElement.tool === 'eraser') {
       updated = { ...currentElement, points: [...currentElement.points, pos] };
    } else {
       updated = { ...currentElement, end: pos };
    }
    
    setCurrentElement(updated);

    // Throttled stroke_draw emission
    if (now - lastStrokeEmitRef.current > 30) {
        socket.emit('stroke_draw', {
            userId: socket.id,
            element: updated
        });
        lastStrokeEmitRef.current = now;
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
        setIsPanning(false);
        return;
    }

    if (activeTool === 'select') {
        setIsDragging(false);
        if (isDragging) {
          setRedoStack([]);
          setCanRedo(false);
        }
        if (selectedElement && selectedElement.isClone) {
            // Clean up marker
            const clean = { ...selectedElement };
            delete clean.isClone;
            socket.emit('stroke_update', clean); // Finalize
        }
        return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentElement) {
      // Optimistic Update: Add to local state immediately to prevent "disappearing" flicker
      // The server's history_update will eventually reconcile this with the authoritative state.
      setElements(prev => [...prev, currentElement]);
      setRedoStack([]);
      setCanRedo(false);
      
      socket.emit('stroke_end', currentElement);
      setCurrentElement(null);
    }
  };

  const handleCanvasClick = (e) => {
    if (activeTool === 'text' && !textInput) {
       const pos = getPos(e);
       setTextInput({ x: pos.x, y: pos.y, value: '' });
    }
    if (activeTool === 'comment') {
        const pos = getPos(e);
        setCommentInput({ 
            x: pos.x, 
            y: pos.y, 
            screenX: e.clientX, 
            screenY: e.clientY 
        });
    }
  };

  const commitText = () => {
    if (!textInput || !textInput.value.trim()) {
      setTextInput(null);
      return;
    }
    const newEl = {
      id: generateId(),
      pageId,
      tool: 'text',
      text: textInput.value,
      x: textInput.x,
      y: textInput.y,
      color: color,
      width: 2,
      author: socket.id,
      timestamp: Date.now()
    };
    // Optimistic Update
    setElements(prev => [...prev, newEl]);
    setRedoStack([]);
    setCanRedo(false);
    socket.emit('stroke_end', newEl);
    setTextInput(null);
  };

  // Custom Cursors (SVG Data URIs)
  const cursorPencil = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>') 0 24, auto`;
  
  const cursorEraser = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>') 12 12, auto`;

  const getCursor = () => {
      if (activeTool === 'select') return 'move';
      if (activeTool === 'fill') return 'copy'; 
      if (activeTool === 'text') return 'text';
      if (activeTool === 'pan') return isPanning ? 'grabbing' : 'grab';
      if (activeTool === 'brush') return cursorPencil;
      if (activeTool === 'comment') return 'cell';
      if (activeTool === 'eraser') return cursorEraser;
      return 'crosshair';
  };

  return (
    <div ref={containerRef} className="w-full h-full relative" style={{ cursor: getCursor() }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        className="block"
      />

      {/* Vertical Canvas Toolbar (Refined to match Magma/User reference) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center bg-white border border-gray-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] py-2 px-1 gap-1 z-40">
          <ToolbarButton icon={Undo2} onClick={handleUndo} title="Undo (Ctrl+Z)" disabled={elements.length === 0} />
          <ToolbarButton icon={Redo2} onClick={handleRedo} title="Redo (Ctrl+Shift+Z)" disabled={!canRedo && redoStack.length === 0} />
          
          <div className="w-8 h-px bg-gray-100 my-1"></div>
          
          <ToolbarButton icon={ZoomIn} onClick={() => handleZoom(1.2)} title="Zoom In" />
          <div className="flex flex-col items-center select-none py-0.5">
            <span className="text-[11px] font-bold text-gray-500 font-sans">{Math.round(zoom * 100)}%</span>
          </div>
          <ToolbarButton icon={ZoomOut} onClick={() => handleZoom(0.8)} title="Zoom Out" />
          
          <ToolbarButton icon={Maximize} onClick={resetZoom} title="Reset View" />
          
          <div className="w-8 h-px bg-gray-100 my-1"></div>
          
          <ToolbarButton icon={MousePointer2} onClick={() => {/* Future Move Tool toggle */}} title="Move Tool" />
      </div>

      {textInput && (
        <input
          autoFocus
          value={textInput.value}
          onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
          onBlur={commitText}
          onKeyDown={(e) => e.key === 'Enter' && commitText()}
          style={{
            position: 'absolute',
            left: textInput.x + panOffset.x,
            top: textInput.y + panOffset.y - 12,
            background: 'transparent',
            border: '1px dashed blue',
            color: color,
            fontSize: '20px',
            outline: 'none',
            zIndex: 100
          }}
        />
      )}

      {/* Comments */}
      {comments.map((comment) => (
        <div
          key={comment._id}
          className="absolute z-30 group"
          style={{
            left: comment.x * zoom + panOffset.x,
            top: comment.y * zoom + panOffset.y,
            transform: 'translate(-50%, -50%)'
          }}
          onMouseEnter={() => setHoveredComment(comment._id)}
          onMouseLeave={() => setHoveredComment(null)}
        >
          <div className="w-8 h-8 rounded-full bg-green-600 border-2 border-white shadow-lg flex items-center justify-center text-white cursor-pointer group-hover:scale-110 transition-transform">
            <MessageSquare size={16} />
          </div>
          {(hoveredComment === comment._id) && (
            <div className="absolute left-full ml-2 top-0 bg-white border border-gray-100 rounded-xl shadow-2xl p-4 w-64 z-50">
               <div className="flex items-center gap-4 mb-2">
                 <img src={comment.authorAvatar} alt="" className="w-5 h-5 rounded-full" />
                 <span className="text-xs font-bold text-gray-700">{comment.authorName}</span>
                 <span className="text-[10px] text-gray-400 ml-auto whitespace-nowrap">{new Date(comment.createdAt).toLocaleTimeString()}</span>
               </div>
               <p className="text-sm text-gray-600 mb-3 leading-relaxed">{comment.text}</p>
               <button 
                  onClick={() => socket.emit('resolve_comment', comment._id)}
                  className="w-full py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-100"
               >
                 Resolve
               </button>
            </div>
          )}
        </div>
      ))}

      {/* New Comment Input */}
      {commentInput && (
        <div
          className="absolute z-50 bg-white border border-gray-100 rounded-2xl shadow-2xl p-4 w-72"
          style={{
            left: commentInput.screenX,
            top: commentInput.screenY,
            transform: 'translate(10px, 10px)'
          }}
        >
          <textarea
            autoFocus
            placeholder="Add a comment..."
            className="w-full text-sm border-0 focus:ring-0 resize-none p-0 mb-3 text-gray-600 placeholder:text-gray-400"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const text = e.target.value.trim();
                if (text) {
                  socket.emit('add_comment', {
                    x: commentInput.x,
                    y: commentInput.y,
                    text: text,
                    authorName: user?.fullName || 'Guest',
                    authorAvatar: user?.imageUrl,
                    authorId: user?.id
                  });
                }
                setCommentInput(null);
              }
              if (e.key === 'Escape') setCommentInput(null);
            }}
          />
          <div className="flex justify-between items-center border-t border-gray-50 pt-3">
            <span className="text-[10px] text-gray-400">Press Enter to post</span>
            <button 
                onClick={() => setCommentInput(null)}
                className="text-xs font-medium text-gray-400 hover:text-gray-600 p-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ToolbarButton = ({ icon, onClick, title, disabled }) => (
  <button
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`p-2 rounded-lg transition-all active:scale-95 group relative ${
        disabled 
        ? "text-gray-300 cursor-not-allowed" 
        : "text-gray-600 hover:text-green-700 hover:bg-green-50"
    }`}
  >
    {React.createElement(icon, { size: 20 })}
    {/* Tooltip on right */}
    {!disabled && (
      <span className="absolute right-full mr-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
        {title}
      </span>
    )}
  </button>
);

export default Canvas;

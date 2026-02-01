import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { socket } from '../socket';
import { 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  MousePointer2 
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
   } else {
      newEl.start = { x: newEl.start.x + dx, y: newEl.start.y + dy };
      newEl.end = { x: newEl.end.x + dx, y: newEl.end.y + dy };
   }
   return newEl;
};

const Canvas = ({ activeTool, color, setColor, strokeWidth, pageId, canvasRef, onUndo, onRedo }) => {
  // const canvasRef = useRef(null); // Lifted to App.jsx
  const containerRef = useRef(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState([]); 
  const [currentElement, setCurrentElement] = useState(null); 
  const [peerElements, setPeerElements] = useState({}); // { socketId: element }
  const [textInput, setTextInput] = useState(null); 
  
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

  const [peerCursors, setPeerCursors] = useState({});
  const lastEmitRef = useRef(0);
  const lastStrokeEmitRef = useRef(0);

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
  }, []);

  // -- Drawing Logic --
  const drawElement = (ctx, element) => {
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
    }
  };

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

  }, [elements, currentElement, pageId, selectedElement, panOffset, zoom, peerCursors, peerElements]);
  // Socket
  useEffect(() => {
    socket.on('history', (historyData) => setElements(historyData));
    // Stroke Draw Listener
    socket.on('stroke_draw', (data) => {
        setPeerElements(prev => ({ ...prev, [data.userId]: data.element }));
    });

    socket.on('stroke_end', (data) => {
        const element = data.element || data; // handle old and new format
        const userId = data.userId;

        setElements(prev => {
            const idx = prev.findIndex(e => e.id === element.id);
            if (idx !== -1) {
                const copy = [...prev];
                copy[idx] = element;
                return copy;
            }
            return [...prev, element];
        });

        if (userId) {
            setPeerElements(prev => {
                const next = { ...prev };
                delete next[userId];
                return next;
            });
        }
    });

    socket.on('redo_stack', (data) => {
        setCanRedo(data && data.length > 0);
    });

    socket.on('stroke_update', (data) => {
        const element = data.element || data;
        setElements(prev => prev.map(el => el.id === element.id ? element : el));
        setCanRedo(false); // New action clears redo stack
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
      socket.off('history');
      socket.off('stroke_draw');
      socket.off('stroke_end');
      socket.off('cursor_move');
      socket.off('user_disconnected');
      socket.off('redo_stack');
      socket.off('stroke_update');
    };
  }, []);

  // Keyboard Shortcuts (Rule: Ctrl+Z for Undo, Ctrl+Shift+Z for Redo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          if (e.shiftKey) {
            onRedo();
          } else {
            onUndo();
          }
          e.preventDefault();
        } else if (e.key === 'y') {
          onRedo();
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo]);

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
      setElements(prev => [...prev, currentElement]);
      socket.emit('stroke_end', currentElement);
      setCurrentElement(null);
    }
  };

  const handleCanvasClick = (e) => {
    if (activeTool === 'text' && !textInput) {
       const pos = getPos(e);
       setTextInput({ x: pos.x, y: pos.y, value: '' });
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
    setElements(prev => [...prev, newEl]);
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
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center bg-white border border-gray-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] py-2 px-1 gap-1 z-40">
          <ToolbarButton icon={Undo2} onClick={onUndo} title="Undo (Ctrl+Z)" disabled={elements.length === 0} />
          <ToolbarButton icon={Redo2} onClick={onRedo} title="Redo (Ctrl+Shift+Z)" disabled={!canRedo} />
          
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
    </div>
  );
};

const ToolbarButton = ({ icon: Icon, onClick, title, disabled }) => (
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
    <Icon size={20} />
    {/* Tooltip on right */}
    {!disabled && (
        <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            {title}
        </span>
    )}
  </button>
);

export default Canvas;

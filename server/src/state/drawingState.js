const Drawing = require('../models/drawing.model');

const roomDrawings = {}; // { roomId: { undoStack, redoStack, name } }

const getDrawing = (roomId) => {
    if (!roomDrawings[roomId]) {
        console.log(`[STATE] Initializing memory for room: ${roomId}`);
        roomDrawings[roomId] = {
            undoStack: [],
            redoStack: [],
            name: 'Untitled Drawing'
        };
    }
    return roomDrawings[roomId];
};

const drawingState = {
  initialize: async (roomId) => {
    const data = await Drawing.findOrCreate(roomId);
    const drawing = getDrawing(roomId);
    drawing.undoStack = data.strokes || [];
    drawing.name = data.name || 'Untitled Drawing';
    drawing.redoStack = data.redoStack || [];
  },

  addStroke: async (roomId, stroke) => {
    const drawing = getDrawing(roomId);
    const existingIdx = drawing.undoStack.findIndex(el => el.id === stroke.id);
    
    if (existingIdx !== -1) {
       drawing.undoStack[existingIdx] = stroke;
       await Drawing.saveState(roomId, { strokes: drawing.undoStack, redoStack: drawing.redoStack });
    } else {
       drawing.undoStack.push(stroke);
       drawing.redoStack = []; // Clear redo stack on new stroke
       await Drawing.saveState(roomId, { strokes: drawing.undoStack, redoStack: [] });
    }
  },

  updateStroke: async (roomId, stroke) => {
    const drawing = getDrawing(roomId);
    const index = drawing.undoStack.findIndex(el => el.id === stroke.id);
    if (index !== -1) {
       drawing.undoStack[index] = stroke;
       drawing.redoStack = []; // Standard undo/redo behavior: new action clears redo stack
       await Drawing.saveState(roomId, { strokes: drawing.undoStack, redoStack: [] });
    }
  },

  undo: async (roomId) => {
    const drawing = getDrawing(roomId);
    if (drawing.undoStack.length > 0) {
      const stroke = drawing.undoStack.pop();
      drawing.redoStack.push(stroke);
      await Drawing.saveState(roomId, { strokes: drawing.undoStack, redoStack: drawing.redoStack });
      return true;
    }
    return false;
  },

  redo: async (roomId) => {
    const drawing = getDrawing(roomId);
    if (drawing.redoStack.length > 0) {
      const stroke = drawing.redoStack.pop();
      drawing.undoStack.push(stroke);
      await Drawing.saveState(roomId, { strokes: drawing.undoStack, redoStack: drawing.redoStack });
      return true;
    }
    return false;
  },

  clear: async (roomId) => {
    const drawing = getDrawing(roomId);
    drawing.undoStack = [];
    drawing.redoStack = [];
    await Drawing.saveState(roomId, { strokes: [], redoStack: [] });
  },

  setName: async (roomId, newName) => {
    const drawing = getDrawing(roomId);
    drawing.name = newName;
    await Drawing.rename(roomId, newName);
  },

  getHistory: (roomId) => getDrawing(roomId).undoStack,
  getName: (roomId) => getDrawing(roomId).name,
  getDrawing: (roomId) => getDrawing(roomId)
};

module.exports = drawingState;

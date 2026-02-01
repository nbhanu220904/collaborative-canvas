const Drawing = require('../models/drawing.model');

const roomDrawings = {}; // { roomId: { history, redoStack, name } }

const getDrawing = (roomId) => {
    if (!roomDrawings[roomId]) {
        roomDrawings[roomId] = {
            history: [],
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
    drawing.history = data.strokes || [];
    drawing.name = data.name || 'Untitled Drawing';
    drawing.redoStack = data.redoStack || [];
  },

  addStroke: async (roomId, stroke) => {
    const drawing = getDrawing(roomId);
    const existingIdx = drawing.history.findIndex(el => el.id === stroke.id);
    
    if (existingIdx !== -1) {
       drawing.history[existingIdx] = stroke;
       await Drawing.saveState(roomId, { strokes: drawing.history, redoStack: drawing.redoStack });
    } else {
       drawing.history.push(stroke);
       drawing.redoStack = []; // Clear redo stack on new stroke
       await Drawing.saveState(roomId, { strokes: drawing.history, redoStack: [] });
    }
  },

  updateStroke: async (roomId, stroke) => {
    const drawing = getDrawing(roomId);
    const index = drawing.history.findIndex(el => el.id === stroke.id);
    if (index !== -1) {
       drawing.history[index] = stroke;
       drawing.redoStack = []; // Standard undo/redo behavior: new action clears redo stack
       await Drawing.saveState(roomId, { strokes: drawing.history, redoStack: [] });
    }
  },

  undo: async (roomId) => {
    const drawing = getDrawing(roomId);
    if (drawing.history.length > 0) {
      const stroke = drawing.history.pop();
      drawing.redoStack.push(stroke);
      await Drawing.saveState(roomId, { strokes: drawing.history, redoStack: drawing.redoStack });
      return true;
    }
    return false;
  },

  redo: async (roomId) => {
    const drawing = getDrawing(roomId);
    if (drawing.redoStack.length > 0) {
      const stroke = drawing.redoStack.pop();
      drawing.history.push(stroke);
      await Drawing.saveState(roomId, { strokes: drawing.history, redoStack: drawing.redoStack });
      return true;
    }
    return false;
  },

  clear: async (roomId) => {
    const drawing = getDrawing(roomId);
    drawing.history = [];
    drawing.redoStack = [];
    await Drawing.saveState(roomId, { strokes: [], redoStack: [] });
  },

  setName: async (roomId, newName) => {
    const drawing = getDrawing(roomId);
    drawing.name = newName;
    await Drawing.rename(roomId, newName);
  },

  getHistory: (roomId) => getDrawing(roomId).history,
  getName: (roomId) => getDrawing(roomId).name,
  getDrawing: (roomId) => getDrawing(roomId)
};

module.exports = drawingState;

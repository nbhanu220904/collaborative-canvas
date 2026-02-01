const drawingState = require('../state/drawingState');

module.exports = (io, socket) => {
  // DRAW
  socket.on('stroke_draw', (data) => {
      if (socket.roomId) {
        socket.to(socket.roomId).emit('stroke_draw', data);
      }
  });

  // END (COMMIT)
  socket.on('stroke_end', async (strokeData) => {
      const roomId = socket.roomId;
      if (!roomId) return;
      await drawingState.addStroke(roomId, strokeData);
      socket.to(roomId).emit('stroke_end', { element: strokeData, userId: socket.id });
      // Rule 21: Broadcast that redo stack is now cleared for everyone
      io.to(roomId).emit('redo_stack', []); 
  });

  // UPDATE (MOVE/RESYNC)
  socket.on('stroke_update', async (updatedStroke) => {
      const roomId = socket.roomId;
      if (!roomId) return;
      await drawingState.updateStroke(roomId, updatedStroke);
      socket.to(roomId).emit('stroke_update', { element: updatedStroke, userId: socket.id }); 
      // Rule 21: Broadcast that redo stack is now cleared for everyone
      io.to(roomId).emit('redo_stack', []);
  });

  // UNDO
  socket.on('undo', async () => {
      const roomId = socket.roomId;
      if (!roomId) return;
      if (await drawingState.undo(roomId)) {
          const drawing = drawingState.getDrawing(roomId);
          io.to(roomId).emit('history', drawing.history);
          io.to(roomId).emit('redo_stack', drawing.redoStack);
      }
  });

  // REDO
  socket.on('redo', async () => {
      const roomId = socket.roomId;
      if (!roomId) return;
      if (await drawingState.redo(roomId)) {
          const drawing = drawingState.getDrawing(roomId);
          io.to(roomId).emit('history', drawing.history);
          io.to(roomId).emit('redo_stack', drawing.redoStack);
      }
  });

  // CLEAR
  socket.on('clear', async () => {
      const roomId = socket.roomId;
      if (!roomId) return;
      await drawingState.clear(roomId);
      io.to(roomId).emit('history', []);
      io.to(roomId).emit('redo_stack', []); // Clear redo stack for all
  });
};

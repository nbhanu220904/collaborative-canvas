const drawingState = require('../state/drawingState');
const Drawing = require('../models/drawing.model');

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
      const history = drawingState.getHistory(roomId);
      // Rule: Broadcast full history for replay compliance
      io.to(roomId).emit('history_update', history || []);
      io.to(roomId).emit('redo_update', []);
      // Cleanup trail for peers
      socket.to(roomId).emit('stroke_end', { userId: socket.id });
  });

  // UPDATE (MOVE/RESYNC)
  socket.on('stroke_update', async (updatedStroke) => {
      const roomId = socket.roomId;
      if (!roomId) return;
      await drawingState.updateStroke(roomId, updatedStroke);
      io.to(roomId).emit('history_update', drawingState.getHistory(roomId)); 
      io.to(roomId).emit('redo_update', []);
  });

  // UNDO
  socket.on('undo', async () => {
      const roomId = socket.roomId;
      if (!roomId) return;
      if (await drawingState.undo(roomId)) {
          const drawing = drawingState.getDrawing(roomId);
          io.to(roomId).emit('history_update', drawing.undoStack);
          io.to(roomId).emit('redo_update', drawing.redoStack);
      }
  });

  // REDO
  socket.on('redo', async () => {
      const roomId = socket.roomId;
      if (!roomId) return;
      if (await drawingState.redo(roomId)) {
          const drawing = drawingState.getDrawing(roomId);
          io.to(roomId).emit('history_update', drawing.undoStack);
          io.to(roomId).emit('redo_update', drawing.redoStack);
      }
  });

  // CLEAR
  socket.on('clear', async () => {
      const roomId = socket.roomId;
      if (!roomId) return;
      await drawingState.clear(roomId);
      io.to(roomId).emit('history_update', []);
      io.to(roomId).emit('redo_update', []); 
  });

  // DELETE STROKE
  socket.on('delete_stroke', async (strokeId) => {
      const roomId = socket.roomId;
      if (!roomId) return;
      await drawingState.deleteStroke(roomId, strokeId);
      io.to(roomId).emit('history_update', drawingState.getHistory(roomId));
  });

    // SAVE SNAPSHOT (thumbnail)
    socket.on('save_snapshot', async ({ roomId, dataUrl }) => {
            const resolvedRoomId = roomId || socket.roomId;
            if (!resolvedRoomId || !dataUrl) return;
            await Drawing.updateSnapshot(resolvedRoomId, dataUrl);
            
            // Broadcast updated thumbnail to all clients for Home page
            io.emit('drawing_updated', {
              roomId: resolvedRoomId,
              thumbnail: dataUrl,
              lastModified: new Date().toISOString()
            });
    });
};

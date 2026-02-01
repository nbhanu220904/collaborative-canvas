const roomState = require('../state/roomState');
const drawingState = require('../state/drawingState');
const Comment = require('../models/comment.model');
const logger = require('../utils/logger');

module.exports = (io, socket) => {
  // JOIN
  socket.on('join_room', (userData) => {
      const { email, password, roomId = 'main-room' } = userData;
      socket.roomId = roomId;
      socket.join(roomId);

      if (roomState.isAllowed(roomId, email, password)) {
          // Initialize drawing state if not already done
          drawingState.initialize(roomId).then(async () => {
              socket.emit('history_update', drawingState.getHistory(roomId));
              socket.emit('drawing_name', drawingState.getName(roomId));
              socket.emit('room_settings', roomState.getSettings(roomId));
              // Restore redoStack sync
              const drawing = drawingState.getDrawing?.(roomId) || {};
              socket.emit('redo_update', drawing.redoStack || []);

              // Fetch and emit comments
              try {
                  const comments = await Comment.getByRoom(roomId);
                  socket.emit('comments_update', comments);
              } catch (err) {
                  logger.error('Failed to fetch comments on join:', err);
              }
          });

          roomState.addUser(roomId, socket.id, userData);
          io.to(roomId).emit('room_users', roomState.getUsers(roomId));
          logger.info(`Access Granted: ${email} to ${roomId}`);
      } else {
          logger.warn(`Access Denied: ${email} to ${roomId}`);
          const settings = roomState.getSettings(roomId);
          socket.emit('access_denied', { reason: settings.password ? 'password_required' : 'invite_only' });
      }
  });

  // SETTINGS
  socket.on('update_settings', (newSettings) => {
      const roomId = socket.roomId;
      if (!roomId) return;
      logger.info(`Settings Updated for ${roomId}: ${JSON.stringify(newSettings)}`);
      roomState.updateSettings(roomId, newSettings);
      io.to(roomId).emit('room_settings', roomState.getSettings(roomId));
  });

  // RENAME
  socket.on('rename_drawing', async (newName) => {
      const roomId = socket.roomId;
      if (!roomId) return;
      logger.info(`Drawing Renamed in ${roomId} to ${newName}`);
      await drawingState.setName(roomId, newName);
      
      const updated = drawingState.getDrawing(roomId);
      io.to(roomId).emit('drawing_name', newName); // Local room update
      
      // Global dashboard update
      io.emit('drawing_updated', {
        roomId: roomId,
        name: newName,
        thumbnail: updated.thumbnail,
        lastModified: updated.lastModified,
        isDeleted: updated.isDeleted
      });
  });

  // INVITE
  socket.on('invite_user', (email) => {
      const roomId = socket.roomId;
      if (!roomId) return;
      logger.info(`Invited: ${email} to ${roomId} by ${socket.id}`);
      roomState.allowEmail(roomId, email);
  });

  // DELETE
  socket.on('delete_drawing', async (id) => {
      const roomId = id || socket.roomId;
      if (!roomId) return;
      logger.info(`Drawing Deleted: ${roomId}`);
      await drawingState.delete(roomId);
      io.to(roomId).emit('drawing_deleted');
      io.emit('drawing_updated', { roomId, isDeleted: true });
  });

  // DUPLICATE
  socket.on('duplicate_drawing', async (newRoomId) => {
      const roomId = socket.roomId;
      if (!roomId || !newRoomId) return;
      logger.info(`Drawing Duplicated: ${roomId} to ${newRoomId}`);
      await drawingState.duplicate(roomId, newRoomId);
      socket.emit('drawing_duplicated', newRoomId);
  });

  // DISCONNECT
  socket.on('disconnect', () => {
      const roomId = roomState.removeUser(socket.id);
      if (roomId) {
        logger.info(`User ${socket.id} left room ${roomId}`);
        io.to(roomId).emit('room_users', roomState.getUsers(roomId));
        io.to(roomId).emit('user_disconnected', socket.id);
      }
  });
};

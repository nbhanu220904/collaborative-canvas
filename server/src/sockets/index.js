const registerRoomHandlers = require('./room.socket');
const registerDrawingHandlers = require('./drawing.socket');
const registerPresenceHandlers = require('./presence.socket');
const logger = require('../utils/logger');

module.exports = (io) => {
  io.on('connection', (socket) => {
      logger.info(`New Connection: ${socket.id}`);
      
      registerRoomHandlers(io, socket);
      registerDrawingHandlers(io, socket);
      registerPresenceHandlers(io, socket);
  });
};

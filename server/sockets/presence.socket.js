module.exports = (io, socket) => {
  socket.on('cursor_move', (data) => {
      if (socket.roomId) {
        socket.to(socket.roomId).emit('cursor_move', { ...data, id: socket.id });
      }
  });
};

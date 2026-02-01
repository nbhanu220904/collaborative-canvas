const logger = require('../utils/logger');

const rooms = {};

const getRoom = (roomId) => {
    if (!rooms[roomId]) {
        rooms[roomId] = {
            activeUsers: {}, // { socketId: { name, avatar, id, email } }
            allowedEmails: new Set(),
            settings: {
                isPublic: true,
                password: null
            }
        };
    }
    return rooms[roomId];
};

const roomState = {
  addUser: (roomId, socketId, userData) => {
    getRoom(roomId).activeUsers[socketId] = userData;
  },

  removeUser: (socketId) => {
    // Need to find which room the user was in
    for (const roomId in rooms) {
      if (rooms[roomId].activeUsers[socketId]) {
        delete rooms[roomId].activeUsers[socketId];
        return roomId;
      }
    }
    return null;
  },

  getUsers: (roomId) => Object.values(getRoom(roomId).activeUsers),

  getSettings: (roomId) => getRoom(roomId).settings,

  updateSettings: (roomId, newSettings) => {
    const room = getRoom(roomId);
    room.settings = { ...room.settings, ...newSettings };
  },

  isAllowed: (roomId, email, passwordAttempt) => {
    const room = getRoom(roomId);
    
    // 1. Owner logic (First user)
    if (room.allowedEmails.size === 0 && email) {
      room.allowedEmails.add(email);
      return true;
    }

    // 2. Public Access
    if (room.settings.isPublic) {
        if (room.settings.password && !room.allowedEmails.has(email)) {
            return passwordAttempt === room.settings.password;
        }
        return true;
    }

    // 3. Invite Only
    return room.allowedEmails.has(email);
  },

  allowEmail: (roomId, email) => {
    if (email) getRoom(roomId).allowedEmails.add(email);
  },

  getKnownUsers: (roomId) => {
      // Mocking known users as active + allowed for now
      // In a real system we'd fetch from DB
      return Object.values(getRoom(roomId).activeUsers);
  }
};

module.exports = roomState;

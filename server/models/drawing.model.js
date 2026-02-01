const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

const Drawings = {
    getCollection: () => {
        const db = getDB();
        if (!db) {
            throw new Error('Database connection not established');
        }
        return db.collection('drawings');
    },

    // Find or Create a drawing (room)
    findOrCreate: async (drawingId, defaultData = {}) => {
        const collection = Drawings.getCollection();
        let drawing = await collection.findOne({ roomId: drawingId });

        if (!drawing) {
            drawing = {
                roomId: drawingId,
                name: defaultData.name || 'Untitled Drawing',
                strokes: [],
                redoStack: [],
                pages: [{ id: 1 }],
                settings: { isPublic: true, password: null },
                allowedEmails: [],
                isDeleted: false,
                lastModified: new Date().toISOString()
            };
            await collection.insertOne(drawing);
        }

        return drawing;
    },

    // Save full state
    saveState: async (drawingId, state) => {
        const collection = Drawings.getCollection();
        return collection.updateOne(
            { roomId: drawingId },
            { 
                $set: { 
                    ...state,
                    lastModified: new Date().toISOString()
                } 
            }
        );
    },

    // Update single stroke (Efficiency)
    addStroke: async (drawingId, stroke) => {
        const collection = Drawings.getCollection();
        return collection.updateOne(
            { roomId: drawingId },
            { 
                $push: { strokes: stroke },
                $set: { lastModified: new Date().toISOString() }
            }
        );
    },

    // Update drawing name
    rename: async (drawingId, newName) => {
        const collection = Drawings.getCollection();
        return collection.updateOne(
            { roomId: drawingId },
            { $set: { name: newName, lastModified: new Date().toISOString() } }
        );
    },

    // Soft Delete
    delete: async (drawingId) => {
        const collection = Drawings.getCollection();
        return collection.updateOne(
            { roomId: drawingId },
            { $set: { isDeleted: true, lastModified: new Date().toISOString() } }
        );
    },

    // Duplicate
    duplicate: async (originalRoomId, newRoomId) => {
        const collection = Drawings.getCollection();
        const original = await collection.findOne({ roomId: originalRoomId });
        if (!original) throw new Error('Original drawing not found');

        const duplicate = {
            ...original,
            _id: new ObjectId(),
            roomId: newRoomId,
            name: `${original.name} (Copy)`,
            lastModified: new Date().toISOString()
        };
        return collection.insertOne(duplicate);
    },

    // Save thumbnail snapshot
    updateSnapshot: async (drawingId, dataUrl) => {
        const collection = Drawings.getCollection();
        return collection.updateOne(
            { roomId: drawingId },
            { $set: { thumbnail: dataUrl, lastModified: new Date().toISOString() } }
        );
    },

    // Get all drawings for dashboard (Excluding deleted)
    getAll: async () => {
        const collection = Drawings.getCollection();
        return collection.find({ isDeleted: { $ne: true } }).sort({ lastModified: -1 }).toArray();
    }
};

module.exports = Drawings;

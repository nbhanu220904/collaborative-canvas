const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

const Drawings = {
    getCollection: () => getDB().collection('drawings'),

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

    // Get all drawings for dashboard
    getAll: async () => {
        const collection = Drawings.getCollection();
        return collection.find({}).sort({ lastModified: -1 }).toArray();
    }
};

module.exports = Drawings;

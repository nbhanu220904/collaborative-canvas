const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');

const Comments = {
    getCollection: () => {
        const db = getDB();
        if (!db) throw new Error('Database connection not established');
        return db.collection('comments');
    },

    add: async (commentData) => {
        const collection = Comments.getCollection();
        const comment = {
            ...commentData,
            status: 'active', // active | resolved
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        const result = await collection.insertOne(comment);
        return { ...comment, _id: result.insertedId };
    },

    getByRoom: async (roomId) => {
        const collection = Comments.getCollection();
        return collection.find({ roomId, status: 'active' }).toArray();
    },

    resolve: async (commentId) => {
        const collection = Comments.getCollection();
        return collection.updateOne(
            { _id: new ObjectId(commentId) },
            { $set: { status: 'resolved', lastModified: new Date().toISOString() } }
        );
    }
};

module.exports = Comments;

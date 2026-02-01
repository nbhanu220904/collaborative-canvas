const { MongoClient } = require('mongodb');
const { MONGODB_URI } = require('./env');
const logger = require('../utils/logger');

let db = null;
let client = null;

const connectDB = async () => {
    if (db) return db;

    if (!MONGODB_URI) {
        logger.warn('MONGODB_URI not found in environment. Connection skipped.');
        return null;
    }

    try {
        client = new MongoClient(MONGODB_URI, {
            tls: true,
            tlsAllowInvalidCertificates: false,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        await client.connect();
        db = client.db('collaborative-canvas');
        logger.info('Successfully connected to MongoDB');
        return db;
    } catch (err) {
        logger.error('Failed to connect to MongoDB:', err);
        throw err;
    }
};

const getDB = () => {
    if (!db) {
        logger.warn('Accessing DB before connection established.');
    }
    return db;
};

module.exports = { connectDB, getDB };

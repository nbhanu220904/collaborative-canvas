const express = require('express');
const cors = require('cors');
const { CORS_ORIGIN } = require('./config/env');

const Drawing = require('./models/drawing.model');

const app = express();

app.use(cors({ origin: CORS_ORIGIN }));

app.get('/api/drawings', async (req, res) => {
  try {
    const drawings = await Drawing.getAll();
    res.json(drawings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch drawings' });
  }
});

app.get('/', (req, res) => {
  res.send('Collaborative Canvas API (Modular Structure)');
});

module.exports = app;

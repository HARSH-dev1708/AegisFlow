import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import webhookRoutes from './routes/webhookRoutes.js';
import apiRoutes from './routes/apiRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// Capture raw buffer for GitHub HMAC-SHA256 signature verification
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'AegisFlow Control Plane',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/webhooks', webhookRoutes);
app.use('/api', apiRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB at', process.env.MONGO_URI);
    app.listen(PORT, () => {
      console.log(`AegisFlow Control Plane listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });

import express from 'express';
import Environment from '../models/Environment.js';
import EventLog from '../models/EventLog.js';
import { destroyEnvironment } from '../services/dockerService.js';

const router = express.Router();

// Get all environments (active first, then recently destroyed)
router.get('/environments', async (req, res) => {
  try {
    const environments = await Environment.find()
      .sort({ status: -1, updatedAt: -1 })
      .limit(30);
    res.json(environments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get latest webhook & container audit logs
router.get('/logs', async (req, res) => {
  try {
    const logs = await EventLog.find().sort({ createdAt: -1 }).limit(40);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manually teardown a running preview environment
router.delete('/environments/:id', async (req, res) => {
  try {
    const env = await Environment.findById(req.params.id);
    if (!env) {
      return res.status(404).json({ error: 'Environment not found' });
    }

    const destroyed = await destroyEnvironment({
      prNumber: env.prNumber,
      repoFullName: env.repoFullName,
    });

    await EventLog.create({
      eventType: 'MANUAL_TEARDOWN',
      prNumber: env.prNumber,
      repoFullName: env.repoFullName,
      status: 'WARNING',
      message: `[CONTROL_PLANE] Manually destroyed ${env.containerName} & freed port ${env.port}`,
    });

    res.json({ message: 'Environment destroyed', environment: destroyed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

import express from 'express';
import crypto from 'crypto';
import EventLog from '../models/EventLog.js';
import { provisionEnvironment, destroyEnvironment } from '../services/dockerService.js';

const router = express.Router();

/**
 * Verifies GitHub's HMAC-SHA256 signature against the raw request body
 */
function verifyGitHubSignature(req) {
  const signatureHeader = req.headers['x-hub-signature-256'];
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!signatureHeader || !secret || !req.rawBody) {
    return false;
  }

  const expectedSignature =
    'sha256=' + crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');

  const sigBuffer = Buffer.from(signatureHeader, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

/**
 * Shared handler for both real GitHub webhooks and UI simulator events
 */
async function handlePullRequestEvent({ action, pull_request, repository, source = 'GITHUB_WEBHOOK' }) {
  const prNumber = pull_request.number;
  const repoFullName = repository.full_name;
  const prTitle = pull_request.title || `Pull Request #${prNumber}`;
  const branch = pull_request.head?.ref || 'feature-branch';
  const commitSha = pull_request.head?.sha || crypto.randomBytes(4).toString('hex');
  const author = pull_request.user?.login || 'developer';

  if (action === 'opened' || action === 'reopened' || action === 'synchronize') {
    const { environment, action: dockerAction } = await provisionEnvironment({
      prNumber,
      repoFullName,
      prTitle,
      branch,
      commitSha,
      author,
    });

    const eventType = action === 'synchronize' ? 'PR_SYNCHRONIZE' : 'PR_OPENED';
    await EventLog.create({
      eventType,
      prNumber,
      repoFullName,
      status: 'SUCCESS',
      message: `[${source}] ${dockerAction} container ${environment.containerName} on port ${environment.port}`,
      metadata: { port: environment.port, branch, commitSha },
    });

    return { status: 'provisioned', environment };
  }

  if (action === 'closed') {
    const destroyed = await destroyEnvironment({ prNumber, repoFullName });
    const isMerged = Boolean(pull_request.merged);

    await EventLog.create({
      eventType: isMerged ? 'PR_MERGED' : 'PR_CLOSED',
      prNumber,
      repoFullName,
      status: 'INFO',
      message: destroyed
        ? `[${source}] Destroyed container ${destroyed.containerName} & released port ${destroyed.port}`
        : `[${source}] PR #${prNumber} closed (no active container found)`,
    });

    return { status: 'destroyed', environment: destroyed };
  }

  return { status: 'ignored', reason: `Unhandled PR action: ${action}` };
}

// 1. Live GitHub Webhook Endpoint (HMAC-SHA256 Verified)
router.post('/github', async (req, res) => {
  try {
    const isValid = verifyGitHubSignature(req);
    if (!isValid) {
      await EventLog.create({
        eventType: 'SECURITY_REJECTED',
        status: 'ERROR',
        message: 'Rejected webhook payload: Invalid or missing X-Hub-Signature-256 HMAC signature',
      });
      return res.status(401).json({ error: 'Invalid HMAC-SHA256 signature' });
    }

    const githubEvent = req.headers['x-github-event'];

    if (githubEvent === 'ping') {
      await EventLog.create({
        eventType: 'WEBHOOK_PING',
        repoFullName: req.body?.repository?.full_name,
        status: 'SUCCESS',
        message: 'GitHub Webhook handshake verified successfully (ping)',
      });
      return res.status(200).json({ message: 'Pong! AegisFlow webhook verified.' });
    }

    if (githubEvent !== 'pull_request') {
      return res.status(200).json({ message: `Ignored event: ${githubEvent}` });
    }

    const result = await handlePullRequestEvent({
      action: req.body.action,
      pull_request: req.body.pull_request,
      repository: req.body.repository,
      source: 'GITHUB_WEBHOOK',
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Webhook processing error:', err);
    await EventLog.create({
      eventType: 'SYSTEM_ERROR',
      status: 'ERROR',
      message: `Webhook error: ${err.message}`,
    });
    return res.status(500).json({ error: err.message });
  }
});

// 2. Interactive Demo Simulator Endpoint (for live testing from the UI)
router.post('/simulate', async (req, res) => {
  try {
    const {
      action = 'opened',
      prNumber = 101,
      repoFullName = 'acme-corp/web-platform',
      prTitle = 'feat: add real-time checkout telemetry',
      branch = 'feat/checkout-telemetry',
      author = 'harsh-dev',
    } = req.body;

    const result = await handlePullRequestEvent({
      action,
      pull_request: {
        number: Number(prNumber),
        title: prTitle,
        merged: action === 'closed',
        head: {
          ref: branch,
          sha: crypto.randomBytes(6).toString('hex'),
        },
        user: { login: author },
      },
      repository: { full_name: repoFullName },
      source: 'SIMULATOR',
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Simulation error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;

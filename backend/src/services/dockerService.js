import Docker from 'dockerode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Environment from '../models/Environment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to Docker Desktop on Windows via named pipe (or Unix socket on Linux/macOS)
const docker =
  process.platform === 'win32'
    ? new Docker({ socketPath: '//./pipe/docker_engine' })
    : new Docker({ socketPath: '/var/run/docker.sock' });

const PREVIEWS_ROOT = path.resolve(__dirname, '../../previews');

/**
 * Finds the lowest unused port between PORT_RANGE_START (8101) and PORT_RANGE_END (8150)
 */
async function findAvailablePort() {
  const startPort = Number(process.env.PORT_RANGE_START) || 8101;
  const endPort = Number(process.env.PORT_RANGE_END) || 8150;

  const activeEnvs = await Environment.find({ status: { $in: ['PROVISIONING', 'RUNNING'] } });
  const usedPorts = new Set(activeEnvs.map((env) => env.port));

  for (let port = startPort; port <= endPort; port++) {
    if (!usedPorts.has(port)) {
      return port;
    }
  }
  throw new Error(`No available ports in range ${startPort}-${endPort}`);
}

/**
 * Generates an isolated static preview app inside backend/previews/pr-<number>/
 */
function generatePreviewBundle({ prNumber, repoFullName, prTitle, branch, commitSha, author, port }) {
  const folderName = `pr-${prNumber}-${repoFullName.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const previewDir = path.join(PREVIEWS_ROOT, folderName);

  fs.mkdirSync(previewDir, { recursive: true });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PR #${prNumber} Preview — AegisFlow</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #FAF9F6;
      color: #1C1917;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .card {
      background: #FFFFFF;
      border: 1px solid #E7E5E4;
      border-radius: 16px;
      padding: 36px;
      max-width: 540px;
      width: 90%;
      box-shadow: 0 12px 32px rgba(28, 25, 23, 0.06);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #ECFDF5;
      color: #065F46;
      border: 1px solid #A7F3D0;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }
    .dot {
      width: 8px;
      height: 8px;
      background: #10B981;
      border-radius: 50%;
    }
    h1 {
      margin: 18px 0 8px;
      font-size: 24px;
      line-height: 1.3;
    }
    p {
      color: #57534E;
      font-size: 15px;
      line-height: 1.6;
      margin: 0 0 24px;
    }
    .meta {
      background: #F5F5F4;
      border-radius: 12px;
      padding: 16px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      font-size: 13px;
    }
    .meta div span {
      display: block;
      color: #78716C;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 3px;
    }
    .meta div strong {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      color: #1C1917;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="dot"></span> Isolated Preview Active • Port ${port}</div>
    <h1>PR #${prNumber}: ${prTitle}</h1>
    <p>Provisioned automatically by <strong>AegisFlow Control Plane</strong> inside an ephemeral <code>nginx:alpine</code> container.</p>
    <div class="meta">
      <div><span>Repository</span><strong>${repoFullName}</strong></div>
      <div><span>Branch</span><strong>${branch}</strong></div>
      <div><span>Commit SHA</span><strong>${commitSha.slice(0, 7)}</strong></div>
      <div><span>Author</span><strong>@${author}</strong></div>
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(previewDir, 'index.html'), html, 'utf8');
  return previewDir;
}

/**
 * Spins up or updates an isolated Docker container for a Pull Request
 */
export async function provisionEnvironment({ prNumber, repoFullName, prTitle, branch, commitSha, author }) {
  // Check if an active environment already exists for this PR (e.g., on PR synchronize/update)
  const existing = await Environment.findOne({
    repoFullName,
    prNumber,
    status: { $in: ['PROVISIONING', 'RUNNING'] },
  });

  if (existing) {
    generatePreviewBundle({
      prNumber,
      repoFullName,
      prTitle,
      branch,
      commitSha,
      author,
      port: existing.port,
    });

    const container = docker.getContainer(existing.containerId);
    await container.restart();

    existing.prTitle = prTitle;
    existing.commitSha = commitSha;
    existing.status = 'RUNNING';
    await existing.save();
    return { environment: existing, action: 'UPDATED' };
  }

  // Allocate a fresh dynamic port (8101-8150)
  const port = await findAvailablePort();
  const safeRepo = repoFullName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const containerName = `aegisflow-pr-${prNumber}-${safeRepo}-${port}`;

  // Generate isolated preview HTML directory
  const previewDir = generatePreviewBundle({
    prNumber,
    repoFullName,
    prTitle,
    branch,
    commitSha,
    author,
    port,
  });

  // Create isolated Nginx container bound to the dynamic host port
  const container = await docker.createContainer({
    Image: 'nginx:alpine',
    name: containerName,
    ExposedPorts: { '80/tcp': {} },
    HostConfig: {
      PortBindings: {
        '80/tcp': [{ HostPort: String(port) }],
      },
      Binds: [`${previewDir}:/usr/share/nginx/html:ro`],
    },
    Labels: {
      'managed-by': 'aegisflow',
      'pr-number': String(prNumber),
      repo: repoFullName,
    },
  });

  await container.start();

  const environment = await Environment.create({
    prNumber,
    repoFullName,
    prTitle,
    branch,
    commitSha,
    author,
    containerId: container.id,
    containerName,
    port,
    previewUrl: `http://localhost:${port}`,
    status: 'RUNNING',
  });

  return { environment, action: 'CREATED' };
}

/**
 * Stops and removes the Docker container when a PR is closed or merged
 */
export async function destroyEnvironment({ prNumber, repoFullName }) {
  const existing = await Environment.findOne({
    repoFullName,
    prNumber,
    status: { $in: ['PROVISIONING', 'RUNNING'] },
  });

  if (!existing) {
    return null;
  }

  try {
    const container = docker.getContainer(existing.containerId);
    await container.stop().catch(() => {}); // Ignore error if already stopped
    await container.remove({ force: true });
  } catch (err) {
    console.warn(`Container cleanup warning for PR #${prNumber}:`, err.message);
  }

  // Clean up ephemeral preview directory
  const folderName = `pr-${prNumber}-${repoFullName.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const previewDir = path.join(PREVIEWS_ROOT, folderName);
  fs.rmSync(previewDir, { recursive: true, force: true });

  existing.status = 'DESTROYED';
  await existing.save();

  return existing;
}

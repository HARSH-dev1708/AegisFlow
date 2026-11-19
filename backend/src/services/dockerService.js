import Docker from 'dockerode';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import Environment from '../models/Environment.js';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docker =
  process.platform === 'win32'
    ? new Docker({ socketPath: '//./pipe/docker_engine' })
    : new Docker({ socketPath: '/var/run/docker.sock' });

const PREVIEWS_ROOT = path.resolve(__dirname, '../../previews');
const NPM_CMD = process.platform === 'win32' ? 'npm.cmd' : 'npm';

async function findAvailablePort() {
  const startPort = Number(process.env.PORT_RANGE_START) || 8101;
  const endPort = Number(process.env.PORT_RANGE_END) || 8150;

  const activeEnvs = await Environment.find({ status: { $in: ['PROVISIONING', 'RUNNING'] } });
  const usedPorts = new Set(activeEnvs.map((env) => env.port));

  for (let port = startPort; port <= endPort; port++) {
    if (!usedPorts.has(port)) return port;
  }
  throw new Error(`No available ports in range ${startPort}-${endPort}`);
}

async function generatePreviewBundle({ prNumber, repoFullName, prTitle, branch, commitSha, author, port, isSimulated = false }) {
  const folderName = `pr-${prNumber}-${repoFullName.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const previewDir = path.join(PREVIEWS_ROOT, folderName);

  fs.rmSync(previewDir, { recursive: true, force: true });
  fs.mkdirSync(previewDir, { recursive: true });

  // Only clone and build for real GitHub webhooks (skip local dashboard simulator payloads)
  if (!isSimulated) {
    try {
      const repoUrl = `https://github.com/${repoFullName}.git`;
      await execFileAsync('git', ['clone', '--depth', '1', '--branch', branch, repoUrl, previewDir], {
        timeout: 20000,
      });
      fs.rmSync(path.join(previewDir, '.git'), { recursive: true, force: true });

      const appDir = fs.existsSync(path.join(previewDir, 'frontend', 'package.json'))
        ? path.join(previewDir, 'frontend')
        : previewDir;

      if (fs.existsSync(path.join(appDir, 'package.json'))) {
        if (
          !fs.existsSync(path.join(appDir, 'dist', 'index.html')) &&
          !fs.existsSync(path.join(appDir, 'build', 'index.html'))
        ) {
          await execFileAsync(NPM_CMD, ['install', '--prefer-offline', '--no-audit'], {
            cwd: appDir,
            timeout: 90000,
          });
          await execFileAsync(NPM_CMD, ['run', 'build'], {
            cwd: appDir,
            timeout: 90000,
          });
        }

        if (fs.existsSync(path.join(appDir, 'dist', 'index.html'))) {
          return path.join(appDir, 'dist');
        }
        if (fs.existsSync(path.join(appDir, 'build', 'index.html'))) {
          return path.join(appDir, 'build');
        }
      } else if (fs.existsSync(path.join(previewDir, 'index.html'))) {
        return previewDir;
      }
    } catch (err) {
      console.warn(`Preview clone/build fallback for PR #${prNumber}:`, err.message);
    }
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PR #${prNumber} Preview — AegisFlow</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #FAF9F6; color: #1C1917; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #FFFFFF; border: 1px solid #E7E5E4; border-radius: 16px; padding: 36px; max-width: 540px; width: 90%; box-shadow: 0 12px 32px rgba(28, 25, 23, 0.06); }
    .badge { display: inline-flex; align-items: center; gap: 8px; background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .dot { width: 8px; height: 8px; background: #10B981; border-radius: 50%; }
    h1 { margin: 18px 0 8px; font-size: 24px; line-height: 1.3; }
    p { color: #57534E; font-size: 15px; line-height: 1.6; margin: 0 0 24px; }
    .meta { background: #F5F5F4; border-radius: 12px; padding: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; }
    .meta div span { display: block; color: #78716C; font-size: 11px; text-transform: uppercase; margin-bottom: 3px; }
    .meta div strong { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #1C1917; }
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

export async function provisionEnvironment({ prNumber, repoFullName, prTitle, branch, commitSha, author, isSimulated = false }) {
  const existing = await Environment.findOne({
    repoFullName,
    prNumber,
    status: { $in: ['PROVISIONING', 'RUNNING'] },
  });

  if (existing) {
    await generatePreviewBundle({
      prNumber,
      repoFullName,
      prTitle,
      branch,
      commitSha,
      author,
      port: existing.port,
      isSimulated,
    });

    const container = docker.getContainer(existing.containerId);
    await container.restart();

    existing.prTitle = prTitle;
    existing.commitSha = commitSha;
    existing.status = 'RUNNING';
    await existing.save();
    return { environment: existing, action: 'UPDATED' };
  }

  const port = await findAvailablePort();
  const safeRepo = repoFullName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const containerName = `aegisflow-pr-${prNumber}-${safeRepo}-${port}`;

  const mountDir = await generatePreviewBundle({
    prNumber,
    repoFullName,
    prTitle,
    branch,
    commitSha,
    author,
    port,
    isSimulated,
  });

  const container = await docker.createContainer({
    Image: 'nginx:alpine',
    name: containerName,
    ExposedPorts: { '80/tcp': {} },
    HostConfig: {
      PortBindings: {
        '80/tcp': [{ HostPort: String(port) }],
      },
      Binds: [`${mountDir}:/usr/share/nginx/html:ro`],
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

export async function destroyEnvironment({ prNumber, repoFullName }) {
  const existing = await Environment.findOne({
    repoFullName,
    prNumber,
    status: { $in: ['PROVISIONING', 'RUNNING'] },
  });

  if (!existing) return null;

  try {
    const container = docker.getContainer(existing.containerId);
    await container.stop().catch(() => {});
    await container.remove({ force: true });
  } catch (err) {
    console.warn(`Container cleanup warning for PR #${prNumber}:`, err.message);
  }

  const folderName = `pr-${prNumber}-${repoFullName.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const previewDir = path.join(PREVIEWS_ROOT, folderName);
  fs.rmSync(previewDir, { recursive: true, force: true });

  existing.status = 'DESTROYED';
  await existing.save();

  return existing;
}


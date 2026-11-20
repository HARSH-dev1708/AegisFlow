# AegisFlow — Event-Driven Ephemeral Preview Control Plane

AegisFlow automatically provisions isolated `nginx:alpine` Docker preview environments on dynamic host ports (`8101–8150`) whenever a GitHub Pull Request is opened or updated, and destroys them automatically upon merge or closure.

## Team
- **Harsh Kumar** (CSE 5-C, 202401100200149)
- **Naman Jadiya** (CSE 5-C 202401100200208)

## Live Cloud Deployment (AWS EC2)

AegisFlow is deployed and running live on **AWS EC2 (`ap-south-1`)** with automated HTTPS termination and dynamic container orchestration:

* **Live Control Plane (Deployed Link):** https://52.66.248.126.sslip.io
* **GitHub Webhook Endpoint:** https://52.66.248.126.sslip.io/api/webhooks/github
* **Ephemeral Preview Port Pool:** `http://52.66.248.126:8101` – `8150`

### Cloud Infrastructure & Deployment Architecture

| Layer | Configuration & Implementation |
| :--- | :--- |
| **Compute & OS** | AWS EC2 `t3.small` (2 vCPU, 2 GiB RAM + 2 GB swap) running **Ubuntu Server 26.04 LTS (x86)** with `20 GiB` `gp3` EBS storage |
| **Reverse Proxy & TLS** | **Caddy** reverse proxy mapped via `sslip.io` wildcard DNS with automatic Let's Encrypt HTTPS certificates (`ports 80/443`), serving the static React/Vite production bundle and routing `/api/*` to the backend |
| **Orchestration Backend** | **Node.js 20** + **Express** managed by **PM2** (`aegisflow-backend`), communicating directly with the host Docker daemon via `dockerode` |
| **State & Audit Persistence** | **MongoDB 7** running in a persistent Docker container (`--restart unless-stopped`) bound to `127.0.0.1:27017` |
| **Ephemeral Preview Engine** | **Docker Engine** pre-cached with `nginx:alpine`, dynamically provisioning isolated PR preview containers across Security Group TCP ports `8101–8150` and tearing them down automatically on PR close/merge |

### End-to-End Cloud Workflow

1. **Webhook Ingestion:** GitHub sends signed `pull_request` (`opened`, `synchronize`, `closed`) JSON payloads over HTTPS to `https://52.66.248.126.sslip.io/api/webhooks/github`.
2. **Container Provisioning:** The Node.js control plane verifies the HMAC-SHA256 signature, allocates an available host port (`8101–8150`), clones and builds the PR branch, and launches an isolated `nginx:alpine` container on EC2.
3. **Automated Teardown:** When a PR is closed or merged, AegisFlow stops and removes the container via the Docker Engine API and returns the port to the available pool.

## Architecture
- **Ingress & Security**: GitHub Pull Request Webhooks (`HMAC-SHA256` verified) tunneled via Cloudflare Tunnel (`cloudflared`).
- **Control Plane Engine**: Node.js, Express, `dockerode` (Docker Engine API), and MongoDB (`Mongoose`) with partial unique port indexing.
- **Operator Dashboard**: React + Vite + Tailwind CSS v4 polling telemetry every 2.5 seconds with a built-in PR event simulator.

## Local Setup
1. **Backend**: `cd backend && cp .env.example .env && npm install && npm start`
2. **Frontend**: `cd frontend && npm install && npm run dev`
3. **Cloudflare Tunnel**: `cloudflared tunnel --url http://localhost:5000`

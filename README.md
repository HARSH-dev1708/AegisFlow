# AegisFlow — Event-Driven Ephemeral Preview Control Plane

AegisFlow automatically provisions isolated `nginx:alpine` Docker preview environments on dynamic host ports (`8101–8150`) whenever a GitHub Pull Request is opened or updated, and destroys them automatically upon merge or closure.

## Team
- **Harsh Kumar** (202401100200149)
- **Yogesh Verma**

## Architecture
- **Ingress & Security**: GitHub Pull Request Webhooks (`HMAC-SHA256` verified) tunneled via Cloudflare Tunnel (`cloudflared`).
- **Control Plane Engine**: Node.js, Express, `dockerode` (Docker Engine API), and MongoDB (`Mongoose`) with partial unique port indexing.
- **Operator Dashboard**: React + Vite + Tailwind CSS v4 polling telemetry every 2.5 seconds with a built-in PR event simulator.

## Local Setup
1. **Backend**: `cd backend && cp .env.example .env && npm install && npm start`
2. **Frontend**: `cd frontend && npm install && npm run dev`
3. **Cloudflare Tunnel**: `cloudflared tunnel --url http://localhost:5000`

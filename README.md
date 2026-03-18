# AI Dashboard Console — Managed Server Interface

A **Next.js** dashboard deployed alongside the agent on each managed server, accessible at the `/troubleshoot` subpath. Provides the server operator with a tenant-scoped view of their own incidents, system health, and agent status — without exposing other tenants' data.

> **Part of the [Web Server Troubleshooting Agent](https://github.com/Damilarondo/web-server-troubleshooting-agent) system.**

---

## Features

| Feature | Description |
|---|---|
| **Tenant-Scoped View** | Only shows incidents, metrics, and agents belonging to the authenticated user's tenant |
| **Live Event Feed** | Real-time WebSocket stream of incident lifecycle events |
| **Health Score Gauge** | Composite stability index from service uptime, resource pressure, incidents, and ML predictions |
| **System Telemetry** | SVG sparkline charts for CPU, memory, and disk, refreshed every 10 seconds |
| **Incident Management** | Paginated, searchable incident table with full detail views |
| **Agent Status** | View the managed server's agent heartbeat, IP, and OS version |
| **Operations Centre** | View and adjust AI configuration and remediation mode |
| **JWT Authentication** | Login with client-side SHA-256 password hashing and automatic session handling |

---

## Pages

| Route | Description |
|---|---|
| `/troubleshoot` | Dashboard — KPIs, live feed, telemetry, health gauge |
| `/troubleshoot/login` | Authentication page |
| `/troubleshoot/incidents` | Paginated incident list with search and status filters |
| `/troubleshoot/incidents/[id]` | Incident detail view |
| `/troubleshoot/agents` | Agent list and status |
| `/troubleshoot/operations` | System configuration |
| `/troubleshoot/documentation` | In-app documentation |

> The `/troubleshoot` base path is configured in `next.config.ts` so the dashboard can coexist with the server's existing web applications behind Nginx, Apache, or other reverse proxies.

---

## Tech Stack

- **Next.js 16** (App Router, React 19) with `basePath: "/troubleshoot"`
- **TypeScript**
- **Tailwind CSS 4**
- **WebSocket** (for real-time events)

---

## How It Gets Deployed

This dashboard is **not installed manually**. The agent's `install.sh` script automatically:

1. Downloads the console source bundle from the control plane
2. Runs `npm install && npm run build`
3. Creates an `ai-dashboard.service` (systemd)
4. Auto-detects the running web server (Nginx, Apache, Caddy, Traefik, LiteSpeed) and configures a reverse-proxy route for `/troubleshoot`

For manual or development setup, see below.

---

## Manual Setup (Development)

```bash
# Clone the repo
git clone https://github.com/Damilarondo/ai_dashboard_console.git
cd ai_dashboard_console

# Install dependencies
npm install

# Set the API URL
export NEXT_PUBLIC_API_URL=https://<control-plane-host>

# Start the development server
npm run dev
```

The console is available at `http://localhost:3000/troubleshoot`.

### Production Build

```bash
npm run build
PORT=3001 npm run start
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the AI Control Plane API | `http://localhost:8000` |
| `PORT` | Port to run the production server on | `3000` |

---

## Differences from `ai_dashboard`

| Aspect | `ai_dashboard` (Admin) | `ai_dashboard_console` (Managed) |
|---|---|---|
| **Deployment** | Standalone on the admin's machine | Auto-deployed on each managed server |
| **Base Path** | `/` | `/troubleshoot` |
| **Scope** | Full admin access to all tenants (planned) | Single-tenant, operator-scoped |
| **Installation** | Manual `npm install` | Automatic via `install.sh` |

---

## License

Copyright © 2026 Damilarondo. All rights reserved.  
This software is proprietary and confidential. Unauthorized copying, distribution, or modification is strictly prohibited.

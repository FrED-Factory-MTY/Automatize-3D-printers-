# B.L.A.Z.E — Bambu Lab Automated Zone Engine

Web dashboard to monitor and control Bambu Lab 3D printers in real time via MQTT, with user authentication and print job management powered by Supabase.

---

## Table of Contents

- [Stack](#stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Supabase Integration](#supabase-integration)
- [Bambu Lab Printer Connection](#bambu-lab-printer-connection)
- [API Routes](#api-routes)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Deploying to Vercel](#deploying-to-vercel)
- [Troubleshooting](#troubleshooting)

---

## Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | **Next.js 15** (Pages Router) | Frontend + API routes |
| State | **Zustand** | Global state persisted in localStorage |
| Auth & DB | **Supabase** | Authentication, PostgreSQL database |
| ORM | **Drizzle ORM** | Type-safe database queries |
| Realtime | **mqtt.js** | MQTT client in the browser |
| Proxy | **proxy.cjs** | WebSocket ↔ TLS bridge for printer communication |
| Printer SDK | **bambulabs-api** (Python) | FTP upload & print job control |
| Styling | **Tailwind CSS v4** | Utility-first CSS framework |
| Package Manager | **pnpm** | Fast, disk-efficient package manager |

---

## Prerequisites

- **Node.js v18+** (v20 recommended)
- **pnpm** package manager
- **Python 3** with `bambulabs_api` installed (for print job submission)
- A **Supabase** project (free tier works)
- Your laptop and Bambu Lab printer on the **same WiFi network**

### Install Node.js with nvm (if needed)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# Close and reopen your terminal, then:
nvm install 20
nvm use 20
node --version   # should print v20.x.x
```

### Install pnpm

```bash
npm install -g pnpm
```

### Install Python dependencies

```bash
pip install bambulabs_api
```

---

## Installation

```bash
# 1. Clone the repo
git clone https://github.com/Bandarcrono/3d-printing-web.git
cd 3d-printing-web

# 2. Install dependencies
pnpm install

# 3. Create the environment file from the template
cp .env.example .env

# 4. Edit .env with your own credentials (see next section)
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
# WebSocket proxy URL (for MQTT bridge to Bambu printer)
NEXT_PUBLIC_WS_PROXY_URL="ws://localhost:9001"

# Supabase Database Connection (from Supabase Dashboard → Settings → Database → Connection string → URI)
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-DB-PASSWORD]@aws-1-us-west-2.pooler.supabase.com:6543/postgres"

# Supabase Auth Client Keys (from Supabase Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

> ⚠️ **Never commit the `.env` file**. It is already listed in `.gitignore`.

### Where to find each value

| Variable | Where to find it |
|----------|-----------------|
| `DATABASE_URL` | Supabase Dashboard → **Settings → Database → Connection string (URI)** |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → **Settings → API → Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → **Settings → API → Project API keys → anon public** |

---

## Running Locally

You need **two terminals** running simultaneously.

### Terminal 1 — MQTT Proxy

The proxy bridges the browser and the printer. Bambu printers use TLS on port 8883 and browsers cannot open raw TCP sockets, so the proxy handles the translation.

```bash
node proxy.cjs <printer-ip> <access-code> [port]
```

Example:

```bash
node proxy.cjs 192.168.0.35 12345678
```

You should see:

```
🖨  Bambu MQTT proxy (TLS)
   Printer  : 192.168.0.35:8883
   WebSocket: ws://localhost:9001
✓ Proxy running on ws://localhost:9001

→ Dashboard connected
→ Printer TLS connected ✓
```

Leave this terminal running.

### Terminal 2 — Dashboard

```bash
pnpm dev
```

Open your browser at `http://localhost:3000`.

---

## Supabase Integration

### What Supabase provides

This project uses Supabase for three key capabilities:

#### 1. Authentication
- **Email/password authentication** with organization metadata
- Only `@tec.mx` email addresses are allowed to register
- Users select an organization on signup (FrED-Factory, RoBorregos, VantTec)
- Session management is handled automatically via `supabase.auth.onAuthStateChange()`

#### 2. PostgreSQL Database
- The database is hosted on Supabase's managed PostgreSQL instance
- Accessed via **Drizzle ORM** with type-safe schemas
- Connection pooling through Supabase's PgBouncer (`pooler.supabase.com:6543`)

#### 3. Database Tables
| Table | Purpose |
|-------|---------|
| `user_profiles` | Stores user accounts linked to Supabase Auth (id, email, role) |
| `printers` | Registered 3D printers (serial, IP, access code, name) |
| `petitions` | Print job requests submitted by users |
| `pieces` | Uploaded 3D model files (G-code / 3MF) metadata |

### Setting up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your API keys into `.env` (see [Environment Variables](#environment-variables))
3. Push the database schema:

```bash
pnpm db:push
```

4. (Optional) Explore tables with Drizzle Studio:

```bash
pnpm db:studio
```

---

## Bambu Lab Printer Connection

### Architecture

```
┌──────────┐     WebSocket      ┌───────────┐     TLS/TCP      ┌──────────────┐
│  Browser  │ ◄───────────────► │ proxy.cjs │ ◄──────────────► │ Bambu Printer│
│ (mqtt.js) │   ws://localhost  │           │   port 8883      │              │
└──────────┘     :9001          └───────────┘                  └──────────────┘
```

### How it works

1. **proxy.cjs** opens a WebSocket server on `localhost:9001`
2. When the dashboard connects, the proxy creates a **TLS connection** to the printer on port 8883
3. The browser's `mqtt.js` client speaks MQTT protocol over the WebSocket
4. MQTT authentication uses `bblp` as the username and the printer's **access code** as the password

### Real-time monitoring (MQTT)

The `useMqtt` hook subscribes to `device/{serial}/report` and receives live data:

| Data Point | Description |
|------------|-------------|
| Nozzle / bed / chamber temperature | Current and target values |
| Print progress | Percentage, current layer, total layers |
| Remaining time | Estimated minutes |
| G-code state | IDLE, PREPARE, RUNNING, PAUSE, FINISH, FAILED |
| Speed profile | Silent / Standard / Sport / Ludicrous |
| AMS filament | Color, type, remaining percentage |
| WiFi signal | Signal strength |

### Print control commands

Commands are published to `device/{serial}/request`:

| Command | Action |
|---------|--------|
| `pushall` | Request full state update |
| `pause` | Pause current print |
| `resume` | Resume paused print |
| `stop` | Cancel print |
| `print_speed` | Set speed (1=Silent, 2=Standard, 3=Sport, 4=Ludicrous) |
| `gcode_line` | Send raw G-code (e.g., set nozzle/bed temp) |

### Print job submission (BambuLabs API)

Sending a new job uses the `bambulabs_api` Python package:

1. User uploads a `.gcode` or `.3mf` file via the dashboard
2. The file is saved to `public/uploads/` and metadata stored in the `pieces` table
3. When starting a job, the API route calls `src/scripts/add_job.py`
4. The Python script connects to the printer via FTP, uploads the file, and starts the print

### Printer credentials

You need these values from the printer's touchscreen:

| Field | Where to find it |
|-------|-----------------|
| **Serial number** | Settings → Device → Device info |
| **IP address** | Settings → Network → IP Address |
| **Access code** | Settings → Network → LAN Mode → Access code (8 digits) |

---

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/printers` | Register a new printer in the database |
| `POST` | `/api/petitions` | Submit a print job request |
| `GET` | `/api/pieces` | List all uploaded 3D model files |
| `POST` | `/api/pieces/upload` | Upload a .gcode or .3mf file |
| `POST` | `/api/job` | Send a print job to a Bambu printer |

---

## Database Schema

Managed by Drizzle ORM. Schema defined in `src/server/db/schema.ts`.

```
┌──────────────────┐     ┌──────────────────┐
│   user_profiles   │     │     printers      │
├──────────────────┤     ├──────────────────┤
│ id (uuid, PK)    │     │ id (serial, PK)  │
│ email            │     │ serial_number    │
│ role             │     │ name             │
│ created_at       │     │ ip_address       │
└────────┬─────────┘     │ access_code      │
         │               │ is_active        │
         │               │ created_at       │
         │               └────────┬─────────┘
         │                        │
    ┌────▼────────────────────────▼──┐
    │          petitions             │
    ├────────────────────────────────┤
    │ id (serial, PK)               │
    │ user_id (FK → user_profiles)  │
    │ printer_id (FK → printers)    │
    │ file_name                     │
    │ file_url                      │
    │ status                        │
    │ notes                         │
    │ created_at                    │
    └────────────────────────────────┘

    ┌──────────────────┐
    │      pieces       │
    ├──────────────────┤
    │ id (serial, PK)  │
    │ name             │
    │ file_path        │
    │ created_at       │
    └──────────────────┘
```

### Common Drizzle commands

```bash
pnpm db:push       # Push schema changes to database
pnpm db:generate   # Generate SQL migration files
pnpm db:migrate    # Run pending migrations
pnpm db:studio     # Open Drizzle Studio GUI
```

---

## Project Structure

```
3d-printing-web/
├── proxy.cjs                       # WebSocket ↔ TLS proxy (run separately)
├── .env.example                    # Environment variable template
├── drizzle.config.ts               # Drizzle ORM configuration
├── create-pieces-table.js          # Standalone script to create pieces table
├── src/
│   ├── env.js                      # T3 Env schema validation
│   ├── components/
│   │   ├── AuthScreen.tsx          # Login / Register form
│   │   ├── Topbar.tsx              # Top bar with MQTT status
│   │   ├── Sidebar.tsx             # Printer list + add printer
│   │   ├── AddPrinterModal.tsx     # Add printer form
│   │   ├── AddJobModal.tsx         # Upload & start print job
│   │   ├── MetricsRow.tsx          # Metric cards
│   │   ├── JobQueue.tsx            # Print job queue
│   │   └── PrinterDetail.tsx       # Detail panel (temps, AMS, speed)
│   ├── hooks/
│   │   └── useMqtt.ts              # MQTT connection hook
│   ├── lib/
│   │   ├── store.ts                # Zustand store (localStorage)
│   │   ├── supabase.ts             # Supabase client
│   │   └── types.ts                # TypeScript types + Bambu commands
│   ├── pages/
│   │   ├── index.tsx               # Main page (auth gate + dashboard)
│   │   ├── _app.tsx                # Next.js app wrapper
│   │   └── api/
│   │       ├── printers.ts         # POST — register printer
│   │       ├── petitions.ts        # POST — submit print request
│   │       ├── job.ts              # POST — send job to printer
│   │       └── pieces/
│   │           ├── index.ts        # GET — list uploaded pieces
│   │           └── upload.ts       # POST — upload .gcode/.3mf
│   ├── scripts/
│   │   └── add_job.py              # Python script to upload & start print
│   └── server/
│       └── db/
│           ├── index.ts            # Database connection
│           └── schema.ts           # Drizzle table definitions
├── test-supabase.cjs               # Standalone Supabase auth test
└── test-supabase.js                # ESM version of the test
```

---

## Deploying to Vercel

> Vercel lets you access the dashboard from anywhere, but the printer is only
> reachable if the proxy is running on your local network.

```bash
npm i -g vercel
vercel --prod
```

Add environment variables in the Vercel dashboard under **Settings → Environment Variables**:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_WS_PROXY_URL` — public URL of your proxy

### Exposing the proxy to the internet

**Option A — ngrok (easiest for testing):**

```bash
# Terminal 1: run the proxy
node proxy.cjs 192.168.0.35 your8digitcode

# Terminal 2: expose it
ngrok tcp 9001
# Use the ngrok URL as NEXT_PUBLIC_WS_PROXY_URL
```

**Option B — dedicated server (production):**
Run the proxy on a Raspberry Pi or always-on server on the same network as the printer.

---

## Troubleshooting

### `sh: 1: next: not found`
Dependencies are not installed:
```bash
pnpm install
```

### `Cannot find module 'node:fs'`
Node.js version is too old. Update to Node 20 with nvm (see Prerequisites).

### Printer shows as **offline**
- Make sure the proxy is running in Terminal 1
- Verify your laptop and printer are on the **same WiFi network**
- Check that the access code is correct
- Restart the dev server after any `.env` changes

### `ECONNRESET` in the proxy
Make sure `proxy.cjs` uses `tls.connect` instead of `net.createConnection`.

### Database connection errors
- Verify `DATABASE_URL` is correct in `.env`
- Check that your Supabase project is running
- Run `pnpm db:push` to ensure schema is up to date

### Python script errors
- Verify Python 3 is installed: `python3 --version`
- Install the SDK: `pip install bambulabs_api`
- Check that the printer is reachable from your machine

---

## License

MIT
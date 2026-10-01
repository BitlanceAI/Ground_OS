# Bitlance Ground OS

Welcome to **Bitlance Ground OS**, an AI-Powered Field Sales & Developer Intelligence Platform.

## Overview

Bitlance Ground OS provides a unified command center designed for field sales, real-time agent telemetry, meeting captures, and automation workflows. The platform is structured as a monorepo containing multiple front-end applications, back-end services, and shared libraries.

For a detailed breakdown of the system components and internal workflows, please refer to the [ARCHITECTURE.md](./ARCHITECTURE.md) file.

## Prerequisites

- **Node.js** (v20.0.0 or higher)
- **npm** (v10.0.0 or higher)
- **PostgreSQL** database (currently configured with Supabase)
- **Redis** server for real-time WebSocket capabilities

## Getting Started

1. **Install Dependencies**
   Install all dependencies across the monorepo from the root directory:
   ```bash
   npm install
   ```

2. **Environment Variables**
   Ensure you have a `.env` file at the root of the project with the necessary configuration (e.g., `DATABASE_URL`, `REDIS_URL`, API keys). You can copy the `.env.example` file and fill in your details:
   ```bash
   cp .env.example .env
   ```

3. **Database Setup**
   Ensure your database is running and accessible. Then, generate the Prisma client and run migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```
   To populate the database with the initial setup (admin/agent credentials), run:
   ```bash
   npm run db:seed
   ```

4. **Running the Development Server**
   Start the entire stack (web dashboard, API, worker, and PWA) concurrently:
   ```bash
   npm run dev
   ```
   
   If you wish to run individual services:
   - `npm run dev:web`
   - `npm run dev:api`
   - `npm run dev:worker`

## Scripts

- `npm run build` - Builds all apps and packages for production.
- `npm run lint` - Runs linting across the monorepo.
- `npm run type-check` - Verifies TypeScript types.
- `npm run clean` - Cleans build outputs and removes `node_modules`.

## License

All rights reserved.

# Bitlance Ground OS - Architecture

## System Overview

Bitlance Ground OS is a monorepo application structured using Turborepo. It serves as a unified command center for field sales, real-time agent telemetry, meeting captures, and automation.

The system is broken down into three main categories: Applications (Frontends), Services (Backends), and Packages (Shared Libraries).

## Architecture Layout

### 1. Applications (`/apps`)

- **Web Dashboard (`apps/web`)**
  The command center interface used by organization managers and administrators. It handles user authentication, live agent tracking, reporting, and customer insights.
  - Technology: React

- **Agent PWA (`apps/agent-pwa`)**
  A Progressive Web App built for field agents. It allows agents to view their daily schedules, submit high-accuracy GPS telemetry, check into visits, and record meeting audio and notes on the go.
  - Technology: React, Service Workers

### 2. Services (`/services`)

- **Main API (`services/api`)**
  The core RESTful backend service that handles business logic, database operations, and authentication. It orchestrates user workflows and triggers domain events to the Event Bus.
  - Technology: Node.js, Express, Prisma ORM

- **Realtime Gateway (`services/realtime`)**
  A dedicated WebSocket server designed for high-frequency, low-latency communication. It bridges agents and the web dashboard by listening to Redis Pub/Sub channels and broadcasting updates (like live telemetry and visit status changes).
  - Technology: Node.js, `ws`, Redis

- **Background Worker (`services/worker`)**
  An asynchronous background processor responsible for offloading heavy tasks from the main API, such as AI processing, generating meeting reports, and executing delayed jobs.
  - Technology: Node.js

### 3. Shared Packages (`/packages`)

- **Database (`packages/database`)**
  A centralized Prisma ORM configuration containing the database schema and the exported Prisma client, shared across all Node services to ensure consistent data access.

- **Types (`packages/types`)**
  Shared TypeScript interfaces and type definitions (e.g., Domain models, API request/response structures) utilized by both the frontend and backend.

- **UI (`packages/ui`)**
  A shared component library to maintain a unified design system between the web dashboard and the agent PWA.

## Core Workflows

1. **Authentication**
   Authentication is managed centrally via JWT. Valid tokens contain role definitions and strict organizational boundaries (`organizationId`).

2. **Real-time Telemetry**
   When a field agent logs into the PWA, their GPS coordinates are periodically pushed over WebSockets to the Realtime Gateway. The Gateway ensures authentication and delegates the message over a Redis Pub/Sub channel to be consumed and rebroadcast to respective dashboard users within the identical organization scope.

3. **Visit State Machine**
   Visit lifecycles transition through states (e.g., ASSIGNED -> EN_ROUTE -> ARRIVED -> MEETING_STARTED -> COMPLETED). The backend verifies physical locations against destination coordinates via geofencing before approving state transitions like `ARRIVED`.

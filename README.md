# Real-Time Bus Tracker — NestJS Backend Service

## Overview
A high-performance NestJS backend providing:
1. **1 Hz Real-Time Bus Telemetry** broadcasted via WebSockets (Socket.IO `bus:telemetry`).
2. **Dynamic Route Simulation** advancing buses along polyline coordinates, computing accurate headings and speeds.
3. **Spatial REST Queries**:
   - `GET /api/stops`: All bus stops
   - `GET /api/stops/nearby?lat=...&lng=...&radius=...`: Finds nearby stops with Haversine distance and walking time estimates
   - `GET /api/stops/:id`: Single stop metadata
   - `GET /api/stops/:id/arrivals`: Next arriving buses with live ETAs
   - `GET /api/routes`: Route polylines and stop sequences
   - `GET /api/routes/:id`: Single route
   - `GET /api/buses`: Active fleet overview

## Setup & Running
```bash
npm install
npm run start:dev
```
The server will start on port `3000`.
WebSocket connection endpoint: `ws://localhost:3000` or `http://localhost:3000`.

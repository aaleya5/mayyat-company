/**
 * src/index.ts — Application entry point
 *
 * Boots Express and Socket.io on the same HTTP server.
 * All route/middleware registration happens here so the
 * startup sequence is visible in one place.
 */

import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { Server } from "socket.io";
import type { ServerToClientEvents, ClientToServerEvents } from "@mayyat/shared";

import { mountRoutes } from "./routes/index.js";
import { initSocket } from "./lib/socket.js";

const PORT = Number(process.env.PORT) || 4000;

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "localhost:*", "ws://localhost:*"],
      },
    },
  })
);
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

// Health check — used by Docker's healthcheck and load balancers
app.get("/health", (_req, res) => res.json({ ok: true }));

// All API routes mounted under /api
mountRoutes(app);

// ---------------------------------------------------------------------------
// HTTP server + Socket.io
// ---------------------------------------------------------------------------

const httpServer = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN || "http://localhost:5173" },
});

// Store io on app.locals so route handlers can emit events
// without circular imports (routes import app, not io directly)
app.locals.io = io;

initSocket(io);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

httpServer.listen(PORT, () => {
  console.log(`\n🚀  API running at http://localhost:${PORT}`);
  console.log(`    Environment : ${process.env.NODE_ENV || "development"}`);
});
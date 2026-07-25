/**
 * src/lib/socket.ts
 *
 * Socket.io setup and typed emit helpers.
 *
 * Why emit helpers instead of calling io.emit() directly in routes?
 *   1. Type safety — the helpers enforce the correct payload shape
 *      as defined in @mayyat/shared ServerToClientEvents.
 *   2. Single place to add future logic (rooms, throttling, logging).
 *   3. Routes stay clean — they call emitRecordCreated(io, record)
 *      rather than io.emit("record:created", record).
 */

import type { Server } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  RecordRow,
} from "@mayyat/shared";

export type IoServer = Server<ClientToServerEvents, ServerToClientEvents>;

/** Called once from src/index.ts after the server is created. */
export function initSocket(io: IoServer) {
  io.on("connection", (socket) => {
    console.log(`[socket] client connected: ${socket.id}`);
    socket.on("disconnect", () => {
      console.log(`[socket] client disconnected: ${socket.id}`);
    });
  });
}

// ---------------------------------------------------------------------------
// Typed emit helpers — call these from route handlers
// ---------------------------------------------------------------------------

export function emitRecordCreated(io: IoServer, record: RecordRow) {
  io.emit("record:created", record);
}

export function emitRecordUpdated(io: IoServer, record: RecordRow) {
  io.emit("record:updated", record);
}

export function emitRecordDeleted(io: IoServer, id: string) {
  io.emit("record:deleted", { id });
}

export function emitRecordRestored(io: IoServer, record: RecordRow) {
  io.emit("record:restored", record);
}

//CRUD for /api/records

/**
 * src/routes/records.ts
 *
 * REST endpoints for death records.
 *
 * GET    /api/records          list with filters + pagination
 * GET    /api/records/:id      single record
 * POST   /api/records          create (ADMIN only)
 * PATCH  /api/records/:id      update (ADMIN only)
 * DELETE /api/records/:id      soft-delete (ADMIN only)
 * POST   /api/records/:id/restore  restore deleted record (ADMIN only)
 * GET    /api/records/:id/audit    audit trail for a record
 */

import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import {
  listRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  restoreRecord,
  getAuditLog,
} from "../lib/db.js";
import {
  createRecordSchema,
  updateRecordSchema,
  recordFiltersSchema,
} from "../validators/record.js";
import {
  emitRecordCreated,
  emitRecordUpdated,
  emitRecordDeleted,
  emitRecordRestored,
  type IoServer,
} from "../lib/socket.js";

export const recordsRouter = Router();

// ---------------------------------------------------------------------------
// GET /api/records
// ---------------------------------------------------------------------------
recordsRouter.get("/", authenticate, async (req, res) => {
  const parsed = recordFiltersSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid filters", details: parsed.error.flatten() });
  }

  // Non-admins can never see deleted records regardless of query param
  if (req.user?.role !== "ADMIN") {
    parsed.data.includeDeleted = false;
  }

  try {
    const result = await listRecords(parsed.data);
    res.json(result);
  } catch (err) {
    console.error("[records] list error:", err);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/records/:id
// ---------------------------------------------------------------------------
recordsRouter.get("/:id", authenticate, async (req, res) => {
  const includeDeleted = req.user?.role === "ADMIN";
  try {
    const record = await getRecord(req.params.id, includeDeleted);
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json(record);
  } catch (err) {
    console.error("[records] get error:", err);
    res.status(500).json({ error: "Failed to fetch record" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/records
// ---------------------------------------------------------------------------
recordsRouter.post("/", authenticate, requireRole("ADMIN"), async (req, res) => {
  const parsed = createRecordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  }

  try {
    const record = await createRecord(parsed.data, req.user!.id);
    const io: IoServer = req.app.locals.io;
    emitRecordCreated(io, record as any);
    res.status(201).json(record);
  } catch (err: any) {
    if (err?.code === "P2002") {
      // Prisma unique constraint — duplicate srNo
      return res.status(409).json({ error: "A record with this serial number already exists" });
    }
    console.error("[records] create error:", err);
    res.status(500).json({ error: "Failed to create record" });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/records/:id
// ---------------------------------------------------------------------------
recordsRouter.patch("/:id", authenticate, requireRole("ADMIN"), async (req, res) => {
  const parsed = updateRecordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  }

  try {
    const record = await updateRecord(req.params.id, parsed.data, req.user!.id);
    const io: IoServer = req.app.locals.io;
    emitRecordUpdated(io, record as any);
    res.json(record);
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Record not found" });
    }
    console.error("[records] update error:", err);
    res.status(500).json({ error: "Failed to update record" });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/records/:id  (soft delete)
// ---------------------------------------------------------------------------
recordsRouter.delete("/:id", authenticate, requireRole("ADMIN"), async (req, res) => {
  try {
    const record = await deleteRecord(req.params.id, req.user!.id);
    const io: IoServer = req.app.locals.io;
    emitRecordDeleted(io, record.id);
    res.json({ ok: true });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "Record not found" });
    }
    console.error("[records] delete error:", err);
    res.status(500).json({ error: "Failed to delete record" });
  }
});

// ---------------------------------------------------------------------------
// POST /api/records/:id/restore
// ---------------------------------------------------------------------------
recordsRouter.post("/:id/restore", authenticate, requireRole("ADMIN"), async (req, res) => {
  try {
    const record = await restoreRecord(req.params.id, req.user!.id);
    const io: IoServer = req.app.locals.io;
    emitRecordRestored(io, record as any);
    res.json(record);
  } catch (err) {
    console.error("[records] restore error:", err);
    res.status(500).json({ error: "Failed to restore record" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/records/:id/audit
// ---------------------------------------------------------------------------
recordsRouter.get("/:id/audit", authenticate, requireRole("ADMIN"), async (req, res) => {
  try {
    const logs = await getAuditLog(req.params.id);
    res.json(logs);
  } catch (err) {
    console.error("[records] audit error:", err);
    res.status(500).json({ error: "Failed to fetch audit log" });
  }
});
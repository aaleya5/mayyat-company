import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/requireRole";
import { prisma } from "../lib/db";

export const recordsRouter = Router();

// Treat empty strings and null from the form/DB round-trip as "not provided"
// rather than a literal value. null shows up for older records that never had
// a value (e.g. srNo), "" shows up from untouched optional fields on the form.
const emptyToUndefined = (val: unknown) => (val === "" || val === null ? undefined : val);

// Validation schema
const createRecordSchema = z.object({
  srNo: z.preprocess(emptyToUndefined, z.number().optional()),
  name: z.string().min(1).max(255),
  ageText: z.preprocess(emptyToUndefined, z.string().max(100).optional()),
  gender: z.enum(["MALE", "FEMALE", "UNKNOWN"]).optional().default("UNKNOWN"),
  burialDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date"),
  burialDay: z.preprocess(emptyToUndefined, z.string().optional()),
  burialTime: z.preprocess(emptyToUndefined, z.string().optional()),
  deathTime: z.preprocess(emptyToUndefined, z.string().optional()),
  deathDate: z.preprocess(
    emptyToUndefined,
    z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid date").optional()
  ),
  misriDate: z.preprocess(emptyToUndefined, z.string().optional()),
  relativeName: z.preprocess(emptyToUndefined, z.string().optional()),
});

type CreateRecordInput = z.infer<typeof createRecordSchema>;

/**
 * GET /api/records
 * List all records with filters, search, and pagination
 * 
 * Query params:
 * - q: search query
 * - year: burial year
 * - month: burial month (1-12)
 * - gender: MALE|FEMALE|UNKNOWN
 * - ageMin: minimum age
 * - ageMax: maximum age
 * - page: page number (default 1)
 * - limit: records per page (default 50, max 200)
 * - sortBy: column to sort by
 * - sortDir: asc|desc
 * - includeDeleted: show deleted records (admin only)
 */
recordsRouter.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const {
      q,
      year,
      month,
      gender,
      ageMin,
      ageMax,
      page = "1",
      limit = "50",
      sortBy = "burialDate",
      sortDir = "desc",
      includeDeleted = "false",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string) || 50));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (includeDeleted !== "true") {
      where.isDeleted = false;
    }

    if (year) {
      const yearNum = parseInt(year as string);
      where.burialDate = {
        gte: new Date(`${yearNum}-01-01`),
        lt: new Date(`${yearNum + 1}-01-01`),
      };
    }

    if (month) {
      const monthNum = parseInt(month as string);
      const year_val = year ? parseInt(year as string) : new Date().getFullYear();
      where.burialDate = {
        gte: new Date(`${year_val}-${monthNum.toString().padStart(2, "0")}-01`),
        lt: new Date(`${year_val}-${(monthNum + 1).toString().padStart(2, "0")}-01`),
      };
    }

    if (gender && gender !== "UNKNOWN") {
      where.gender = gender;
    }

    if (ageMin) {
      where.ageYears = { gte: parseInt(ageMin as string) };
    }

    if (ageMax) {
      where.ageYears = { ...where.ageYears, lte: parseInt(ageMax as string) };
    }

    // Full-text search
    if (q) {
      const searchTerm = (q as string).trim();
      where.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { relativeName: { contains: searchTerm, mode: "insensitive" } },
        { misriDate: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.record.count({ where });

    // Get records with sorting
    const orderBy: any = {};
    orderBy[sortBy as string] = sortDir === "asc" ? "asc" : "desc";

    const rows = await prisma.record.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
    });

    res.json({
      rows,
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error: any) {
    console.error("GET /records error:", error);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

/**
 * GET /api/records/:id
 * Get single record by ID
 */
recordsRouter.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const record = await prisma.record.findUnique({
      where: { id: req.params.id },
    });

    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json(record);
  } catch (error: any) {
    console.error("GET /records/:id error:", error);
    res.status(500).json({ error: "Failed to fetch record" });
  }
});

/**
 * POST /api/records
 * Create new record (ADMIN only)
 */
recordsRouter.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const data = createRecordSchema.parse(req.body);

      const record = await prisma.record.create({
        data: {
          ...data,
          burialDate: new Date(data.burialDate),
          deathDate: data.deathDate ? new Date(data.deathDate) : undefined,
          ageYears: data.ageText
            ? parseFloat(data.ageText.match(/\d+/)?.[0] || "0")
            : undefined,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: "CREATE",
          recordId: record.id,
          userId: (req as any).user.id,
          diff: { before: null, after: record },
        },
      });

      res.status(201).json(record);
    } catch (error: any) {
      console.error("POST /records error:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }

      res.status(500).json({ error: "Failed to create record" });
    }
  }
);

/**
 * PATCH /api/records/:id
 * Update record (ADMIN only)
 */
recordsRouter.patch(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      // Fetch before state for audit log
      const before = await prisma.record.findUnique({
        where: { id: req.params.id },
      });

      if (!before) {
        return res.status(404).json({ error: "Record not found" });
      }

      const data = createRecordSchema.partial().parse(req.body);

      const record = await prisma.record.update({
        where: { id: req.params.id },
        data: {
          ...data,
          burialDate: data.burialDate ? new Date(data.burialDate) : undefined,
          deathDate: data.deathDate ? new Date(data.deathDate) : undefined,
          ageYears: data.ageText
            ? parseFloat(data.ageText.match(/\d+/)?.[0] || "0")
            : before.ageYears,
        },
      });

      // Create audit log with diff
      await prisma.auditLog.create({
        data: {
          action: "UPDATE",
          recordId: record.id,
          userId: (req as any).user.id,
          diff: { before, after: record },
        },
      });

      res.json(record);
    } catch (error: any) {
      console.error("PATCH /records/:id error:", error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }

      res.status(500).json({ error: "Failed to update record" });
    }
  }
);

/**
 * DELETE /api/records/:id
 * Soft delete record (ADMIN only)
 * 
 * Sets isDeleted = true and deletedAt = now()
 * Record is hidden from normal queries but can be restored
 */
recordsRouter.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const record = await prisma.record.findUnique({
        where: { id: req.params.id },
      });

      if (!record) {
        return res.status(404).json({ error: "Record not found" });
      }

      const deleted = await prisma.record.update({
        where: { id: req.params.id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: "DELETE",
          recordId: deleted.id,
          userId: (req as any).user.id,
          diff: { before: record, after: deleted },
        },
      });

      res.json({ message: "Record deleted", id: deleted.id });
    } catch (error: any) {
      console.error("DELETE /records/:id error:", error);
      res.status(500).json({ error: "Failed to delete record" });
    }
  }
);

/**
 * POST /api/records/:id/restore
 * Restore soft-deleted record (ADMIN only)
 * 
 * Sets isDeleted = false and deletedAt = null
 */
recordsRouter.post(
  "/:id/restore",
  authenticate,
  requireRole("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const record = await prisma.record.findUnique({
        where: { id: req.params.id },
      });

      if (!record) {
        return res.status(404).json({ error: "Record not found" });
      }

      if (!record.isDeleted) {
        return res.status(400).json({ error: "Record is not deleted" });
      }

      const restored = await prisma.record.update({
        where: { id: req.params.id },
        data: {
          isDeleted: false,
          deletedAt: null,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: "RESTORE",
          recordId: restored.id,
          userId: (req as any).user.id,
          diff: { before: record, after: restored },
        },
      });

      res.json(restored);
    } catch (error: any) {
      console.error("POST /records/:id/restore error:", error);
      res.status(500).json({ error: "Failed to restore record" });
    }
  }
);

/**
 * GET /api/records/:id/audit
 * Get audit log for a record (ADMIN only)
 */
recordsRouter.get(
  "/:id/audit",
  authenticate,
  requireRole("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const logs = await prisma.auditLog.findMany({
        where: { recordId: req.params.id },
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
        orderBy: { changedAt: "desc" },
      });

      res.json({ recordId: req.params.id, history: logs });
    } catch (error: any) {
      console.error("GET /records/:id/audit error:", error);
      res.status(500).json({ error: "Failed to fetch audit log" });
    }
  }
);

export default recordsRouter;
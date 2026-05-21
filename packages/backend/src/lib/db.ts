//Prisma singleton + query helpers

/**
 * src/lib/db.ts
 *
 * Single Prisma client instance shared across the whole app.
 *
 * Why a singleton?
 *   PrismaClient opens a connection pool on construction. If you do
 *   `new PrismaClient()` in every file, you'll exhaust Postgres's
 *   max_connections (default 100) very quickly in development where
 *   modules re-evaluate on hot reload. One instance, imported everywhere.
 *
 * Typed query helpers for records are co-located here so the query
 * logic stays in one place. Controllers stay thin; they just call these.
 */

import { PrismaClient, Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of a record row returned to the client */
export type RecordRow = Prisma.RecordGetPayload<{
  select: typeof recordSelect;
}>;

/** Columns we return to the client — never expose internal tsvector or huge diffs */
export const recordSelect = {
  id: true,
  srNo: true,
  name: true,
  ageText: true,
  ageYears: true,
  burialDate: true,
  burialDay: true,
  burialTime: true,
  misriDate: true,
  deathTime: true,
  deathDate: true,
  relativeName: true,
  gender: true,
  isDeleted: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  // searchVector is excluded — it's a Postgres-internal tsvector blob
} as const;

// ---------------------------------------------------------------------------
// Filter params type (what the API receives from query string)
// ---------------------------------------------------------------------------

export interface RecordFilters {
  /** Free-text search across name, relative, misri date */
  q?: string;
  /** Filter to a specific calendar year (burial year) */
  year?: number;
  /** Filter to a specific calendar month 1-12 (burial month) */
  month?: number;
  /** Filter by day of week ("Friday") */
  day?: string;
  /** Minimum age in years (inclusive) */
  ageMin?: number;
  /** Maximum age in years (inclusive) */
  ageMax?: number;
  /** Include soft-deleted rows (admin only) */
  includeDeleted?: boolean;
  /** Pagination */
  page?: number;
  limit?: number;
  /** Sort column */
  sortBy?: "burialDate" | "name" | "srNo" | "ageYears";
  sortDir?: "asc" | "desc";
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

/**
 * List records with filtering, search, and pagination.
 *
 * Search strategy:
 *   - If q is short (< 3 chars) or looks like a name fragment, use trigram ILIKE.
 *     This handles partial matches: "meh" → "mehfuzaben"
 *   - If q is longer, use the full-text search_vector for ranked results.
 *   We always do ILIKE as a fallback so short queries still work.
 *
 * Why raw SQL for the search part?
 *   Prisma doesn't support GIN/tsvector queries in its query builder.
 *   We use $queryRaw for the search path and the normal Prisma API for
 *   simple filtered list queries. Both go through the same connection pool.
 */
export async function listRecords(filters: RecordFilters) {
  const {
    q,
    year,
    month,
    day,
    ageMin,
    ageMax,
    includeDeleted = false,
    page = 1,
    limit = 50,
    sortBy = "burialDate",
    sortDir = "desc",
  } = filters;

  const offset = (page - 1) * limit;

  // If there's a search query, delegate to the raw search function
  if (q && q.trim().length >= 2) {
    return searchRecords({ q: q.trim(), page, limit, includeDeleted });
  }

  // -------------------------------------------------------------------------
  // Standard filtered list (no full-text search)
  // -------------------------------------------------------------------------

  const where: Prisma.RecordWhereInput = {
    isDeleted: includeDeleted ? undefined : false,
    ...(year && {
      burialDate: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      },
    }),
    ...(month &&
      !year && {
        // month filter without year — match any year
        // Prisma doesn't have a native month extractor, so we use AND with raw
        // For simplicity we fall through to raw SQL when month is provided alone
      }),
    ...(day && { burialDay: { equals: day, mode: "insensitive" } }),
    ...(ageMin !== undefined && { ageYears: { gte: ageMin } }),
    ...(ageMax !== undefined && { ageYears: { lte: ageMax } }),
  };

  // Month-only filter needs raw SQL (Prisma lacks EXTRACT)
  if (month) {
    return monthFilterQuery({ month, year, includeDeleted, page, limit });
  }

  const orderBy: Prisma.RecordOrderByWithRelationInput = {
    [sortBy]: sortDir,
  };

  const [total, rows] = await prisma.$transaction([
    prisma.record.count({ where }),
    prisma.record.findMany({
      where,
      select: recordSelect,
      orderBy,
      skip: offset,
      take: limit,
    }),
  ]);

  return { total, page, limit, rows };
}

/**
 * Full-text + trigram search.
 * Uses Postgres's @@ operator on the tsvector column for ranked results,
 * with a trigram ILIKE fallback for partial words.
 */
async function searchRecords({
  q,
  page,
  limit,
  includeDeleted,
}: {
  q: string;
  page: number;
  limit: number;
  includeDeleted: boolean;
}) {
  const offset = (page - 1) * limit;
  const deletedClause = includeDeleted ? Prisma.sql`` : Prisma.sql`AND is_deleted = FALSE`;

  // ts_query: convert search string to tsquery (prefix matching with :*)
  // The ILIKE fallback ensures short or partial terms still match
  const rows = await prisma.$queryRaw<RecordRow[]>`
    SELECT
      id, sr_no AS "srNo", name, age_text AS "ageText", age_years AS "ageYears",
      burial_date AS "burialDate", burial_day AS "burialDay", burial_time AS "burialTime",
      misri_date AS "misriDate", death_time AS "deathTime", death_date AS "deathDate",
      relative_name AS "relativeName", is_deleted AS "isDeleted",
      deleted_at AS "deletedAt", created_at AS "createdAt", updated_at AS "updatedAt",
      ts_rank(search_vector, query) AS rank
    FROM records, to_tsquery('simple', unaccent(${q}) || ':*') AS query
    WHERE (
      search_vector @@ query
      OR name ILIKE ${'%' + q + '%'}
      OR relative_name ILIKE ${'%' + q + '%'}
    )
    ${deletedClause}
    ORDER BY rank DESC, burial_date DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) FROM records, to_tsquery('simple', unaccent(${q}) || ':*') AS query
    WHERE (
      search_vector @@ query
      OR name ILIKE ${'%' + q + '%'}
      OR relative_name ILIKE ${'%' + q + '%'}
    )
    ${deletedClause}
  `;

  return {
    total: Number(countResult[0].count),
    page,
    limit,
    rows,
  };
}

/**
 * Month-filter query using Postgres EXTRACT.
 * Called when the UI filters by month (with or without a year).
 */
async function monthFilterQuery({
  month,
  year,
  includeDeleted,
  page,
  limit,
}: {
  month: number;
  year?: number;
  includeDeleted: boolean;
  page: number;
  limit: number;
}) {
  const offset = (page - 1) * limit;
  const deletedClause = includeDeleted ? Prisma.sql`` : Prisma.sql`AND is_deleted = FALSE`;
  const yearClause = year
    ? Prisma.sql`AND EXTRACT(YEAR FROM burial_date) = ${year}`
    : Prisma.sql``;

  const rows = await prisma.$queryRaw<RecordRow[]>`
    SELECT
      id, sr_no AS "srNo", name, age_text AS "ageText", age_years AS "ageYears",
      burial_date AS "burialDate", burial_day AS "burialDay", burial_time AS "burialTime",
      misri_date AS "misriDate", death_time AS "deathTime", death_date AS "deathDate",
      relative_name AS "relativeName", is_deleted AS "isDeleted",
      deleted_at AS "deletedAt", created_at AS "createdAt", updated_at AS "updatedAt"
    FROM records
    WHERE EXTRACT(MONTH FROM burial_date) = ${month}
    ${yearClause}
    ${deletedClause}
    ORDER BY burial_date DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) FROM records
    WHERE EXTRACT(MONTH FROM burial_date) = ${month}
    ${yearClause}
    ${deletedClause}
  `;

  return { total: Number(countResult[0].count), page, limit, rows };
}

/**
 * Get a single record by ID (not soft-deleted unless admin requests it)
 */
export async function getRecord(id: string, includeDeleted = false) {
  return prisma.record.findFirst({
    where: { id, isDeleted: includeDeleted ? undefined : false },
    select: recordSelect,
  });
}

/**
 * Create a record and write an audit log entry atomically.
 * userId = the logged-in user making the change.
 */
export async function createRecord(
  data: Prisma.RecordCreateInput,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const record = await tx.record.create({ data, select: recordSelect });
    await tx.auditLog.create({
      data: {
        action: "CREATE",
        recordId: record.id,
        userId,
        diff: { before: null, after: record },
      },
    });
    return record;
  });
}

/**
 * Update a record with before/after diff in the audit log.
 */
export async function updateRecord(
  id: string,
  data: Prisma.RecordUpdateInput,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.record.findUniqueOrThrow({
      where: { id },
      select: recordSelect,
    });
    const after = await tx.record.update({
      where: { id },
      data,
      select: recordSelect,
    });
    await tx.auditLog.create({
      data: {
        action: "UPDATE",
        recordId: id,
        userId,
        diff: { before, after },
      },
    });
    return after;
  });
}

/**
 * Soft-delete a record. Never physically removes the row.
 */
export async function deleteRecord(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const record = await tx.record.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
      select: recordSelect,
    });
    await tx.auditLog.create({
      data: {
        action: "DELETE",
        recordId: id,
        userId,
        diff: { before: record, after: null },
      },
    });
    return record;
  });
}

/**
 * Restore a soft-deleted record.
 */
export async function restoreRecord(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const record = await tx.record.update({
      where: { id },
      data: { isDeleted: false, deletedAt: null },
      select: recordSelect,
    });
    await tx.auditLog.create({
      data: {
        action: "RESTORE",
        recordId: id,
        userId,
        diff: { before: null, after: record },
      },
    });
    return record;
  });
}
// =============================================================================
// @mayyat/shared — types/index.ts
//
// Single source of truth for every type used by BOTH backend and frontend.
// Import from here in both packages:
//
//   import type { RecordRow, RecordFilters, SocketEvents } from "@mayyat/shared";
//
// Rules for this file:
//   - No runtime code (no functions, no classes). Types only.
//   - No package imports (this package has zero dependencies by design).
//   - If a type is only used in one package, keep it there.
// =============================================================================

// ---------------------------------------------------------------------------
// Enums
// (Defined as const objects so they're usable as values at runtime too,
// not just as TypeScript types. Backend mirrors these in Prisma schema.)
// ---------------------------------------------------------------------------

export const Gender = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  UNKNOWN: "UNKNOWN",
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const Role = {
  ADMIN: "ADMIN",
  VIEWER: "VIEWER",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const AuditAction = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  RESTORE: "RESTORE",
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

// ---------------------------------------------------------------------------
// Core domain types
// ---------------------------------------------------------------------------

/** A single death record as returned by the API. */
export interface RecordRow {
  id: string;
  srNo: number | null;
  name: string;
  ageText: string | null;
  ageYears: number | null;
  gender: Gender;
  burialDate: string; // ISO 8601 date string — JSON doesn't have a Date type
  burialDay: string | null;
  burialTime: string | null;
  misriDate: string | null;
  deathTime: string | null;
  deathDate: string | null; // null = same day as burial
  relativeName: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating a new record. All optional except name + burialDate. */
export interface CreateRecordInput {
  srNo?: number;
  name: string;
  ageText?: string;
  gender?: Gender;
  burialDate: string; // "YYYY-MM-DD"
  burialDay?: string;
  burialTime?: string;
  misriDate?: string;
  deathTime?: string;
  deathDate?: string; // omit if same day as burial
  relativeName?: string;
  // causeOfDeath?: string;  // uncomment when ready
}

/** Payload for updating an existing record. All fields optional. */
export type UpdateRecordInput = Partial<CreateRecordInput>;

// ---------------------------------------------------------------------------
// Filter / query params
// (Used by frontend to build query strings, backend to parse them.)
// ---------------------------------------------------------------------------

export interface RecordFilters {
  q?: string;           // free-text search
  year?: number;        // burial year
  month?: number;       // burial month (1–12)
  day?: string;         // day of week ("Friday")
  gender?: Gender;
  ageMin?: number;
  ageMax?: number;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "burialDate" | "name" | "srNo" | "ageYears";
  sortDir?: "asc" | "desc";
}

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  rows: T[];
}

export interface ApiError {
  error: string;
  details?: unknown;
}

// ---------------------------------------------------------------------------
// Auth types
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export interface AuditLogRow {
  id: string;
  action: AuditAction;
  recordId: string | null;
  userId: string;
  changedAt: string;
  diff: {
    before: RecordRow | null;
    after: RecordRow | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Socket.io event map
// (Used by both server and client to keep event names and payload types in sync.
// If you rename an event here, TypeScript will error in both packages.)
// ---------------------------------------------------------------------------

export interface ServerToClientEvents {
  /** Emitted when any client creates a new record */
  "record:created": (record: RecordRow) => void;
  /** Emitted when any client updates an existing record */
  "record:updated": (record: RecordRow) => void;
  /** Emitted when any client soft-deletes a record */
  "record:deleted": (payload: { id: string }) => void;
  /** Emitted when a deleted record is restored */
  "record:restored": (record: RecordRow) => void;
}

export interface ClientToServerEvents {
  // No client→server socket events yet.
  // Future: "record:typing" for collaborative editing indicators.
}

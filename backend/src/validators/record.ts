/**
 * src/validators/record.ts
 *
 * Zod schemas that validate and coerce incoming request bodies.
 *
 * Why Zod?
 *   TypeScript types disappear at runtime — your compiled JS has no idea
 *   what shape an incoming JSON body has. Zod validates AND narrows the
 *   type, so after z.parse() the object is both safe and fully typed.
 *   No separate validation library + type cast needed.
 */

import { z } from "zod";

const genderEnum = z.enum(["MALE", "FEMALE", "UNKNOWN"]).default("UNKNOWN");

// "YYYY-MM-DD" string that coerces to a JS Date for DB insertion
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD format")
  .transform((s) => new Date(s));

const timeString = z
  .string()
  .regex(/^\d{1,2}\.\d{2}\s?(am|pm)$/i, 'Expected format like "4.00 pm"')
  .optional();

export const createRecordSchema = z.object({
  srNo: z.number().int().positive().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  ageText: z.string().optional(),
  gender: genderEnum,
  burialDate: isoDate,
  burialDay: z.string().optional(),
  burialTime: timeString,
  misriDate: z.string().optional(),
  deathTime: timeString,
  deathDate: isoDate.optional(),
  relativeName: z.string().optional(),
  // causeOfDeath: z.string().optional(),  // uncomment when ready
});

// Update uses the same fields but all are optional
export const updateRecordSchema = createRecordSchema.partial();

// Query params for GET /api/records
export const recordFiltersSchema = z.object({
  q: z.string().optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  day: z.string().optional(),
  gender: genderEnum.optional(),
  ageMin: z.coerce.number().min(0).optional(),
  ageMax: z.coerce.number().max(150).optional(),
  includeDeleted: z.coerce.boolean().default(false),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  sortBy: z
    .enum(["burialDate", "name", "srNo", "ageYears"])
    .default("burialDate"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type RecordFiltersInput = z.infer<typeof recordFiltersSchema>;

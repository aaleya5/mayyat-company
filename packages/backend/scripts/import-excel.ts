/**
 * scripts/import-excel.ts
 *
 * One-time import of the existing Excel records into PostgreSQL.
 * Run with:  npx tsx scripts/import-excel.ts ./data/mayyat_company_records.xlsx
 *
 * What it does:
 *   1. Reads the .xlsx with ExcelJS (handles Excel serial dates correctly)
 *   2. Parses and normalises every row
 *   3. Upserts into `records` using sr_no as the conflict key
 *      (safe to re-run — won't duplicate rows)
 *   4. Runs the search_vector backfill via raw SQL
 *   5. Prints a summary
 *
 * Why ExcelJS over xlsx/SheetJS?
 *   Excel stores dates as serial numbers (e.g. 44811 = 2022-08-19).
 *   ExcelJS reads cell types and gives you real JS Date objects without
 *   you having to convert the serial manually. SheetJS can do it too but
 *   requires explicit options that are easy to forget.
 */

import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import path from "path";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RawRow {
  srNo: number | null;
  name: string;
  ageText: string | null;
  burialDate: Date | null;
  burialDay: string | null;
  misriDate: string | null;
  deathTime: string | null;
  deathDate: Date | null;
  burialTime: string | null;
  relativeName: string | null;
}

interface ParsedRow extends RawRow {
  ageYears: number | null;
  gender: "MALE" | "FEMALE" | "UNKNOWN";
}

// ---------------------------------------------------------------------------
// Gender detection
// ---------------------------------------------------------------------------

/**
 * Bohra community names carry gendered suffixes consistently enough to
 * auto-detect with ~90% accuracy. FEMALE is checked first (more distinctive),
 * then MALE fragments, then UNKNOWN. The UI lets users correct the rest.
 *
 * FEMALE: ben, banu, bai, bu, begum, bibi, khatun
 * MALE:   bhai, husain, ali, uddin, ahmed, and most others
 */
function detectGender(name: string | null): "MALE" | "FEMALE" | "UNKNOWN" {
  if (!name) return "UNKNOWN";
  const n = name.trim().toLowerCase();

  const femaleSuffixes = ["ben", "banu", "bai", "bibi", "bibiben", "begum", "khatun", "khanum"];
  if (femaleSuffixes.some((s) => n.endsWith(s) || n.includes(s + " "))) return "FEMALE";

  const femaleStarts = ["fatema", "mariyam", "zainab", "hasina", "rehanaben", "jubeda", "fazila", "sugra"];
  if (femaleStarts.some((f) => n.startsWith(f))) return "FEMALE";

  const maleSuffixes = ["bhai", "husain", "ali", "uddin", "ahmed", "khan", "rashid", "ullah"];
  if (maleSuffixes.some((s) => n.endsWith(s) || n.includes(s + " "))) return "MALE";

  return "UNKNOWN";
}

// ---------------------------------------------------------------------------
// Age parsing
// ---------------------------------------------------------------------------

/**
 * Attempts to extract a numeric age in years from the raw age text.
 * Returns null when the text is non-numeric or indeterminate.
 *
 * Examples:
 *   "84"         → 84
 *   "approx.60"  → 60   (extracts first number found)
 *   "1 day"      → 0    (< 1 year)
 *   "1 hour"     → 0    (< 1 year)
 *   ""           → null
 */
function parseAgeYears(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();
  if (!s) return null;

  // Sub-year cases
  if (s.includes("day") || s.includes("hour") || s.includes("month")) return 0;

  // Extract first number
  const match = s.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  return parseFloat(match[1]);
}

// ---------------------------------------------------------------------------
// Cell value helpers
// ---------------------------------------------------------------------------

function cellText(val: ExcelJS.CellValue): string | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s === "" ? null : s;
}

function cellDate(val: ExcelJS.CellValue): Date | null {
  if (val instanceof Date) return val;
  if (typeof val === "number") {
    // Excel serial date: days since 1899-12-30
    const date = new Date((val - 25569) * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function cellInt(val: ExcelJS.CellValue): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = Number(val);
  return isNaN(n) ? null : Math.floor(n);
}

// ---------------------------------------------------------------------------
// Row parser
// ---------------------------------------------------------------------------

/**
 * Columns in your Excel (0-indexed):
 *   0  sr no
 *   1  Death person name
 *   2  age
 *   3  Date          ← burial date (Excel serial or Date)
 *   4  day
 *   5  misri date
 *   6  death time
 *   7  Death date    ← may be empty if same as burial
 *   8  dafnavano time (burial time)
 *   9  relative name
 */
function parseRow(row: ExcelJS.Row, rowNumber: number): ParsedRow | null {
  const values = row.values as ExcelJS.CellValue[]; // index 1-based in ExcelJS

  const name = cellText(values[2]);
  if (!name) return null; // skip truly empty rows

  const burialDate = cellDate(values[4]);
  if (!burialDate) {
    console.warn(`Row ${rowNumber}: skipping — could not parse burial date`);
    return null;
  }

  const rawAge = cellText(values[3]);

  return {
    srNo: cellInt(values[1]),
    name,
    ageText: rawAge,
    ageYears: parseAgeYears(rawAge),
    burialDate,
    burialDay: cellText(values[5]),
    misriDate: cellText(values[6]),
    deathTime: cellText(values[7]),
    deathDate: cellDate(values[8]) ?? null,
    burialTime: cellText(values[9]),
    relativeName: cellText(values[10]),
    gender: detectGender(name),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/import-excel.ts <path-to-xlsx>");
    process.exit(1);
  }

  console.log(`\n📂  Reading: ${path.resolve(filePath)}`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    console.error("No worksheets found in file.");
    process.exit(1);
  }

  const rows: ParsedRow[] = [];
  const skipped: number[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const parsed = parseRow(row, rowNumber);
    if (parsed) {
      rows.push(parsed);
    } else {
      skipped.push(rowNumber);
    }
  });

  console.log(`\n✅  Parsed ${rows.length} valid rows, skipped ${skipped.length}`);
  if (skipped.length > 0) {
    console.log(`    Skipped rows: ${skipped.join(", ")}`);
  }

  // -------------------------------------------------------------------------
  // Upsert in batches of 100 (Postgres handles large arrays fine but batching
  // keeps memory usage predictable and gives you progress output)
  // -------------------------------------------------------------------------

  const BATCH = 100;
  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);

    // We use a raw upsert for performance — prisma.record.upsert() inside a
    // loop would fire N separate queries; createMany doesn't support ON CONFLICT
    // with update. This executes one statement per batch.
    const result = await prisma.$transaction(
      batch.map((r) =>
        prisma.record.upsert({
          where: {
            // srNo is @unique; rows without srNo use a placeholder that will
            // never match so they always INSERT (srNo: -i ensures uniqueness
            // within a batch for rows that have no original serial number)
            srNo: r.srNo ?? -(i + batch.indexOf(r) + 1),
          },
          create: {
            srNo: r.srNo,
            name: r.name,
            ageText: r.ageText,
            ageYears: r.ageYears,
            burialDate: r.burialDate!,
            burialDay: r.burialDay,
            burialTime: r.burialTime,
            misriDate: r.misriDate,
            deathTime: r.deathTime,
            deathDate: r.deathDate,
            relativeName: r.relativeName,
            gender: r.gender,
          },
          update: {
            // On re-run: update everything except the primary key
            name: r.name,
            ageText: r.ageText,
            ageYears: r.ageYears,
            burialDate: r.burialDate!,
            burialDay: r.burialDay,
            burialTime: r.burialTime,
            misriDate: r.misriDate,
            deathTime: r.deathTime,
            deathDate: r.deathDate,
            relativeName: r.relativeName,
            gender: r.gender,
          },
          select: { id: true }, // minimal return to save bandwidth
        })
      )
    );

    inserted += result.length;
    process.stdout.write(
      `\r    Progress: ${Math.min(i + BATCH, rows.length)} / ${rows.length}`
    );
  }

  console.log(`\n\n📊  Import complete:`);
  console.log(`    Rows processed : ${rows.length}`);
  console.log(`    Upserted       : ${inserted}`);

  // -------------------------------------------------------------------------
  // Backfill search_vector for all rows (trigger handles future inserts)
  // -------------------------------------------------------------------------

  console.log("\n🔍  Backfilling full-text search vectors...");
  const { count } = await prisma.$executeRaw`
    UPDATE records
    SET search_vector = records_search_vector(name, relative_name, misri_date)
    WHERE search_vector IS NULL
  `;
  console.log(`    Updated ${count} rows`);

  console.log("\n🎉  Done.\n");
}

main()
  .catch((e) => {
    console.error("\n❌  Import failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
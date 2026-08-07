import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { prisma } from "../lib/db";

export const statsRouter = Router();

interface YearMonthCount {
  year: number;
  month: number;
  count: number;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Age brackets confirmed with the user for increment 4.5. "Unknown" catches
// records with no parseable age (ageYears is null) - not folded into 0-18,
// since a missing age is a data-quality fact worth surfacing, not silently
// treated as a young age.
const AGE_BRACKETS: Array<{ label: string; min: number; max: number }> = [
  { label: "0–18", min: 0, max: 18 },
  { label: "19–40", min: 19, max: 40 },
  { label: "41–60", min: 41, max: 60 },
  { label: "61–80", min: 61, max: 80 },
  { label: "81+", min: 81, max: Infinity },
];

function bucketAge(ageYears: number | null): string {
  if (ageYears == null) return "Unknown";
  const bracket = AGE_BRACKETS.find((b) => ageYears >= b.min && ageYears <= b.max);
  return bracket ? bracket.label : "Unknown";
}

/**
 * GET /api/stats
 *
 * Consolidated aggregate stats for the Tally Interface (phase 4):
 *   - totalRecords
 *   - yearsCovered (first/last year with a record)
 *   - byYear (count per year, ascending)
 *   - tallyGrid (year x month grid - the literal "tally sheet")
 *   - byGender (count per gender)
 *   - byAgeBracket (count per age bracket, brackets confirmed with the user)
 *
 * Open to any authenticated role (ADMIN and VIEWER) - opened up in
 * increment 4.6 per the user's decision after seeing the page.
 */
statsRouter.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    // Year/month extraction needs raw SQL - Prisma's groupBy can't group by
    // a date part directly. Parameterized (no user input here, but keeping
    // the habit) via Prisma's tagged-template $queryRaw.
    const rows = await prisma.$queryRaw<YearMonthCount[]>`
      SELECT
        EXTRACT(YEAR FROM burial_date)::int AS year,
        EXTRACT(MONTH FROM burial_date)::int AS month,
        COUNT(*)::int AS count
      FROM records
      WHERE is_deleted = false
      GROUP BY year, month
      ORDER BY year, month
    `;

    // Gender breakdown - plain enum grouping, groupBy handles this fine
    const genderRows = await prisma.record.groupBy({
      by: ["gender"],
      where: { isDeleted: false },
      _count: { _all: true },
    });

    const totalRecords = await prisma.record.count({ where: { isDeleted: false } });

    // Age bracket breakdown - fetch just the ageYears column and bucket in
    // JS, same approach as the tally grid. Cheap at this dataset size (a
    // few thousand rows at most) and avoids a SQL CASE-WHEN expression.
    const ageRows = await prisma.record.findMany({
      where: { isDeleted: false },
      select: { ageYears: true },
    });

    const bracketCounts = new Map<string, number>(
      [...AGE_BRACKETS.map((b) => b.label), "Unknown"].map((label) => [label, 0])
    );
    for (const row of ageRows) {
      const label = bucketAge(row.ageYears);
      bracketCounts.set(label, (bracketCounts.get(label) || 0) + 1);
    }
    const byAgeBracket = [...AGE_BRACKETS.map((b) => b.label), "Unknown"].map((label) => ({
      bracket: label,
      count: bracketCounts.get(label) || 0,
    }));

    // Build byYear + tallyGrid from the single year/month result set
    const yearMap = new Map<number, number[]>(); // year -> [count x12]
    for (const row of rows) {
      if (!yearMap.has(row.year)) {
        yearMap.set(row.year, new Array(12).fill(0));
      }
      yearMap.get(row.year)![row.month - 1] = row.count;
    }

    const years = Array.from(yearMap.keys()).sort((a, b) => a - b);

    const byYear = years.map((year) => ({
      year,
      count: yearMap.get(year)!.reduce((sum, c) => sum + c, 0),
    }));

    const tallyGrid = years.map((year) => {
      const months = yearMap.get(year)!;
      return {
        year,
        months: MONTH_NAMES.reduce<Record<string, number>>((acc, name, i) => {
          acc[name] = months[i];
          return acc;
        }, {}),
        total: months.reduce((sum, c) => sum + c, 0),
      };
    });

    const byGender = genderRows.map((g) => ({
      gender: g.gender,
      count: g._count._all,
    }));

    res.json({
      totalRecords,
      yearsCovered: {
        first: years.length > 0 ? years[0] : null,
        last: years.length > 0 ? years[years.length - 1] : null,
      },
      byYear,
      tallyGrid,
      byGender,
      byAgeBracket,
    });
  } catch (error: any) {
    console.error("GET /stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default statsRouter;

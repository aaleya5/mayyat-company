import type { TallyGridRow } from "../hooks/useStats";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface TallyGridProps {
  rows: TallyGridRow[];
}

/**
 * TallyGrid - year x month grid, the digital equivalent of a paper tally
 * sheet. Rows = years, columns = months, each cell = a count, with row and
 * column totals.
 */
export default function TallyGrid({ rows }: TallyGridProps) {
  if (rows.length === 0) {
    return (
      <div className="border border-border bg-surface px-6 py-10 text-center text-sm text-muted">
        No records yet.
      </div>
    );
  }

  // Column (per-month, across all years) and grand totals, computed from
  // the same data the rows already carry - no extra API call needed.
  const monthTotals = MONTHS.reduce<Record<string, number>>((acc, m) => {
    acc[m] = rows.reduce((sum, row) => sum + row.months[m], 0);
    return acc;
  }, {});
  const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);

  const cellClass = "px-3 py-2 text-right text-sm text-ink-text";

  return (
    <div className="overflow-x-auto border border-border bg-surface">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-ink">
            <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-ink">
              Year
            </th>
            {MONTHS.map((m) => (
              <th
                key={m}
                className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wide text-ink"
              >
                {m}
              </th>
            ))}
            <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wide text-accent-dark">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.year} className="border-b border-border last:border-b-0 hover:bg-paper/60">
              <td className="px-3 py-2 text-sm font-semibold text-ink-text">{row.year}</td>
              {MONTHS.map((m) => (
                <td key={m} className={cellClass}>
                  {row.months[m] > 0 ? row.months[m] : "–"}
                </td>
              ))}
              <td className="px-3 py-2 text-right text-sm font-bold text-accent-dark">
                {row.total}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-ink bg-paper">
            <td className="px-3 py-2 text-sm font-bold text-ink">Total</td>
            {MONTHS.map((m) => (
              <td key={m} className="px-3 py-2 text-right text-sm font-bold text-ink">
                {monthTotals[m] > 0 ? monthTotals[m] : "–"}
              </td>
            ))}
            <td className="px-3 py-2 text-right text-sm font-bold text-accent-dark">
              {grandTotal}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

import type { RecordRow } from "../hooks/useRecords";

interface RecordTableProps {
  records: RecordRow[];
  onSort?: (column: string, direction: "asc" | "desc") => void;
  onEdit?: (record: RecordRow) => void;
  onDelete?: (record: RecordRow) => void;
  onView?: (record: RecordRow) => void;
  canEdit?: boolean;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

/**
 * RecordTable - Display records in sortable table
 *
 * Features:
 * - Sortable columns (click header)
 * - Gender badges (color-coded)
 * - Action buttons (View, Edit, Delete)
 * - Responsive design
 */
export default function RecordTable({
  records,
  onSort,
  onEdit,
  onDelete,
  onView,
  canEdit = false,
  sortBy = "burialDate",
  sortDir = "desc",
}: RecordTableProps) {
  const handleHeaderClick = (column: string) => {
    if (!onSort) return;

    // If same column, toggle direction; else change column
    const newDir = sortBy === column && sortDir === "desc" ? "asc" : "desc";
    onSort(column, newDir);
  };

  const getSortIndicator = (column: string) => {
    if (sortBy !== column) return null;
    return (
      <span className="ml-1 text-accent">{sortDir === "asc" ? "▲" : "▼"}</span>
    );
  };

  const headerClass = (column: string) =>
    `cursor-pointer select-none whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide transition-colors hover:bg-border/40 ${
      sortBy === column ? "text-ink" : "text-muted"
    }`;

  const getGenderBadge = (gender: string) => {
    const classes =
      gender === "MALE"
        ? "bg-ink/10 text-ink-light border-ink/20"
        : gender === "FEMALE"
          ? "bg-accent/15 text-accent-dark border-accent/30"
          : "bg-border/60 text-muted border-border";

    return (
      <span
        className={`inline-block border px-2.5 py-0.5 text-xs font-medium ${classes}`}
      >
        {gender}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-paper">
            <th onClick={() => handleHeaderClick("name")} className={headerClass("name")}>
              Name
              {getSortIndicator("name")}
            </th>
            <th onClick={() => handleHeaderClick("ageText")} className={headerClass("ageText")}>
              Age
              {getSortIndicator("ageText")}
            </th>
            <th onClick={() => handleHeaderClick("gender")} className={headerClass("gender")}>
              Gender
              {getSortIndicator("gender")}
            </th>
            <th onClick={() => handleHeaderClick("burialDate")} className={headerClass("burialDate")}>
              Burial Date
              {getSortIndicator("burialDate")}
            </th>
            <th onClick={() => handleHeaderClick("misriDate")} className={headerClass("misriDate")}>
              Misri Date
              {getSortIndicator("misriDate")}
            </th>
            <th onClick={() => handleHeaderClick("relativeName")} className={headerClass("relativeName")}>
              Relative
              {getSortIndicator("relativeName")}
            </th>
            {(onView || canEdit) && (
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr
              key={record.id}
              className="border-b border-border transition-colors last:border-b-0 hover:bg-paper/70"
            >
              <td className="px-4 py-3 font-medium text-ink-text">{record.name}</td>
              <td className="px-4 py-3 text-ink-text">{record.ageText || "–"}</td>
              <td className="px-4 py-3">{getGenderBadge(record.gender)}</td>
              <td className="px-4 py-3 text-ink-text">
                {record.burialDate
                  ? new Date(record.burialDate).toLocaleDateString()
                  : "–"}
              </td>
              <td className="px-4 py-3 text-ink-text">{record.misriDate || "–"}</td>
              <td className="px-4 py-3 text-ink-text">{record.relativeName || "–"}</td>
              {(onView || canEdit) && (
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {onView && (
                      <button
                        onClick={() => onView(record)}
                        title="View details"
                        className="rounded border border-ink/20 px-2.5 py-1 text-xs font-medium text-ink transition-colors hover:bg-ink/10"
                      >
                        View
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(record)}
                        title="Edit record"
                        className="rounded border border-accent/40 px-2.5 py-1 text-xs font-medium text-accent-dark transition-colors hover:bg-accent/15"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(record)}
                        title="Delete record"
                        className="rounded border border-danger/40 px-2.5 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger/10"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

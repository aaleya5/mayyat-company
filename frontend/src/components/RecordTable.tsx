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
    const newDir =
      sortBy === column && sortDir === "desc" ? "asc" : "desc";
    onSort(column, newDir);
  };

  const getSortIndicator = (column: string) => {
    if (sortBy !== column) return " ";
    return sortDir === "asc" ? " ▲" : " ▼";
  };

  const getGenderBadge = (gender: string) => {
    const bgColor =
      gender === "MALE"
        ? "#d1ecf1"
        : gender === "FEMALE"
          ? "#f8d7da"
          : "#e2e3e5";
    const textColor =
      gender === "MALE"
        ? "#0c5460"
        : gender === "FEMALE"
          ? "#721c24"
          : "#383d41";

    return (
      <span
        style={{
          display: "inline-block",
          padding: "4px 8px",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: "500",
          background: bgColor,
          color: textColor,
        }}
      >
        {gender}
      </span>
    );
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "14px",
        }}
      >
        <thead>
          <tr style={{ background: "#f9f9f9", borderBottom: "2px solid #ddd" }}>
            <th
              onClick={() => handleHeaderClick("name")}
              style={{
                padding: "12px",
                textAlign: "left",
                cursor: "pointer",
                fontWeight: "600",
                userSelect: "none",
              }}
            >
              Name
              {getSortIndicator("name")}
            </th>
            <th
              onClick={() => handleHeaderClick("ageText")}
              style={{
                padding: "12px",
                textAlign: "left",
                cursor: "pointer",
                fontWeight: "600",
                userSelect: "none",
              }}
            >
              Age
              {getSortIndicator("ageText")}
            </th>
            <th
              onClick={() => handleHeaderClick("gender")}
              style={{
                padding: "12px",
                textAlign: "left",
                cursor: "pointer",
                fontWeight: "600",
                userSelect: "none",
              }}
            >
              Gender
              {getSortIndicator("gender")}
            </th>
            <th
              onClick={() => handleHeaderClick("burialDate")}
              style={{
                padding: "12px",
                textAlign: "left",
                cursor: "pointer",
                fontWeight: "600",
                userSelect: "none",
              }}
            >
              Burial Date
              {getSortIndicator("burialDate")}
            </th>
            <th
              onClick={() => handleHeaderClick("misriDate")}
              style={{
                padding: "12px",
                textAlign: "left",
                cursor: "pointer",
                fontWeight: "600",
                userSelect: "none",
              }}
            >
              Misri Date
              {getSortIndicator("misriDate")}
            </th>
            <th
              onClick={() => handleHeaderClick("relativeName")}
              style={{
                padding: "12px",
                textAlign: "left",
                cursor: "pointer",
                fontWeight: "600",
                userSelect: "none",
              }}
            >
              Relative
              {getSortIndicator("relativeName")}
            </th>
            {canEdit && (
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  fontWeight: "600",
                }}
              >
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {records.map((record, idx) => (
            <tr
              key={record.id}
              style={{
                borderBottom: "1px solid #eee",
                background: idx % 2 === 0 ? "white" : "#fafafa",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLTableRowElement).style.background =
                  "#f0f0f0";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLTableRowElement).style.background =
                  idx % 2 === 0 ? "white" : "#fafafa";
              }}
            >
              <td style={{ padding: "12px" }}>
                <strong>{record.name}</strong>
              </td>
              <td style={{ padding: "12px" }}>{record.ageText || "–"}</td>
              <td style={{ padding: "12px" }}>
                {getGenderBadge(record.gender)}
              </td>
              <td style={{ padding: "12px" }}>
                {record.burialDate
                  ? new Date(record.burialDate).toLocaleDateString()
                  : "–"}
              </td>
              <td style={{ padding: "12px" }}>{record.misriDate || "–"}</td>
              <td style={{ padding: "12px" }}>
                {record.relativeName || "–"}
              </td>
              {canEdit && (
                <td style={{ padding: "12px" }}>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {onView && (
                      <button
                        onClick={() => onView(record)}
                        title="View details"
                        style={{
                          padding: "4px 8px",
                          fontSize: "12px",
                          background: "#17a2b8",
                          color: "white",
                          border: "none",
                          borderRadius: "3px",
                          cursor: "pointer",
                        }}
                      >
                        View
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(record)}
                        title="Edit record"
                        style={{
                          padding: "4px 8px",
                          fontSize: "12px",
                          background: "#ffc107",
                          color: "#000",
                          border: "none",
                          borderRadius: "3px",
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(record)}
                        title="Delete record"
                        style={{
                          padding: "4px 8px",
                          fontSize: "12px",
                          background: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "3px",
                          cursor: "pointer",
                        }}
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

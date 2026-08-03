import type { RecordRow } from "../hooks/useRecords";

interface RecordDetailProps {
  record: RecordRow;
  onClose: () => void;
}

/**
 * RecordDetail - Read-only view of a single record's full information.
 *
 * Unlike RecordForm (admin-only, editable), this is available to every
 * logged-in user including VIEWER accounts - it's how a non-admin actually
 * sees the fields that don't fit in the table (serial number, burial/death
 * time, etc).
 */
function formatDate(value?: string | null) {
  if (!value) return "–";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function RecordDetail({ record, onClose }: RecordDetailProps) {
  const fields: Array<[string, string]> = [
    ["Serial Number", record.srNo != null ? String(record.srNo) : "–"],
    ["Name", record.name],
    ["Age", record.ageText || "–"],
    ["Gender", record.gender],
    ["Burial Date", formatDate(record.burialDate)],
    ["Burial Day", record.burialDay || "–"],
    ["Burial Time", record.burialTime || "–"],
    ["Death Date", record.deathDate ? formatDate(record.deathDate) : "Same as burial"],
    ["Death Time", record.deathTime || "–"],
    ["Misri Date (Islamic Calendar)", record.misriDate || "–"],
    ["Relative Name", record.relativeName || "–"],
  ];

  return (
    <div className="p-6">
      <h2 className="mb-5 font-display text-xl font-semibold text-ink-text">
        Record Details
      </h2>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">
              {label}
            </dt>
            <dd className="mt-0.5 text-sm text-ink-text">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-6 border-t border-border pt-4 text-xs text-muted">
        Added {formatDate(record.createdAt)}
        {record.updatedAt !== record.createdAt &&
          ` · last updated ${formatDate(record.updatedAt)}`}
      </p>

      <button
        type="button"
        onClick={onClose}
        className="mt-5 w-full border border-border px-4 py-2.5 text-sm font-medium text-ink-text transition-colors hover:bg-paper"
      >
        Close
      </button>
    </div>
  );
}
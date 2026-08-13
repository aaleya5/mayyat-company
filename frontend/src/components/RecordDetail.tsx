import { useState } from "react";
import type { RecordRow } from "../hooks/useRecords";
import { printPamphlet, downloadPamphletPdf } from "../lib/pamphlet";

interface RecordDetailProps {
  record: RecordRow;
  token: string | null;
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

export default function RecordDetail({ record, token, onClose }: RecordDetailProps) {
  const [pamphletError, setPamphletError] = useState("");
  const [pamphletLoading, setPamphletLoading] = useState<string | null>(null);

  const handlePrint = async (lang: "gu" | "en") => {
    if (!token) return;
    setPamphletError("");
    setPamphletLoading(`print-${lang}`);
    try {
      await printPamphlet(record.id, lang, token);
    } catch (err: any) {
      setPamphletError(err.message || "Failed to print pamphlet");
    } finally {
      setPamphletLoading(null);
    }
  };

  const handleDownload = async (lang: "gu" | "en") => {
    if (!token) return;
    setPamphletError("");
    setPamphletLoading(`pdf-${lang}`);
    try {
      await downloadPamphletPdf(record.id, lang, token, record.name);
    } catch (err: any) {
      setPamphletError(err.message || "Failed to download PDF");
    } finally {
      setPamphletLoading(null);
    }
  };

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

      <div className="mt-5 border-t border-border pt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
          Death Notice
        </p>

        {pamphletError && (
          <div className="mb-3 border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            ⚠️ {pamphletError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handlePrint("gu")}
            disabled={pamphletLoading !== null}
            className="border border-ink/30 px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-ink/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pamphletLoading === "print-gu" ? "Opening..." : "Print (Gujarati)"}
          </button>
          <button
            type="button"
            onClick={() => handlePrint("en")}
            disabled={pamphletLoading !== null}
            className="border border-ink/30 px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-ink/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pamphletLoading === "print-en" ? "Opening..." : "Print (English)"}
          </button>
          <button
            type="button"
            onClick={() => handleDownload("gu")}
            disabled={pamphletLoading !== null}
            className="border border-accent/40 px-3 py-2 text-xs font-medium text-accent-dark transition-colors hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pamphletLoading === "pdf-gu" ? "Generating..." : "Download PDF (Gujarati)"}
          </button>
          <button
            type="button"
            onClick={() => handleDownload("en")}
            disabled={pamphletLoading !== null}
            className="border border-accent/40 px-3 py-2 text-xs font-medium text-accent-dark transition-colors hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pamphletLoading === "pdf-en" ? "Generating..." : "Download PDF (English)"}
          </button>
        </div>
      </div>

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

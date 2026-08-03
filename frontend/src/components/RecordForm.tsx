import { useState } from "react";
import type { RecordRow } from "../hooks/useRecords";

export interface CreateRecordInput {
  srNo?: number;
  name: string;
  ageText?: string;
  gender?: "MALE" | "FEMALE" | "UNKNOWN";
  burialDate: string;
  burialDay?: string;
  burialTime?: string;
  deathTime?: string;
  deathDate?: string;
  misriDate?: string;
  relativeName?: string;
}

interface RecordFormProps {
  record?: RecordRow; // undefined = create, defined = edit
  onSubmit: (data: CreateRecordInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * RecordForm - Modal form for creating/editing records
 * 
 * Features:
 * - Create new record (empty form)
 * - Edit existing record (pre-filled)
 * - Client-side validation
 * - Error messages
 * - Loading state (disable on submit)
 */
export default function RecordForm({
  record,
  onSubmit,
  onCancel,
  loading = false,
}: RecordFormProps) {
  const isEditMode = !!record;

  // <input type="date"> requires exactly "YYYY-MM-DD". The API returns full
  // ISO datetimes (e.g. "2026-07-17T00:00:00.000Z"), which the input treats
  // as invalid and renders blank - so trim to the date portion here.
  const toDateInputValue = (value?: string | null) =>
    value ? value.slice(0, 10) : "";

  const [formData, setFormData] = useState<CreateRecordInput>({
    srNo: record?.srNo,
    name: record?.name || "",
    ageText: record?.ageText || "",
    gender: record?.gender || "UNKNOWN",
    burialDate: toDateInputValue(record?.burialDate),
    burialDay: record?.burialDay || "",
    burialTime: record?.burialTime || "",
    deathTime: record?.deathTime || "",
    deathDate: toDateInputValue(record?.deathDate),
    misriDate: record?.misriDate || "",
    relativeName: record?.relativeName || "",
  });

  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? undefined : type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.burialDate) {
      setError("Burial date is required");
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || "Failed to save record");
    }
  };

  const labelClass = "mb-1.5 block text-sm font-medium text-ink-text";
  const inputClass =
    "w-full border border-border bg-surface px-3 py-2 text-sm text-ink-text placeholder:text-muted focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15 disabled:cursor-not-allowed disabled:bg-paper disabled:text-muted";

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <h2 className="mb-5 font-display text-xl font-semibold text-ink-text">
        {isEditMode ? "Edit Record" : "Create New Record"}
      </h2>

      {error && (
        <div className="mb-4 border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          ⚠️ {error}
        </div>
      )}

      {/* Serial Number */}
      <div className="mb-4">
        <label className={labelClass}>Serial Number (Optional)</label>
        <input
          type="number"
          name="srNo"
          value={formData.srNo || ""}
          onChange={handleChange}
          placeholder="e.g. 2850"
          disabled={loading}
          className={inputClass}
        />
      </div>

      {/* Name */}
      <div className="mb-4">
        <label className={labelClass}>Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Full name"
          required
          disabled={loading}
          className={inputClass}
        />
      </div>

      {/* Age and Gender - Side by side */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Age Text</label>
          <input
            type="text"
            name="ageText"
            value={formData.ageText || ""}
            onChange={handleChange}
            placeholder="e.g. 84, approx.60, 1 day"
            disabled={loading}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Gender</label>
          <select
            name="gender"
            value={formData.gender || "UNKNOWN"}
            onChange={handleChange}
            disabled={loading}
            className={inputClass}
          >
            <option value="UNKNOWN">Unknown</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>
      </div>

      {/* Burial Date and Day - Side by side */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Burial Date *</label>
          <input
            type="date"
            name="burialDate"
            value={formData.burialDate}
            onChange={handleChange}
            required
            disabled={loading}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Burial Day</label>
          <input
            type="text"
            name="burialDay"
            value={formData.burialDay || ""}
            onChange={handleChange}
            placeholder="e.g. Friday"
            disabled={loading}
            className={inputClass}
          />
        </div>
      </div>

      {/* Burial Time and Death Time */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Burial Time</label>
          <input
            type="text"
            name="burialTime"
            value={formData.burialTime || ""}
            onChange={handleChange}
            placeholder="e.g. 9:00 AM"
            disabled={loading}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Death Time</label>
          <input
            type="text"
            name="deathTime"
            value={formData.deathTime || ""}
            onChange={handleChange}
            placeholder="e.g. 4:00 PM"
            disabled={loading}
            className={inputClass}
          />
        </div>
      </div>

      {/* Death Date and Misri Date */}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Death Date (if different from burial)</label>
          <input
            type="date"
            name="deathDate"
            value={formData.deathDate || ""}
            onChange={handleChange}
            disabled={loading}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Misri Date (Islamic Calendar)</label>
          <input
            type="text"
            name="misriDate"
            value={formData.misriDate || ""}
            onChange={handleChange}
            placeholder="e.g. 4 Jamadil Aakhar 1443"
            disabled={loading}
            className={inputClass}
          />
        </div>
      </div>

      {/* Relative Name */}
      <div className="mb-6">
        <label className={labelClass}>Relative Name</label>
        <input
          type="text"
          name="relativeName"
          value={formData.relativeName || ""}
          onChange={handleChange}
          placeholder="e.g. Ibrahim's father"
          disabled={loading}
          className={inputClass}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-ink-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : isEditMode ? "Update Record" : "Create Record"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 border border-border px-4 py-2.5 text-sm font-medium text-ink-text transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

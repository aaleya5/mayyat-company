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

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "8px",
        maxWidth: "600px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: "20px" }}>
        {isEditMode ? "Edit Record" : "Create New Record"}
      </h2>

      {error && (
        <div
          style={{
            background: "#f8d7da",
            color: "#721c24",
            padding: "12px",
            borderRadius: "4px",
            marginBottom: "16px",
            border: "1px solid #f5c6cb",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Serial Number */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
          Serial Number (Optional)
        </label>
        <input
          type="number"
          name="srNo"
          value={formData.srNo || ""}
          onChange={handleChange}
          placeholder="e.g. 2850"
          disabled={loading}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Name */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
          Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Full name"
          required
          disabled={loading}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Age and Gender - Side by side */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <div>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
            Age Text
          </label>
          <input
            type="text"
            name="ageText"
            value={formData.ageText || ""}
            onChange={handleChange}
            placeholder="e.g. 84, approx.60, 1 day"
            disabled={loading}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
            Gender
          </label>
          <select
            name="gender"
            value={formData.gender || "UNKNOWN"}
            onChange={handleChange}
            disabled={loading}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          >
            <option value="UNKNOWN">Unknown</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>
      </div>

      {/* Burial Date and Day - Side by side */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <div>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
            Burial Date *
          </label>
          <input
            type="date"
            name="burialDate"
            value={formData.burialDate}
            onChange={handleChange}
            required
            disabled={loading}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
            Burial Day
          </label>
          <input
            type="text"
            name="burialDay"
            value={formData.burialDay || ""}
            onChange={handleChange}
            placeholder="e.g. Friday"
            disabled={loading}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Burial Time and Death Time */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <div>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
            Burial Time
          </label>
          <input
            type="text"
            name="burialTime"
            value={formData.burialTime || ""}
            onChange={handleChange}
            placeholder="e.g. 9:00 AM"
            disabled={loading}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
            Death Time
          </label>
          <input
            type="text"
            name="deathTime"
            value={formData.deathTime || ""}
            onChange={handleChange}
            placeholder="e.g. 4:00 PM"
            disabled={loading}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Death Date and Misri Date */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <div>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
            Death Date (if different from burial)
          </label>
          <input
            type="date"
            name="deathDate"
            value={formData.deathDate || ""}
            onChange={handleChange}
            disabled={loading}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
            Misri Date (Islamic Calendar)
          </label>
          <input
            type="text"
            name="misriDate"
            value={formData.misriDate || ""}
            onChange={handleChange}
            placeholder="e.g. 4 Jamadil Aakhar 1443"
            disabled={loading}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* Relative Name */}
      <div style={{ marginBottom: "24px" }}>
        <label style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}>
          Relative Name
        </label>
        <input
          type="text"
          name="relativeName"
          value={formData.relativeName || ""}
          onChange={handleChange}
          placeholder="e.g. Ibrahim's father"
          disabled={loading}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            flex: 1,
            padding: "10px",
            background: "#007BFF",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "14px",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading
            ? "Saving..."
            : isEditMode
              ? "Update Record"
              : "Create Record"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          style={{
            flex: 1,
            padding: "10px",
            background: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "14px",
            opacity: loading ? 0.6 : 1,
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
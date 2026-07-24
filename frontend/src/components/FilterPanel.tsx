import { useState } from "react";
import type { RecordFilters } from "../hooks/useRecords";

interface FilterPanelProps {
  onFilterChange: (filters: Partial<RecordFilters>) => void;
  disabled?: boolean;
}

/**
 * FilterPanel - Collapsible filter sidebar
 * 
 * Features:
 * - Expandable/collapsible
 * - Year filter (input)
 * - Month filter (dropdown)
 * - Gender filter (dropdown)
 * - Age range filter (min/max)
 * - Reset button
 * - Real-time filter application
 */
export default function FilterPanel({
  onFilterChange,
  disabled = false,
}: FilterPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [gender, setGender] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setYear(val);
    onFilterChange({ year: val ? parseInt(val) : undefined });
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setMonth(val);
    onFilterChange({ month: val ? parseInt(val) : undefined });
  };

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setGender(val);
    onFilterChange({
      gender: val ? (val as "MALE" | "FEMALE" | "UNKNOWN") : undefined,
    });
  };

  const handleAgeMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAgeMin(val);
    onFilterChange({ ageMin: val ? parseInt(val) : undefined });
  };

  const handleAgeMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAgeMax(val);
    onFilterChange({ ageMax: val ? parseInt(val) : undefined });
  };

  const handleReset = () => {
    setYear("");
    setMonth("");
    setGender("");
    setAgeMin("");
    setAgeMax("");
    onFilterChange({
      year: undefined,
      month: undefined,
      gender: undefined,
      ageMin: undefined,
      ageMax: undefined,
    });
  };

  const activeFilterCount = [year, month, gender, ageMin, ageMax].filter(
    (v) => v !== ""
  ).length;

  return (
    <div
      style={{
        marginBottom: "20px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "12px",
          background: "#f9f9f9",
          border: "none",
          borderRadius: "0px",
          cursor: "pointer",
          fontWeight: "500",
          textAlign: "left",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "14px",
        }}
      >
        <span>
          {expanded ? "▼" : "▶"} Filters
          {activeFilterCount > 0 && (
            <span style={{ marginLeft: "8px", color: "#007BFF" }}>
              ({activeFilterCount} active)
            </span>
          )}
        </span>
      </button>

      {expanded && (
        <div
          style={{
            padding: "16px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            borderTop: "1px solid #eee",
          }}
        >
          {/* Year */}
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: 500 }}>
              Year (Burial)
            </label>
            <input
              type="number"
              min="2000"
              max="2100"
              placeholder="e.g. 2024"
              value={year}
              onChange={handleYearChange}
              disabled={disabled}
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

          {/* Month */}
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: 500 }}>
              Month (Burial)
            </label>
            <select
              value={month}
              onChange={handleMonthChange}
              disabled={disabled}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            >
              <option value="">All months</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {new Date(2024, m - 1).toLocaleString("default", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: 500 }}>
              Gender
            </label>
            <select
              value={gender}
              onChange={handleGenderChange}
              disabled={disabled}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            >
              <option value="">All genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
          </div>

          {/* Spacer */}
          <div></div>

          {/* Age Min */}
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: 500 }}>
              Age Min
            </label>
            <input
              type="number"
              min="0"
              max="150"
              placeholder="e.g. 18"
              value={ageMin}
              onChange={handleAgeMinChange}
              disabled={disabled}
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

          {/* Age Max */}
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "12px", fontWeight: 500 }}>
              Age Max
            </label>
            <input
              type="number"
              min="0"
              max="150"
              placeholder="e.g. 80"
              value={ageMax}
              onChange={handleAgeMaxChange}
              disabled={disabled}
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

          {/* Reset Button */}
          <div style={{ gridColumn: "1 / -1" }}>
            <button
              onClick={handleReset}
              disabled={disabled}
              style={{
                width: "100%",
                padding: "10px",
                background: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

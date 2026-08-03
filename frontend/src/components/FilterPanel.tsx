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

  const inputClass =
    "w-full border border-border bg-surface px-3 py-2 text-sm text-ink-text placeholder:text-muted focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15 disabled:cursor-not-allowed disabled:bg-paper disabled:text-muted";
  const labelClass = "mb-1 block text-xs font-medium text-muted";

  return (
    <div className="mb-5 overflow-hidden border border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        disabled={disabled}
        className="flex w-full items-center justify-between bg-paper px-4 py-3 text-left text-sm font-medium text-ink-text transition-colors hover:bg-border/40 disabled:cursor-not-allowed"
      >
        <span className="flex items-center gap-1.5">
          <span className="text-xs text-muted">{expanded ? "▼" : "▶"}</span>
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent-dark">
              {activeFilterCount} active
            </span>
          )}
        </span>
      </button>

      {expanded && (
        <div className="grid grid-cols-2 gap-4 border-t border-border bg-surface p-4">
          {/* Year */}
          <div>
            <label className={labelClass}>Year (Burial)</label>
            <input
              type="number"
              min="2000"
              max="2100"
              placeholder="e.g. 2024"
              value={year}
              onChange={handleYearChange}
              disabled={disabled}
              className={inputClass}
            />
          </div>

          {/* Month */}
          <div>
            <label className={labelClass}>Month (Burial)</label>
            <select
              value={month}
              onChange={handleMonthChange}
              disabled={disabled}
              className={inputClass}
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
            <label className={labelClass}>Gender</label>
            <select
              value={gender}
              onChange={handleGenderChange}
              disabled={disabled}
              className={inputClass}
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
            <label className={labelClass}>Age Min</label>
            <input
              type="number"
              min="0"
              max="150"
              placeholder="e.g. 18"
              value={ageMin}
              onChange={handleAgeMinChange}
              disabled={disabled}
              className={inputClass}
            />
          </div>

          {/* Age Max */}
          <div>
            <label className={labelClass}>Age Max</label>
            <input
              type="number"
              min="0"
              max="150"
              placeholder="e.g. 80"
              value={ageMax}
              onChange={handleAgeMaxChange}
              disabled={disabled}
              className={inputClass}
            />
          </div>

          {/* Reset Button */}
          <div className="col-span-2">
            <button
              onClick={handleReset}
              disabled={disabled}
              className="w-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-ink-light disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

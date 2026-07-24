import { useState, useEffect } from "react";
import { useDebounce } from "../hooks/useDebounce";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * SearchBar - Debounced search input component
 * 
 * Features:
 * - Immediate visual feedback (user sees text)
 * - Debounced API call (after 300ms of no typing)
 * - Clear button (X icon)
 * - Accessibility (proper labels)
 * 
 * Example:
 * User types "m" → immediately shown in input
 * Wait 300ms with no new input → API call to search for "m"
 * User types "mehfuza" (total) → only ONE API call (for "mehfuza")
 */
export default function SearchBar({
  onSearch,
  placeholder = "Search by name, relative, or Misri date...",
  disabled = false,
}: SearchBarProps) {
  const [input, setInput] = useState("");
  const debouncedInput = useDebounce(input, 300);

  // When debounced input changes, call parent callback
  useEffect(() => {
    onSearch(debouncedInput);
  }, [debouncedInput, onSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleClear = () => {
    setInput("");
    onSearch("");
  };

  return (
    <div style={{ position: "relative", marginBottom: "16px" }}>
      <label htmlFor="search-input" style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: 500 }}>
        Search Records
      </label>
      <div style={{ position: "relative" }}>
        <input
          id="search-input"
          type="text"
          placeholder={placeholder}
          value={input}
          onChange={handleChange}
          disabled={disabled}
          style={{
            width: "100%",
            padding: "10px 36px 10px 12px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
            fontFamily: "inherit",
            boxSizing: "border-box",
            transition: "border-color 0.2s",
          }}
        />
        {input && (
          <button
            onClick={handleClear}
            disabled={disabled}
            title="Clear search"
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              padding: "4px",
              color: "#666",
            }}
          >
            ✕
          </button>
        )}
      </div>
      {debouncedInput && input !== debouncedInput && (
        <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
          Searching...
        </div>
      )}
    </div>
  );
}

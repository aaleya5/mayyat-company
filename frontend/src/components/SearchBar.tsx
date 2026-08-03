import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "../hooks/useDebounce";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * SearchBar - Debounced search input component
 * 
 * FIXED: useEffect now has proper dependency array [debouncedInput, onSearch]
 * PREVENTS: Infinite loop by memoizing onSearch callback
 */
export default function SearchBar({
  onSearch,
  placeholder = "Search by name, relative, or Misri date...",
  disabled = false,
}: SearchBarProps) {
  const [input, setInput] = useState("");
  const debouncedInput = useDebounce(input, 300);

  // Wrap onSearch in useCallback to prevent unnecessary re-renders
  const memoizedOnSearch = useCallback(onSearch, [onSearch]);

  // When debounced input changes, call parent callback
  useEffect(() => {
    memoizedOnSearch(debouncedInput);
  }, [debouncedInput, memoizedOnSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleClear = () => {
    setInput("");
    memoizedOnSearch("");
  };

  return (
    <div className="relative mb-4">
      <label
        htmlFor="search-input"
        className="mb-1.5 block text-sm font-medium text-ink-text"
      >
        Search Records
      </label>
      <div className="relative">
        <input
          id="search-input"
          type="text"
          placeholder={placeholder}
          value={input}
          onChange={handleChange}
          disabled={disabled}
          className="w-full border border-border bg-surface px-3 py-2.5 pr-10 text-sm text-ink-text placeholder:text-muted focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15 disabled:cursor-not-allowed disabled:bg-paper disabled:text-muted"
        />
        {input && (
          <button
            onClick={handleClear}
            disabled={disabled}
            title="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-base text-muted transition-colors hover:text-ink-text disabled:cursor-not-allowed"
          >
            ✕
          </button>
        )}
      </div>
      {debouncedInput && input !== debouncedInput && (
        <div className="mt-1 text-xs text-muted">Searching...</div>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";

/**
 * useDebounce - Debounce a value after a delay
 * 
 * Used for search input to avoid API spam
 * Example: user types 10 chars = 10 calls without debounce
 *          user types 10 chars with debounce = 1 call (after 300ms)
 * 
 * @param value - The value to debounce
 * @param delayMs - Delay in milliseconds (default: 300)
 * @returns - The debounced value
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    // Set a timer to update debounced value after delay
    const handler = setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    // Clean up timer if value changes before delay completes
    return () => clearTimeout(handler);
  }, [value, delayMs]);

  return debounced;
}

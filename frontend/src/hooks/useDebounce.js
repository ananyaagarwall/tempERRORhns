import { useState, useEffect } from 'react';

/**
 * useDebounce — delays updating the returned value until `delay` ms
 * have passed since the last change of `value`.
 *
 * Usage:
 *   const debouncedFilters = useDebounce(searchFilters, 400);
 *   // Pass debouncedFilters to useQuery instead of searchFilters
 *
 * @template T
 * @param {T} value   - The value to debounce.
 * @param {number} delay - Milliseconds to wait (default 400).
 * @returns {T}
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

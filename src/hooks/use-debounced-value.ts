import { useEffect, useState } from 'react';

// Trails `value` by `delay` ms of quiet. Used to keep fast-changing input (a
// search box) from driving a fetcher's identity, which would reset and refetch
// a paginated list on every keystroke.
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

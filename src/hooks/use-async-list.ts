import { useCallback, useEffect, useRef, useState } from 'react';

type Options<T> = {
  // Called after a successful fetch — e.g. write-through to a cache.
  onSuccess?: (items: T[]) => void;
  // Called when the fetch throws; returning items renders them as `stale` data,
  // returning null surfaces the error. e.g. fall back to a cache.
  recover?: () => Promise<T[] | null>;
};

// Shared async-list state machine: loading / refreshing / error / stale plus
// stable reload/refresh handlers. The fetcher and options are held in refs so
// the returned handlers keep the same identity across renders — callers can pass
// inline functions/objects without risking a re-render loop (see useFocusEffect).
export function useAsyncList<T>(fetcher: () => Promise<T[]>, options?: Options<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  const fetcherRef = useRef(fetcher);
  const optionsRef = useRef(options);
  useEffect(() => {
    fetcherRef.current = fetcher;
    optionsRef.current = options;
  });

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      setStale(false);
      const data = await fetcherRef.current();
      setItems(data);
      optionsRef.current?.onSuccess?.(data);
    } catch (e) {
      const recovered = (await optionsRef.current?.recover?.()) ?? null;
      if (recovered) {
        setItems(recovered);
        setStale(true);
      } else {
        setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const reload = useCallback(() => load(false), [load]);
  const refresh = useCallback(() => load(true), [load]);

  return { items, setItems, loading, refreshing, error, stale, reload, refresh };
}

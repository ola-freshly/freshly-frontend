import { Paginated } from '@/api';
import { useCallback, useEffect, useRef, useState } from 'react';

export function usePaginatedList<T extends { id: string }>(
  fetcher: (cursor: string | null) => Promise<Paginated<T>>,
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  // Guards against overlapping fetches. State updates are async, so checking
  // `loadingMore` alone would let a fast second onEndReached slip through.
  const inFlight = useRef(false);

  const message = (e: unknown) =>
    e instanceof Error ? e.message : 'Something went wrong. Please try again.';

  const loadFirst = useCallback(async (isRefresh: boolean, reset = false) => {
    if (inFlight.current) return;
    inFlight.current = true;

    try {
      // Clearing here rather than in the effect keeps the reset paired with the
      // refetch: if this bails on an in-flight load, we don't strand an emptied
      // list with no request behind it.
      if (reset) {
        setItems([]);
        setCursor(null);
        setHasMore(true);
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const pageData = await fetcherRef.current(null);

      setItems(pageData.items);
      setCursor(pageData.nextCursor);
      setHasMore(pageData.hasMore);
    } catch (e) {
      setError(message(e));
    } finally {
      inFlight.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // `error` blocks automatic paging so a failed page isn't retried on every
  // onEndReached, but an explicit retry has to be able to get past it — hence
  // ignoreError rather than dropping the guard.
  const loadPage = useCallback(
    async (ignoreError: boolean) => {
      if (inFlight.current || !hasMore || (error && !ignoreError)) return;
      inFlight.current = true;

      try {
        setLoadingMore(true);
        setError(null);

        const pageData = await fetcherRef.current(cursor);

        //set prev items to a set
        setItems((prev) => {
          const seen = new Set(prev.map((i) => i.id));
          //merge 2 list
          return [...prev, ...pageData.items.filter((i) => !seen.has(i.id))];
        });
        setCursor(pageData.nextCursor);
        setHasMore(pageData.hasMore);
      } catch (e) {
        setError(message(e));
      } finally {
        inFlight.current = false;
        setLoadingMore(false);
      }
    },
    [cursor, hasMore, error],
  );

  // Zero-arg so it's safe to hand straight to FlatList's onEndReached, which
  // calls its handler with a {distanceFromEnd} object.
  const loadMore = useCallback(() => loadPage(false), [loadPage]);
  const retry = useCallback(() => loadPage(true), [loadPage]);

  //merge newest to old list(keep old list as it so no need to fetch again)
  const revalidate = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;

    try {
      setError(null);
      const pageData = await fetcherRef.current(null);

      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id));
        return [...pageData.items.filter((i) => !seen.has(i.id)), ...prev];
      });
    } catch (e) {
      setError(message(e));
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
  }, []);

  const refresh = useCallback(() => loadFirst(true), [loadFirst]);
  const reload = useCallback(() => loadFirst(false), [loadFirst]);

  // Depending on `fetcher` is what makes a filter change reset paging: callers
  // rebuild the fetcher when their filter changes (see useCategoryRecipes), and
  // this clears the accumulated pages before refetching from no cursor.
  // Without the reset, a new filter's results would append onto the old ones.
  useEffect(() => {
    // set-state-in-effect fires because loadFirst flips loading/reset state
    // synchronously before awaiting. That is inherent to fetch-on-mount: the
    // list has to show a skeleton from the first render of a new filter. The
    // cascading-render the rule guards against doesn't apply — this runs once
    // per fetcher identity, not on every render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFirst(false, true);
  }, [loadFirst, fetcher]);

  return {
    items,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    loadMore,
    retry,
    refresh,
    reload,
    revalidate,
    reset,
  };
}

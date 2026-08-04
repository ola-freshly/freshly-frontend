import { act, renderHook, waitFor } from '@testing-library/react-native';

import { usePaginatedList } from '../use-paginated-list';

type Row = { id: string };

const page = (ids: string[], nextCursor: string | null) => ({
  items: ids.map((id) => ({ id })),
  nextCursor,
  hasMore: nextCursor !== null,
});

const ids = (rows: Row[]) => rows.map((r) => r.id);

describe('usePaginatedList', () => {
  it('loads the first page with a null cursor', async () => {
    const fetcher = jest.fn().mockResolvedValue(page(['a', 'b'], 'c1'));

    const { result } = await renderHook(() => usePaginatedList<Row>(fetcher));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetcher).toHaveBeenCalledWith(null);
    expect(ids(result.current.items)).toEqual(['a', 'b']);
    expect(result.current.hasMore).toBe(true);
  });

  it('appends the next page instead of replacing', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(page(['a', 'b'], 'c1'))
      .mockResolvedValueOnce(page(['c', 'd'], null));

    const { result } = await renderHook(() => usePaginatedList<Row>(fetcher));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(fetcher).toHaveBeenLastCalledWith('c1');
    expect(ids(result.current.items)).toEqual(['a', 'b', 'c', 'd']);
    expect(result.current.hasMore).toBe(false);
  });

  it('drops rows whose id is already loaded', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(page(['a', 'b'], 'c1'))
      .mockResolvedValueOnce(page(['b', 'c'], null));

    const { result } = await renderHook(() => usePaginatedList<Row>(fetcher));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(ids(result.current.items)).toEqual(['a', 'b', 'c']);
  });

  it('does not fetch again once hasMore is false', async () => {
    const fetcher = jest.fn().mockResolvedValue(page(['a'], null));

    const { result } = await renderHook(() => usePaginatedList<Row>(fetcher));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('keeps loaded items when a page fails', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(page(['a', 'b'], 'c1'))
      .mockRejectedValueOnce(new Error('offline'));

    const { result } = await renderHook(() => usePaginatedList<Row>(fetcher));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(ids(result.current.items)).toEqual(['a', 'b']);
    expect(result.current.error).toBe('offline');
    expect(result.current.loadingMore).toBe(false);
  });

  it('stops automatic paging after a failure', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(page(['a'], 'c1'))
      .mockRejectedValueOnce(new Error('offline'));

    const { result } = await renderHook(() => usePaginatedList<Row>(fetcher));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loadMore();
    });

    // A further onEndReached must not hammer the failing endpoint.
    await act(async () => {
      await result.current.loadMore();
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('retry gets past the error guard and resumes paging', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(page(['a'], 'c1'))
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(page(['b'], null));

    const { result } = await renderHook(() => usePaginatedList<Row>(fetcher));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.error).toBe('offline');

    await act(async () => {
      await result.current.retry();
    });

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(ids(result.current.items)).toEqual(['a', 'b']);
    expect(result.current.error).toBeNull();
  });

  it('replaces items on refresh', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(page(['a', 'b'], 'c1'))
      .mockResolvedValueOnce(page(['z'], null));

    const { result } = await renderHook(() => usePaginatedList<Row>(fetcher));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refresh();
    });

    expect(fetcher).toHaveBeenLastCalledWith(null);
    expect(ids(result.current.items)).toEqual(['z']);
  });

  it('revalidate merges a fresh first page without dropping later pages', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(page(['b', 'c'], 'c1'))
      .mockResolvedValueOnce(page(['d', 'e'], null))
      .mockResolvedValueOnce(page(['a', 'b'], 'c1'));

    const { result } = await renderHook(() => usePaginatedList<Row>(fetcher));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loadMore();
    });

    await act(async () => {
      await result.current.revalidate();
    });

    // 'a' is new and sorts to the head; 'd' and 'e' from page 2 survive.
    expect(ids(result.current.items)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('resets and refetches when the fetcher identity changes', async () => {
    const first = jest.fn().mockResolvedValue(page(['a'], 'c1'));
    const second = jest.fn().mockResolvedValue(page(['z'], null));

    const { result, rerender } = await renderHook(
      ({ fetcher }: { fetcher: jest.Mock }) => usePaginatedList<Row>(fetcher),
      { initialProps: { fetcher: first } },
    );
    await waitFor(() => expect(ids(result.current.items)).toEqual(['a']));

    await rerender({ fetcher: second });

    await waitFor(() => expect(ids(result.current.items)).toEqual(['z']));
    expect(second).toHaveBeenCalledWith(null);
  });
});

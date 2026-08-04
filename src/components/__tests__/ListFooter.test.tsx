import { fireEvent, render } from '@testing-library/react-native';

import { ListFooter } from '../ListFooter';

const base = {
  loadingMore: false,
  hasMore: true,
  error: null,
  itemCount: 5,
  onRetry: jest.fn(),
};

describe('ListFooter', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows a spinner while a page is loading', async () => {
    const { getByTestId } = await render(<ListFooter {...base} loadingMore />);

    expect(getByTestId('list-footer-loading')).toBeTruthy();
  });

  it('shows nothing while more pages remain and nothing is in flight', async () => {
    const { toJSON } = await render(<ListFooter {...base} />);

    expect(toJSON()).toBeNull();
  });

  it('shows the end marker once the list is exhausted', async () => {
    const { getByTestId } = await render(<ListFooter {...base} hasMore={false} />);

    expect(getByTestId('list-footer-end')).toBeTruthy();
  });

  it('shows a retry affordance when a page failed', async () => {
    const { getByTestId } = await render(<ListFooter {...base} error="offline" />);

    fireEvent.press(getByTestId('list-footer-retry'));

    expect(base.onRetry).toHaveBeenCalledTimes(1);
  });

  it('prefers the spinner over the retry state while retrying', async () => {
    const { getByTestId, queryByTestId } = await render(
      <ListFooter {...base} error="offline" loadingMore />,
    );

    expect(getByTestId('list-footer-loading')).toBeTruthy();
    expect(queryByTestId('list-footer-retry')).toBeNull();
  });

  it('renders nothing on an empty list, whatever the state', async () => {
    const { toJSON: endJson } = await render(
      <ListFooter {...base} itemCount={0} hasMore={false} />,
    );
    expect(endJson()).toBeNull();

    const { toJSON: errorJson } = await render(
      <ListFooter {...base} itemCount={0} error="offline" />,
    );
    expect(errorJson()).toBeNull();
  });
});

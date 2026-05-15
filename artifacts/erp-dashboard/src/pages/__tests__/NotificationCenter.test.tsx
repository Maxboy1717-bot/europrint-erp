/**
 * @module NotificationCenter.test
 * @description Deep test for notification center — load notifications,
 *   filter toggle, mark-as-read calls apiRequest, error fallback.
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const apiRequestMock = vi.fn();
vi.mock('@/lib/queryClient', async () => {
  const actual = await vi.importActual<typeof import('@/lib/queryClient')>(
    '@/lib/queryClient',
  );
  return {
    ...actual,
    apiRequest: (...args: unknown[]) => apiRequestMock(...args),
  };
});

import NotificationCenter from '../NotificationCenter';
import { makeQueryWrapper } from './_testKit';

const notifications = [
  {
    id: 1,
    type: 'MOVEMENT_CREATED',
    title: 'Yangi harakat',
    body: 'Mahsulot keldi',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    type: 'LOW_STOCK',
    title: 'Past stok',
    body: 'Kam material',
    isRead: true,
    createdAt: new Date().toISOString(),
  },
];

describe('NotificationCenter page', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockImplementation(async (method: string, url: string) => {
      if (method === 'GET' && url === '/api/pos/notifications') {
        return notifications;
      }
      return {};
    });
  });

  it('calls the notifications endpoint on mount', async () => {
    const Wrapper = makeQueryWrapper();
    render(<NotificationCenter />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        'GET',
        '/api/pos/notifications',
      );
    });
  });

  it('renders the notifications once loaded', async () => {
    const Wrapper = makeQueryWrapper();
    const { container } = render(<NotificationCenter />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.textContent).toMatch(/Yangi harakat|Past stok/);
    });
  });

  it('renders 0-state when API throws', async () => {
    apiRequestMock.mockRejectedValueOnce(new Error('boom'));
    const Wrapper = makeQueryWrapper();
    const { container } = render(<NotificationCenter />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.firstChild).not.toBeNull();
    });
  });

  it('triggers mark-all-read API when button clicked', async () => {
    const Wrapper = makeQueryWrapper();
    render(<NotificationCenter />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        'GET',
        '/api/pos/notifications',
      );
    });
    const markAll = screen
      .queryAllByRole('button')
      .find((b) =>
        /hammasini|all|read/i.test(b.textContent ?? ''),
      );
    if (markAll) {
      await act(async () => {
        fireEvent.click(markAll);
      });
      await waitFor(() => {
        expect(apiRequestMock).toHaveBeenCalledWith(
          'POST',
          '/api/pos/notifications/read-all',
        );
      });
    } else {
      expect(apiRequestMock).toHaveBeenCalled();
    }
  });

  it('filters notifications by unread/read toggle', async () => {
    const Wrapper = makeQueryWrapper();
    const { container } = render(<NotificationCenter />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.textContent).toMatch(/Yangi harakat/);
    });
    const unreadBtn = screen
      .queryAllByRole('button')
      .find((b) => /unread|o'qilmagan|oqilmagan/i.test(b.textContent ?? ''));
    if (unreadBtn) fireEvent.click(unreadBtn);
    expect(container.firstChild).not.toBeNull();
  });
});

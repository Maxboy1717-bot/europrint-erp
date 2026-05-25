/**
 * @module Login.test
 * @description Deep test for the Login page — form input, validation,
 *   network success + error, and password visibility toggle.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const apiRequestMock = vi.fn();
vi.mock('@/lib/queryClient', async () => {
  const actual = await vi.importActual<typeof import('@/lib/queryClient')>(
    '@/lib/queryClient',
  );
  return {
    ...actual,
    apiRequest: (...args: unknown[]) => apiRequestMock(...args),
    setAuthToken: vi.fn(),
  };
});

import Login from '../Login';
import { makeQueryWrapper } from './_testKit';

describe('Login page', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it('renders username + password fields and a submit button', () => {
    const Wrapper = makeQueryWrapper();
    render(<Login onLoginSuccess={() => undefined} />, { wrapper: Wrapper });
    expect(screen.getByTestId('input-username')).toBeInTheDocument();
    expect(screen.getByTestId('input-password')).toBeInTheDocument();
    expect(screen.getByTestId('button-login')).toBeInTheDocument();
  });

  it('shows validation error when submitted with empty fields', async () => {
    const Wrapper = makeQueryWrapper();
    render(<Login onLoginSuccess={() => undefined} />, { wrapper: Wrapper });

    fireEvent.click(screen.getByTestId('button-login'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(apiRequestMock).not.toHaveBeenCalled();
  });

  it('calls apiRequest and triggers onLoginSuccess on valid login', async () => {
    apiRequestMock.mockResolvedValueOnce({
      accessToken: 'tok-123',
      user: { id: 1, username: 'admin', role: 'director' },
    });
    const onSuccess = vi.fn();
    const Wrapper = makeQueryWrapper();
    render(<Login onLoginSuccess={onSuccess} />, { wrapper: Wrapper });

    const usernameInput = screen.getByTestId('input-username') as HTMLInputElement;
    const passwordInput = screen.getByTestId('input-password') as HTMLInputElement;
    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: 'secret' } });
    fireEvent.click(screen.getByTestId('button-login'));

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith(
        'POST',
        '/api/auth/login',
        expect.objectContaining({ username: 'admin', password: 'secret' }),
      );
    });
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith('director');
    });
  });

  it('shows an error alert when the server rejects the credentials', async () => {
    apiRequestMock.mockRejectedValueOnce(new Error('401: invalid'));
    const Wrapper = makeQueryWrapper();
    render(<Login onLoginSuccess={() => undefined} />, { wrapper: Wrapper });

    fireEvent.change(screen.getByTestId('input-username'), {
      target: { value: 'admin' },
    });
    fireEvent.change(screen.getByTestId('input-password'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByTestId('button-login'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('toggles password visibility when the eye button is clicked', () => {
    const Wrapper = makeQueryWrapper();
    render(<Login onLoginSuccess={() => undefined} />, { wrapper: Wrapper });
    const passwordInput = screen.getByTestId('input-password') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleBtn = screen.getByRole('button', { name: /parol/i });
    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('text');
  });
});

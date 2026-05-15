/**
 * @module ImportEmployeesDialog.test
 * @description Component tests for ImportEmployeesDialog — open state, file
 * input, template download, upload disabled without file, cancel callback.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestProviders } from '@/test/TestProviders';


const { apiRequestMock, toastSpy } = vi.hoisted(() => ({
    apiRequestMock: vi.fn(async () => ({ ok: true, json: async () => ({}) })),
    toastSpy: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastSpy }),
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/lib/queryClient', () => ({
  apiRequest: apiRequestMock,
  queryClient: { invalidateQueries: vi.fn() },
  getAuthHeaders: () => ({}),
}));

import { ImportEmployeesDialog } from '../ImportEmployeesDialog';

describe('ImportEmployeesDialog', () => {
  beforeEach(() => {
    apiRequestMock.mockClear();
    toastSpy.mockReset();
  });

  it('renders dialog title when open is true', () => {
    render(
      <ImportEmployeesDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText(/xodimlarniImportQilish/i)).toBeTruthy();
  });

  it('renders file input when dialog open', () => {
    render(
      <ImportEmployeesDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('input-import-file')).toBeTruthy();
  });

  it('renders download template button when dialog open', () => {
    render(
      <ImportEmployeesDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('button-download-template')).toBeTruthy();
  });

  it('disables upload button when no file is selected', () => {
    render(
      <ImportEmployeesDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    const upload = screen.getByTestId('button-upload-import') as HTMLButtonElement;
    expect(upload.disabled).toBe(true);
  });

  it('shows toast for invalid file format when wrong extension selected', () => {
    render(
      <ImportEmployeesDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    const fileInput = screen.getByTestId('input-import-file') as HTMLInputElement;
    const badFile = new File(['x'], 'data.txt', { type: 'text/plain' });
    Object.defineProperty(fileInput, 'files', { value: [badFile], writable: false });
    fireEvent.change(fileInput);
    expect(toastSpy).toHaveBeenCalled();
  });

  it('calls onOpenChange when cancel button is clicked', () => {
    const onOpenChange = vi.fn();
    render(
      <ImportEmployeesDialog open={true} onOpenChange={onOpenChange} />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByTestId('button-cancel-import'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

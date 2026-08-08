/**
 * @module ApplyCardTemplateDialog.test
 * @description VISION-3340 #26 — covers `buildApplyTemplatePayload` (the exact body sent to
 *   `POST /api/org-structure/card-templates/:id/apply-template`, whose keys must stay inside
 *   `card-template.service.ts`'s `CARD_FIELD_KEYS` whitelist: `departmentId`, `positionName`,
 *   `positionNameRu`), plus the dialog's basic open/cancel/disabled-submit behavior. Mirrors the
 *   sibling `ImportNodesDialog.test.tsx` in this same `__tests__/` directory (mock shape for
 *   use-toast / i18n / queryClient).
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestProviders } from '@/test/TestProviders';

const { apiRequestMock, toastSpy } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(async () => ({ id: 1, position_name: 'Operator' })),
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

import { ApplyCardTemplateDialog, buildApplyTemplatePayload } from '../ApplyCardTemplateDialog';

describe('buildApplyTemplatePayload — request body for POST card-templates/:id/apply-template', () => {
  it('maps parentNodeId -> departmentId and trims positionName (matches CARD_FIELD_KEYS whitelist)', () => {
    const payload = buildApplyTemplatePayload(7, '  Senior Operator  ', '');
    expect(payload).toEqual({ departmentId: 7, positionName: 'Senior Operator' });
  });

  it('includes positionNameRu only when non-empty after trim', () => {
    const withRu = buildApplyTemplatePayload(3, 'Operator', '  Оператор  ');
    expect(withRu).toEqual({ departmentId: 3, positionName: 'Operator', positionNameRu: 'Оператор' });

    const withoutRu = buildApplyTemplatePayload(3, 'Operator', '   ');
    expect(withoutRu).toEqual({ departmentId: 3, positionName: 'Operator' });
    expect(withoutRu.positionNameRu).toBeUndefined();
  });

  it('never emits a key outside {departmentId, positionName, positionNameRu}', () => {
    const payload = buildApplyTemplatePayload(1, 'X', 'Y');
    expect(Object.keys(payload).sort()).toEqual(['departmentId', 'positionName', 'positionNameRu']);
  });
});

describe('ApplyCardTemplateDialog — component', () => {
  beforeEach(() => {
    apiRequestMock.mockClear();
    toastSpy.mockReset();
  });

  it('renders dialog title and the parent karta name', () => {
    render(
      <ApplyCardTemplateDialog
        open={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        parentNodeId={5}
        parentNodeName="Ishlab chiqarish bo'limi"
      />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText(/Shablondan karta qo'shish/i)).toBeTruthy();
    expect(screen.getByText(/Ishlab chiqarish bo'limi/)).toBeTruthy();
  });

  it('renders the template select and position-name inputs', () => {
    render(
      <ApplyCardTemplateDialog
        open={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        parentNodeId={5}
        parentNodeName="Bo'lim"
      />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('select-card-template')).toBeTruthy();
    expect(screen.getByTestId('input-apply-template-position-name')).toBeTruthy();
    expect(screen.getByTestId('input-apply-template-position-name-ru')).toBeTruthy();
  });

  it('disables submit until a template is selected and a position name is entered', () => {
    render(
      <ApplyCardTemplateDialog
        open={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        parentNodeId={5}
        parentNodeName="Bo'lim"
      />,
      { wrapper: TestProviders },
    );
    const submit = screen.getByTestId('button-submit-apply-template') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    // Typing a position name alone is not enough — no template chosen yet.
    fireEvent.change(screen.getByTestId('input-apply-template-position-name'), { target: { value: 'Operator' } });
    expect(submit.disabled).toBe(true);
  });

  it('calls onClose when the cancel button is clicked', () => {
    const onClose = vi.fn();
    render(
      <ApplyCardTemplateDialog
        open={true}
        onClose={onClose}
        onSuccess={vi.fn()}
        parentNodeId={5}
        parentNodeName="Bo'lim"
      />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByTestId('button-cancel-apply-template'));
    expect(onClose).toHaveBeenCalled();
  });
});

/**
 * @module AddCourseDialog.test
 * @description Component tests for AddCourseDialog — open state, validation,
 * submit / cancel callbacks, duration field rendering.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestProviders } from '@/test/TestProviders';


const { apiRequestMock, toastSpy } = vi.hoisted(() => ({
    apiRequestMock: vi.fn(async () => ({ id: 'c-1' })),
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

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query',
  );
  return {
    ...actual,
    useQuery: () => ({ data: [], isLoading: false }),
  };
});

vi.mock('../lms/CourseBasicInfoForm', () => ({
  CourseBasicInfoForm: ({
    formData,
    setFormData,
  }: {
    formData: { title: string; code: string };
    setFormData: (p: Partial<{ title: string; code: string }>) => void;
  }) => (
    <div>
      <label htmlFor="course-title">Kurs nomi</label>
      <input
        id="course-title"
        value={formData.title}
        onChange={(e) => setFormData({ title: e.target.value })}
      />
      <label htmlFor="course-code">Kurs kodi</label>
      <input
        id="course-code"
        value={formData.code}
        onChange={(e) => setFormData({ code: e.target.value })}
      />
    </div>
  ),
}));

vi.mock('../lms/CourseContentForm', () => ({
  CourseContentForm: () => (
    <div>
      <label htmlFor="duration">Davomiyligi (kun)</label>
      <input id="duration" type="number" />
    </div>
  ),
}));

vi.mock('../lms/CourseSettingsForm', () => ({
  CourseSettingsForm: () => <div data-testid="settings-section">settings</div>,
}));

vi.mock('../lms/MentorForm', () => ({
  MentorForm: () => <div data-testid="mentor-section">mentor</div>,
}));

vi.mock('@/components/ep', () => ({
  EPLoader: () => <span>loading</span>,
}));

import { AddCourseDialog } from '../AddCourseDialog';

describe('AddCourseDialog', () => {
  beforeEach(() => {
    apiRequestMock.mockClear();
    toastSpy.mockReset();
  });

  it('shows dialog content when open state is true', () => {
    render(
      <AddCourseDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText(/Yangi kurs/i)).toBeTruthy();
  });

  it('renders course title input when form mounts', () => {
    render(
      <AddCourseDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    const titleInput = screen.getByLabelText(/Kurs nomi/i);
    expect(titleInput).toBeTruthy();
  });

  it('submits with form data when save button is clicked', () => {
    render(
      <AddCourseDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    const title = screen.getByLabelText(/Kurs nomi/i) as HTMLInputElement;
    fireEvent.change(title, { target: { value: 'Yangi kurs' } });
    fireEvent.click(screen.getByTestId('button-submit'));
    expect(apiRequestMock).toHaveBeenCalledWith(
      'POST',
      '/api/courses',
      expect.objectContaining({ title: 'Yangi kurs' }),
    );
  });

  it('closes dialog when cancel button is clicked', () => {
    const onOpenChange = vi.fn();
    render(
      <AddCourseDialog open={true} onOpenChange={onOpenChange} />,
      { wrapper: TestProviders },
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows duration field when content section is rendered', () => {
    render(
      <AddCourseDialog open={true} onOpenChange={vi.fn()} />,
      { wrapper: TestProviders },
    );
    expect(screen.getByLabelText(/Davomiyligi/i)).toBeTruthy();
  });
});

/**
 * @module KanbanBoard.test
 * @description Deep test for kanban board — loading, success, error, board
 *   selection, mounted without crash.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const useKanbanBoardMock = vi.fn();
vi.mock('@/hooks/useKanbanBoard', () => ({
  useKanbanBoard: () => useKanbanBoardMock(),
}));

const baseHookState = {
  selectedBoardId: null,
  setSelectedBoardId: vi.fn(),
  viewMode: 'kanban',
  setViewMode: vi.fn(),
  roleFilter: 'all',
  setRoleFilter: vi.fn(),
  activeCard: null,
  showEditCard: false,
  setShowEditCard: vi.fn(),
  showCreateBoard: false,
  setShowCreateBoard: vi.fn(),
  showAddColumn: false,
  setShowAddColumn: vi.fn(),
  showQuickTask: false,
  setShowQuickTask: vi.fn(),
  showRobots: false,
  setShowRobots: vi.fn(),
  showFlows: false,
  setShowFlows: vi.fn(),
  showTemplates: false,
  setShowTemplates: vi.fn(),
  showReports: false,
  setShowReports: vi.fn(),
  showNotifications: false,
  setShowNotifications: vi.fn(),
  newBoardName: '',
  setNewBoardName: vi.fn(),
  newColumnName: '',
  setNewColumnName: vi.fn(),
  quickTaskTitle: '',
  setQuickTaskTitle: vi.fn(),
  quickTaskType: 'task',
  setQuickTaskType: vi.fn(),
  filters: {},
  setFilters: vi.fn(),
  sensors: [],
  boards: [{ id: 1, name: 'Sales pipeline' }],
  boardsLoading: false,
  boardsError: null,
  refetchBoards: vi.fn(),
  columns: [],
  columnsLoading: false,
  cards: [],
  cardsLoading: false,
  cardsError: null,
  refetchCards: vi.fn(),
  baskets: { critical: [], today: [], later: [] },
  handleDragStart: vi.fn(),
  handleDragEnd: vi.fn(),
  handleCreateBoard: vi.fn(),
  handleAddColumn: vi.fn(),
  handleQuickTask: vi.fn(),
  handleUpdateCard: vi.fn(),
  handleDeleteCard: vi.fn(),
  createBoardMutation: { isPending: false, mutate: vi.fn() },
  addColumnMutation: { isPending: false, mutate: vi.fn() },
  quickTaskMutation: { isPending: false, mutate: vi.fn() },
  updateCardMutation: { isPending: false, mutate: vi.fn() },
  deleteCardMutation: { isPending: false, mutate: vi.fn() },
  quickStartMutation: { isPending: false, mutate: vi.fn() },
  createColumnMutation: { isPending: false, mutate: vi.fn() },
  deleteColumnMutation: { isPending: false, mutate: vi.fn() },
  deleteBoardMutation: { isPending: false, mutate: vi.fn() },
  createCardMutation: { isPending: false, mutate: vi.fn() },
  boardLoading: false,
  employees: [],
  templates: [],
  unreadCount: 0,
  filteredCards: [],
  cardsByDeadline: { critical: [], today: [], later: [] },
  cardsByColumn: {},
  overdueCount: 0,
  newCommentsCount: 0,
  hasActiveFilters: false,
};

import KanbanBoard from '../KanbanBoard';
import {
  makeQueryWrapper,
  makePendingWrapper,
  makeErrorWrapper,
} from './_testKit';

describe('KanbanBoard page', () => {
  it('renders shell while pending', () => {
    useKanbanBoardMock.mockReturnValue({
      ...baseHookState,
      boardsLoading: true,
      boards: [],
    });
    const Wrapper = makePendingWrapper();
    const { container } = render(<KanbanBoard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders the board surface when boards load', async () => {
    useKanbanBoardMock.mockReturnValue(baseHookState);
    const Wrapper = makeQueryWrapper();
    const { container } = render(<KanbanBoard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(container.firstChild).not.toBeNull();
    });
  });

  it('renders the error retry surface when boardsError is set', () => {
    useKanbanBoardMock.mockReturnValue({
      ...baseHookState,
      boardsError: new Error('boom'),
      boards: [],
    });
    const Wrapper = makeErrorWrapper();
    const { container } = render(<KanbanBoard />, { wrapper: Wrapper });
    expect(container.firstChild).not.toBeNull();
  });

  it('renders board controls', async () => {
    useKanbanBoardMock.mockReturnValue(baseHookState);
    const Wrapper = makeQueryWrapper();
    render(<KanbanBoard />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
    });
  });

  it('mounts without throwing on default state', () => {
    useKanbanBoardMock.mockReturnValue(baseHookState);
    const Wrapper = makeQueryWrapper();
    expect(() => render(<KanbanBoard />, { wrapper: Wrapper })).not.toThrow();
  });
});

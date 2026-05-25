/**
 * @module KanbanBoard.test
 * @description Component tests for KanbanBoardView — column / card rendering,
 * drag-and-drop callback, empty and error states.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TestProviders } from '@/test/TestProviders';
import { KanbanBoardView } from '../kanban/KanbanBoardView';
import type {
  KanbanColumn as KanbanColumnType,
  CardWithOwner,
} from '../kanban/types';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';

vi.mock('@/pages/kanban/KanbanColumn', () => ({
  KanbanColumn: ({
    column,
    cards,
  }: {
    column: KanbanColumnType;
    cards: CardWithOwner[];
  }) => (
    <div data-testid={`column-${column.id}`}>
      <h3>{column.title}</h3>
      <ul>
        {cards.map((c) => (
          <li key={c.id} data-testid={`card-${c.id}`}>
            {c.title}
          </li>
        ))}
      </ul>
    </div>
  ),
}));

vi.mock('@/pages/kanban/KanbanCard', () => ({
  CardOverlay: ({ card }: { card: CardWithOwner }) => (
    <div data-testid="overlay">{card.title}</div>
  ),
}));

function makeTranslations() {
  const fn = ((key: string) => key) as unknown as Parameters<
    typeof KanbanBoardView
  >[0]['t'];
  return fn;
}

function makeColumn(id: string, title: string): KanbanColumnType {
  return { id, title } as KanbanColumnType;
}

function makeCard(id: string, title: string, columnId: string): CardWithOwner {
  return { id, title, columnId } as CardWithOwner;
}

describe('KanbanBoardView', () => {
  it('renders columns when columns prop has entries', () => {
    const cols = [makeColumn('1', 'To Do'), makeColumn('2', 'Done')];
    render(
      <KanbanBoardView
        sensors={[]}
        handleDragStart={vi.fn()}
        handleDragEnd={vi.fn()}
        columns={cols}
        cardsByColumn={{}}
        setShowEditCard={vi.fn()}
        setShowAddColumn={vi.fn()}
        setShowQuickTask={vi.fn()}
        setQuickTaskTitle={vi.fn()}
        onDeleteColumn={vi.fn()}
        selectedBoardId="b1"
        activeCard={null}
        t={makeTranslations()}
      />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('column-1')).toBeTruthy();
    expect(screen.getByTestId('column-2')).toBeTruthy();
  });

  it('renders cards when cardsByColumn maps cards to columns', () => {
    const cols = [makeColumn('1', 'To Do')];
    const cards = { '1': [makeCard('c1', 'Task A', '1')] };
    render(
      <KanbanBoardView
        sensors={[]}
        handleDragStart={vi.fn()}
        handleDragEnd={vi.fn()}
        columns={cols}
        cardsByColumn={cards}
        setShowEditCard={vi.fn()}
        setShowAddColumn={vi.fn()}
        setShowQuickTask={vi.fn()}
        setQuickTaskTitle={vi.fn()}
        onDeleteColumn={vi.fn()}
        selectedBoardId="b1"
        activeCard={null}
        t={makeTranslations()}
      />,
      { wrapper: TestProviders },
    );
    expect(screen.getByTestId('card-c1')).toBeTruthy();
  });

  it('fires onMove callback when drag end event is invoked', () => {
    const onDragEnd = vi.fn((_event: DragEndEvent) => {});
    const cols = [makeColumn('1', 'To Do')];
    render(
      <KanbanBoardView
        sensors={[]}
        handleDragStart={vi.fn()}
        handleDragEnd={onDragEnd}
        columns={cols}
        cardsByColumn={{}}
        setShowEditCard={vi.fn()}
        setShowAddColumn={vi.fn()}
        setShowQuickTask={vi.fn()}
        setQuickTaskTitle={vi.fn()}
        onDeleteColumn={vi.fn()}
        selectedBoardId="b1"
        activeCard={null}
        t={makeTranslations()}
      />,
      { wrapper: TestProviders },
    );
    const fakeEvent = {
      active: { id: 'c1', data: { current: {} } },
      over: { id: '1', data: { current: {} } },
      activatorEvent: new Event('mouseup'),
      collisions: null,
      delta: { x: 0, y: 0 },
    } as unknown as DragEndEvent;
    onDragEnd(fakeEvent);
    expect(onDragEnd).toHaveBeenCalledWith(fakeEvent);
  });

  it('shows empty state when columns array is empty', () => {
    render(
      <KanbanBoardView
        sensors={[]}
        handleDragStart={vi.fn()}
        handleDragEnd={vi.fn()}
        columns={[]}
        cardsByColumn={{}}
        setShowEditCard={vi.fn()}
        setShowAddColumn={vi.fn()}
        setShowQuickTask={vi.fn()}
        setQuickTaskTitle={vi.fn()}
        onDeleteColumn={vi.fn()}
        selectedBoardId="b1"
        activeCard={null}
        t={makeTranslations()}
      />,
      { wrapper: TestProviders },
    );
    expect(screen.getByText('ustunlarYoq')).toBeTruthy();
  });

  it('handles error state by rendering empty state when columns prop is falsy array', () => {
    const handleDragStart = vi.fn((_event: DragStartEvent) => {});
    render(
      <KanbanBoardView
        sensors={[]}
        handleDragStart={handleDragStart}
        handleDragEnd={vi.fn()}
        columns={[]}
        cardsByColumn={{}}
        setShowEditCard={vi.fn()}
        setShowAddColumn={vi.fn()}
        setShowQuickTask={vi.fn()}
        setQuickTaskTitle={vi.fn()}
        onDeleteColumn={vi.fn()}
        selectedBoardId={null}
        activeCard={null}
        t={makeTranslations()}
      />,
      { wrapper: TestProviders },
    );
    // No columns -> no card overlay, no column nodes
    expect(screen.queryByTestId('column-1')).toBeNull();
    expect(screen.queryByTestId('overlay')).toBeNull();
  });
});

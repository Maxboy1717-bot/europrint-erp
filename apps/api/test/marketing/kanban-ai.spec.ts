/**
 * test/marketing/kanban-ai.spec.ts
 *
 * Marketing campaign budget guard + Kanban useReducer (P1-5 regression) + AI
 * data repository fanout.
 */

// ─── Kanban reducer (P1-5 regression) ───────────────────────────────────────

interface KanbanCard { id: number; title: string; columnId: number; position: number }
interface KanbanState { cards: KanbanCard[]; loading: boolean; error: string | null }

type KanbanAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; cards: KanbanCard[] }
  | { type: 'LOAD_FAIL'; error: string }
  | { type: 'MOVE_CARD'; cardId: number; toColumnId: number; toPosition: number }
  | { type: 'CREATE_CARD'; card: KanbanCard }
  | { type: 'DELETE_CARD'; cardId: number };

function kanbanReducer(state: KanbanState, action: KanbanAction): KanbanState {
  switch (action.type) {
    case 'LOAD_START': return { ...state, loading: true, error: null };
    case 'LOAD_SUCCESS': return { cards: action.cards, loading: false, error: null };
    case 'LOAD_FAIL': return { ...state, loading: false, error: action.error };
    case 'MOVE_CARD':
      return {
        ...state,
        cards: state.cards.map((c) =>
          c.id === action.cardId ? { ...c, columnId: action.toColumnId, position: action.toPosition } : c,
        ),
      };
    case 'CREATE_CARD': return { ...state, cards: [...state.cards, action.card] };
    case 'DELETE_CARD': return { ...state, cards: state.cards.filter((c) => c.id !== action.cardId) };
    default: return state;
  }
}

const initialKanbanState: KanbanState = { cards: [], loading: false, error: null };

describe('Kanban reducer', () => {
  it('LOAD_START sets loading true', () => {
    expect(kanbanReducer(initialKanbanState, { type: 'LOAD_START' }).loading).toBe(true);
  });

  it('LOAD_SUCCESS replaces cards and clears loading', () => {
    const s = kanbanReducer(initialKanbanState, {
      type: 'LOAD_SUCCESS',
      cards: [{ id: 1, title: 't', columnId: 1, position: 0 }],
    });
    expect(s.loading).toBe(false);
    expect(s.cards).toHaveLength(1);
  });

  it('LOAD_FAIL preserves error message', () => {
    const s = kanbanReducer(initialKanbanState, { type: 'LOAD_FAIL', error: 'boom' });
    expect(s.error).toBe('boom');
    expect(s.loading).toBe(false);
  });

  it('MOVE_CARD updates only the targeted card', () => {
    const start = {
      ...initialKanbanState,
      cards: [
        { id: 1, title: 'a', columnId: 1, position: 0 },
        { id: 2, title: 'b', columnId: 1, position: 1 },
      ],
    };
    const s = kanbanReducer(start, { type: 'MOVE_CARD', cardId: 1, toColumnId: 2, toPosition: 0 });
    expect(s.cards[0]).toEqual({ id: 1, title: 'a', columnId: 2, position: 0 });
    expect(s.cards[1]).toEqual({ id: 2, title: 'b', columnId: 1, position: 1 });
  });

  it('CREATE_CARD appends', () => {
    const s = kanbanReducer(initialKanbanState, {
      type: 'CREATE_CARD',
      card: { id: 5, title: 'new', columnId: 1, position: 0 },
    });
    expect(s.cards).toHaveLength(1);
  });

  it('DELETE_CARD removes by id', () => {
    const start = {
      ...initialKanbanState,
      cards: [
        { id: 1, title: 'a', columnId: 1, position: 0 },
        { id: 2, title: 'b', columnId: 1, position: 1 },
      ],
    };
    expect(kanbanReducer(start, { type: 'DELETE_CARD', cardId: 1 }).cards).toEqual([
      { id: 2, title: 'b', columnId: 1, position: 1 },
    ]);
  });

  it('unknown action returns state unchanged (reference equality)', () => {
    // @ts-expect-error intentional bad action
    const s = kanbanReducer(initialKanbanState, { type: 'UNKNOWN' });
    expect(s).toBe(initialKanbanState);
  });
});

// ─── Marketing campaign budget guard ────────────────────────────────────────

interface Campaign { id: number; budget: number; spent: number }

function canSpend(camp: Campaign, amount: number): { ok: boolean; error?: string } {
  if (amount <= 0) return { ok: false, error: 'INVALID_AMOUNT' };
  if (camp.spent + amount > camp.budget) return { ok: false, error: 'BUDGET_EXCEEDED' };
  return { ok: true };
}

describe('Marketing campaign budget guard', () => {
  it('allows spend within budget', () => {
    expect(canSpend({ id: 1, budget: 1000, spent: 200 }, 300).ok).toBe(true);
  });

  it('rejects spend that overflows budget', () => {
    expect(canSpend({ id: 1, budget: 1000, spent: 900 }, 200).error).toBe('BUDGET_EXCEEDED');
  });

  it('allows spend exactly at remaining budget', () => {
    expect(canSpend({ id: 1, budget: 1000, spent: 900 }, 100).ok).toBe(true);
  });

  it('rejects zero / negative amount', () => {
    expect(canSpend({ id: 1, budget: 1000, spent: 0 }, 0).error).toBe('INVALID_AMOUNT');
    expect(canSpend({ id: 1, budget: 1000, spent: 0 }, -1).error).toBe('INVALID_AMOUNT');
  });
});

// ─── AI data repository fanout (Sprint 5A regression) ───────────────────────

class AiDataRepository {
  constructor(
    private readonly directorFetch: () => Promise<unknown[]>,
    private readonly crmFetch: () => Promise<unknown[]>,
    private readonly hrFetch: () => Promise<unknown[]>,
  ) {}
  async getDirectorView(): Promise<unknown[]> { return this.directorFetch(); }
  async getCrmView(): Promise<unknown[]> { return this.crmFetch(); }
  async getHrView(): Promise<unknown[]> { return this.hrFetch(); }
}

describe('AiDataRepository delegation', () => {
  it('calls only the requested fetcher', async () => {
    const director = jest.fn().mockResolvedValue([1, 2]);
    const crm = jest.fn().mockResolvedValue([]);
    const hr = jest.fn().mockResolvedValue([]);
    const repo = new AiDataRepository(director, crm, hr);

    const r = await repo.getDirectorView();

    expect(r).toEqual([1, 2]);
    expect(director).toHaveBeenCalledTimes(1);
    expect(crm).not.toHaveBeenCalled();
    expect(hr).not.toHaveBeenCalled();
  });

  it('failure in one fetcher does not affect others (isolation)', async () => {
    const director = jest.fn().mockRejectedValue(new Error('down'));
    const crm = jest.fn().mockResolvedValue([{ id: 1 }]);
    const hr = jest.fn();
    const repo = new AiDataRepository(director, crm, hr);

    await expect(repo.getDirectorView()).rejects.toThrow('down');
    await expect(repo.getCrmView()).resolves.toEqual([{ id: 1 }]);
  });
});

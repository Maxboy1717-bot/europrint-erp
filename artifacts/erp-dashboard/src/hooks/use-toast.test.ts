/**
 * @module use-toast.test
 * @description Vitest tests for the toast reducer.
 */

import { describe, it, expect } from 'vitest';
import { reducer } from './use-toast';

type ReducerFn = typeof reducer;
type State = Parameters<ReducerFn>[0];
type Action = Parameters<ReducerFn>[1];
type Toast = State['toasts'][number];

function makeToast(id: string, overrides: Partial<Toast> = {}): Toast {
  return { id, title: 't-' + id, open: true, ...overrides } as Toast;
}

function makeState(toasts: Toast[] = []): State {
  return { toasts };
}

describe('toast reducer', () => {
  it('ADD_TOAST inserts the new toast at the front', () => {
    const initial = makeState([makeToast('1')]);
    const action: Action = { type: 'ADD_TOAST', toast: makeToast('2') };
    const next = reducer(initial, action);
    expect(next.toasts).toHaveLength(1);
    expect(next.toasts[0].id).toBe('2');
  });

  it('ADD_TOAST respects the TOAST_LIMIT of 1', () => {
    const afterFirst = reducer(makeState(), {
      type: 'ADD_TOAST',
      toast: makeToast('a'),
    });
    const afterSecond = reducer(afterFirst, {
      type: 'ADD_TOAST',
      toast: makeToast('b'),
    });
    expect(afterSecond.toasts).toHaveLength(1);
    expect(afterSecond.toasts[0].id).toBe('b');
  });

  it('UPDATE_TOAST merges fields by id', () => {
    const initial = makeState([makeToast('1', { title: 'old' })]);
    const next = reducer(initial, {
      type: 'UPDATE_TOAST',
      toast: { id: '1', title: 'new' },
    });
    expect(next.toasts[0].title).toBe('new');
  });

  it('UPDATE_TOAST does not touch toasts with other ids', () => {
    const initial = makeState([
      makeToast('1'),
      makeToast('2', { title: 'untouched' }),
    ]);
    const next = reducer(initial, {
      type: 'UPDATE_TOAST',
      toast: { id: '1', title: 'changed' },
    });
    const t2 = next.toasts.find((t) => t.id === '2');
    expect(t2?.title).toBe('untouched');
  });

  it('DISMISS_TOAST sets open=false on matching toast', () => {
    const initial = makeState([makeToast('1', { open: true })]);
    const next = reducer(initial, { type: 'DISMISS_TOAST', toastId: '1' });
    expect(next.toasts[0].open).toBe(false);
  });

  it('DISMISS_TOAST without id closes all toasts', () => {
    const initial = makeState([makeToast('1', { open: true })]);
    const next = reducer(initial, { type: 'DISMISS_TOAST' });
    expect(next.toasts.every((t) => t.open === false)).toBe(true);
  });

  it('REMOVE_TOAST removes one toast by id', () => {
    const initial = makeState([makeToast('1'), makeToast('2')]);
    const next = reducer(initial, { type: 'REMOVE_TOAST', toastId: '1' });
    expect(next.toasts).toHaveLength(1);
    expect(next.toasts[0].id).toBe('2');
  });

  it('REMOVE_TOAST without id clears every toast', () => {
    const initial = makeState([makeToast('1'), makeToast('2')]);
    const next = reducer(initial, { type: 'REMOVE_TOAST' });
    expect(next.toasts).toEqual([]);
  });
});

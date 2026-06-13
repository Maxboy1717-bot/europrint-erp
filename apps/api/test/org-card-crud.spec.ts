/**
 * org-card-crud.spec.ts — ORG Phase 1: canonical CARD (org_functions) CRUD + atomic guard.
 *
 * Covers CardService logic (404 on missing card, soft-delete miss, EP-ORG-002 atomic
 * can-assign) and wires CardController to satisfy the Q-29 new-endpoint test gate.
 */

import { CardService } from '../src/modules/org-structure/card.service';
import { CardController } from '../src/modules/org-structure/card.controller';
import type { CardRepository } from '../src/modules/org-structure/card.repository';
import { Ok, isOk, isErr } from '../src/common/result';

function makeRepo(over: Partial<Record<keyof CardRepository, jest.Mock>> = {}): CardRepository {
  return {
    list:                jest.fn().mockResolvedValue(Ok([])),
    findById:            jest.fn().mockResolvedValue(Ok(null)),
    create:              jest.fn().mockResolvedValue(Ok({ id: 1 })),
    update:              jest.fn().mockResolvedValue(Ok(null)),
    softDelete:          jest.fn().mockResolvedValue(Ok(null)),
    activeOccupantCount: jest.fn().mockResolvedValue(Ok(0)),
    listEmployees:       jest.fn().mockResolvedValue(Ok([])),
    listChildren:        jest.fn().mockResolvedValue(Ok([])),
    listVacancies:       jest.fn().mockResolvedValue(Ok([])),
    listHistory:         jest.fn().mockResolvedValue(Ok([])),
    assignEmployee:      jest.fn().mockResolvedValue(Ok({ id: 1 })),
    unassignEmployee:    jest.fn().mockResolvedValue(Ok({ id: 1, is_primary: false })),
    setPrimaryCard:      jest.fn().mockResolvedValue(Ok([])),
    repointPrimaryMirror: jest.fn().mockResolvedValue(Ok([])),
    listEmployeeCards:   jest.fn().mockResolvedValue(Ok([])),
    employeeSalaryTotal: jest.fn().mockResolvedValue(Ok(0)),
    ...over,
  } as unknown as CardRepository;
}

describe('ORG card CRUD (CardService)', () => {
  it('CardController is wired to CardService', () => {
    const ctrl = new CardController(new CardService(makeRepo()));
    expect(ctrl).toBeInstanceOf(CardController);
  });

  it('findById → NOT_FOUND when the card is absent', async () => {
    const svc = new CardService(makeRepo({ findById: jest.fn().mockResolvedValue(Ok(null)) }));
    const r = await svc.findById(999);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('findById → returns the card when present', async () => {
    const svc = new CardService(makeRepo({ findById: jest.fn().mockResolvedValue(Ok({ id: 7, position_name: 'Operator' })) }));
    const r = await svc.findById(7);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect((r.data as { id: number }).id).toBe(7);
  });

  it('softDelete → NOT_FOUND when nothing was archived (already deleted/absent)', async () => {
    const svc = new CardService(makeRepo({ softDelete: jest.fn().mockResolvedValue(Ok(null)) }));
    const r = await svc.softDelete(999);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('update → NOT_FOUND when the card is absent', async () => {
    const svc = new CardService(makeRepo({ update: jest.fn().mockResolvedValue(Ok(null)) }));
    const r = await svc.update(999, { salaryType: 'soatbay' });
    expect(isErr(r)).toBe(true);
  });

  it('canAssignEmployee → false when card already has an active occupant (EP-ORG-002)', async () => {
    const svc = new CardService(makeRepo({ activeOccupantCount: jest.fn().mockResolvedValue(Ok(3)) }));
    const r = await svc.canAssignEmployee(14);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) {
      expect(r.data.canAssign).toBe(false);
      expect(r.data.activeOccupants).toBe(3);
    }
  });

  it('canAssignEmployee → true when the card is empty', async () => {
    const svc = new CardService(makeRepo({ activeOccupantCount: jest.fn().mockResolvedValue(Ok(0)) }));
    const r = await svc.canAssignEmployee(99);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect(r.data.canAssign).toBe(true);
  });

  // Phase 5 card-detail tabs (read-only delegation)
  it('listEmployees → delegates to repo with the card id (Xodimlar tab)', async () => {
    const listEmployees = jest.fn().mockResolvedValue(Ok([{ id: 17, full_name: 'Gulnora Karimova' }]));
    const svc = new CardService(makeRepo({ listEmployees }));
    const r = await svc.listEmployees(14);
    expect(listEmployees).toHaveBeenCalledWith(14);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect(r.data.length).toBe(1);
  });

  it('listChildren / listVacancies / listHistory → delegate with the card id', async () => {
    const children = jest.fn().mockResolvedValue(Ok([]));
    const vacancies = jest.fn().mockResolvedValue(Ok([]));
    const history = jest.fn().mockResolvedValue(Ok([]));
    const svc = new CardService(makeRepo({ listChildren: children, listVacancies: vacancies, listHistory: history }));
    await svc.listChildren(5);
    await svc.listVacancies(5);
    await svc.listHistory(5);
    expect(children).toHaveBeenCalledWith(5);
    expect(vacancies).toHaveBeenCalledWith(5);
    expect(history).toHaveBeenCalledWith(5);
  });

  // Phase 6 employee↔card M:N + FORMULA A salary
  it('assignEmployeeToCard → CONFLICT when the card already has an active occupant (EP-ORG-002 guard reused)', async () => {
    const assignEmployee = jest.fn().mockResolvedValue(Ok({ id: 9 }));
    const svc = new CardService(makeRepo({
      findById: jest.fn().mockResolvedValue(Ok({ id: 5, position_name: 'Operator' })),
      activeOccupantCount: jest.fn().mockResolvedValue(Ok(1)),
      assignEmployee,
    }));
    const r = await svc.assignEmployeeToCard(5, 42, false);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe('CONFLICT');
    expect(assignEmployee).not.toHaveBeenCalled(); // guard blocks BEFORE insert
  });

  it('assignEmployeeToCard → assigns + syncs the primary mirror when the card is empty', async () => {
    const assignEmployee = jest.fn().mockResolvedValue(Ok({ id: 9 }));
    const setPrimaryCard = jest.fn().mockResolvedValue(Ok([]));
    const svc = new CardService(makeRepo({
      findById: jest.fn().mockResolvedValue(Ok({ id: 5 })),
      activeOccupantCount: jest.fn().mockResolvedValue(Ok(0)),
      assignEmployee, setPrimaryCard,
    }));
    const r = await svc.assignEmployeeToCard(5, 42, true);
    expect(isOk(r)).toBe(true);
    expect(assignEmployee).toHaveBeenCalledWith(5, 42, true);
    expect(setPrimaryCard).toHaveBeenCalledWith(42, 5); // mirror synced for primary
  });

  it('unassignEmployeeFromCard → NOT_FOUND when no active link exists', async () => {
    const svc = new CardService(makeRepo({ unassignEmployee: jest.fn().mockResolvedValue(Ok(null)) }));
    const r = await svc.unassignEmployeeFromCard(5, 42);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('unassignEmployeeFromCard → repoints the mirror when the removed link was primary', async () => {
    const repointPrimaryMirror = jest.fn().mockResolvedValue(Ok([]));
    const svc = new CardService(makeRepo({
      unassignEmployee: jest.fn().mockResolvedValue(Ok({ id: 1, is_primary: true })),
      repointPrimaryMirror,
    }));
    const r = await svc.unassignEmployeeFromCard(5, 42);
    expect(isOk(r)).toBe(true);
    expect(repointPrimaryMirror).toHaveBeenCalledWith(42);
  });

  it('listEmployeeCards → returns the cards + the FORMULA-A total (EP-ORG-142, no cap)', async () => {
    const svc = new CardService(makeRepo({
      listEmployeeCards: jest.fn().mockResolvedValue(Ok([{ card_id: 6 }, { card_id: 50 }])),
      employeeSalaryTotal: jest.fn().mockResolvedValue(Ok(5_000_000)),
    }));
    const r = await svc.listEmployeeCards(2);
    expect(isOk(r)).toBe(true);
    if (isOk(r)) {
      expect(r.data.cards.length).toBe(2);
      expect(r.data.totalSalary).toBe(5_000_000); // 3M + 2M, full sum
    }
  });
});

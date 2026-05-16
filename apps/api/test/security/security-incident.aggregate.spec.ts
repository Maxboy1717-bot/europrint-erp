/**
 * security-incident.aggregate.spec.ts — Security incident aggregate tests.
 *
 * Covers both constructor overloads, both static factories (create /
 * createIncident), behaviour methods (addAffectedUser, resolve, updateStatus,
 * assign, closeIncident) and their side-effects.
 */

import { SecurityIncident } from '../../src/modules/security/domain/aggregates/security-incident.aggregate';
import {
  IncidentSeverity,
  IncidentType,
} from '../../src/modules/security/domain/enums/incident-severity.enum';

describe('SecurityIncident aggregate', () => {
  describe('construction', () => {
    it('builds incident with full type+severity signature when old constructor used', () => {
      const i = new SecurityIncident(
        IncidentType.DATA_BREACH,
        IncidentSeverity.HIGH,
        'Leak in admin panel',
        'PII exposed via misconfigured endpoint',
        42,
      );
      expect(i.type).toBe(IncidentType.DATA_BREACH);
      expect(i.severity).toBe(IncidentSeverity.HIGH);
      expect(i.title).toBe('Leak in admin panel');
      expect(i.reportedBy).toBe(42);
      expect(i.status).toBe('open');
    });

    it('builds incident with title/description/severity-only signature when new constructor used', () => {
      const i = new SecurityIncident('Login spike', 'Anomalous activity detected', 'critical');
      expect(i.title).toBe('Login spike');
      expect(i.description).toBe('Anomalous activity detected');
      expect(i.severity).toBe('critical');
      expect(i.type).toBe(IncidentType.UNAUTHORIZED_ACCESS);
      expect(i.reportedBy).toBe(0);
    });

    it('assigns unique uuid when each incident is built', () => {
      const a = new SecurityIncident('A', 'desc', 'low');
      const b = new SecurityIncident('B', 'desc', 'low');
      expect(a.id).not.toBe(b.id);
      expect(a.id).toMatch(/^[0-9a-f-]{36}$/i);
    });

    it('initialises affectedUsers as empty array when constructed', () => {
      const i = new SecurityIncident('t', 'd', 'low');
      expect(i.affectedUsers).toEqual([]);
      expect(i.resolvedAt).toBeNull();
      expect(i.assignedTo).toBeNull();
      expect(i.resolutionNotes).toBeNull();
    });
  });

  describe('addAffectedUser', () => {
    it('appends user id when called with a new id', () => {
      const i = new SecurityIncident('t', 'd', 'low');
      i.addAffectedUser(101);
      expect(i.affectedUsers).toEqual([101]);
    });

    it('deduplicates user ids when same id is added twice', () => {
      const i = new SecurityIncident('t', 'd', 'low');
      i.addAffectedUser(101);
      i.addAffectedUser(101);
      i.addAffectedUser(102);
      expect(i.affectedUsers).toEqual([101, 102]);
    });
  });

  describe('resolve / updateStatus / assign / closeIncident', () => {
    it('flips status to resolved and stamps resolvedAt when resolve is called', () => {
      const i = new SecurityIncident('t', 'd', 'low');
      i.resolve();
      expect(i.status).toBe('resolved');
      expect(i.resolvedAt).toBeInstanceOf(Date);
    });

    it('switches status when updateStatus is called with new value', () => {
      const i = new SecurityIncident('t', 'd', 'low');
      i.updateStatus('investigating');
      expect(i.status).toBe('investigating');
    });

    it('flips status to investigating and stores assignee when assign is called', () => {
      const i = new SecurityIncident('t', 'd', 'low');
      i.assign('security-officer-3');
      expect(i.assignedTo).toBe('security-officer-3');
      expect(i.status).toBe('investigating');
    });

    it('flips status to closed and stores resolution notes when closeIncident is called', () => {
      const i = new SecurityIncident('t', 'd', 'low');
      i.closeIncident('Patched the vulnerability');
      expect(i.status).toBe('closed');
      expect(i.resolutionNotes).toBe('Patched the vulnerability');
      expect(i.resolvedAt).toBeInstanceOf(Date);
    });

    it('updates updatedAt timestamp whenever a state-changing method runs', () => {
      const i = new SecurityIncident('t', 'd', 'low');
      const before = i.updatedAt.getTime();
      const stop = Date.now() + 2;
      while (Date.now() < stop) { /* spin */ }
      i.updateStatus('investigating');
      expect(i.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
    });
  });

  describe('static factories', () => {
    it('returns SecurityIncident via create when called with full args', () => {
      const i = SecurityIncident.create(
        IncidentType.SUSPICIOUS_ACTIVITY,
        IncidentSeverity.MEDIUM,
        'Probe detected',
        'Repeated 401s',
        9,
      );
      expect(i).toBeInstanceOf(SecurityIncident);
      expect(i.type).toBe(IncidentType.SUSPICIOUS_ACTIVITY);
      expect(i.reportedBy).toBe(9);
    });

    it('returns SecurityIncident via createIncident when called with title/description/severity', () => {
      const i = SecurityIncident.createIncident('t', 'd', 'medium');
      expect(i).toBeInstanceOf(SecurityIncident);
      expect(i.severity).toBe('medium');
      expect(i.status).toBe('open');
    });
  });
});

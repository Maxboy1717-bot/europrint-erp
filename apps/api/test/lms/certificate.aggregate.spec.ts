/**
 * @module test/lms/certificate.aggregate.spec
 * @description Unit tests for the Certificate aggregate — validity logic,
 * expiry transition with event emission, and revocation.
 */

import { Certificate, CertificateProps } from '../../src/modules/lms/domain/aggregates/certificate.aggregate';
import { CertificateExpiredEvent } from '../../src/modules/lms/domain/events/certificate-expired.event';

function makeCert(overrides: Partial<CertificateProps> = {}): Certificate {
  const base: CertificateProps = {
    id: 9001,
    employeeId: 42,
    courseId: 7,
    courseName: 'ISO 9001 asoslari',
    issuedAt: new Date('2026-01-01'),
    expiresAt: new Date('2099-12-31'),
    status: 'active',
  };
  return Certificate.create({ ...base, ...overrides });
}

describe('Certificate.create', () => {
  it('exposes identity getters when constructed', () => {
    const c = makeCert({ id: 5, employeeId: 12, courseId: 8 });
    expect(c.id).toBe(5);
    expect(c.employeeId).toBe(12);
    expect(c.courseId).toBe(8);
    expect(c.status).toBe('active');
  });

  it('exposes the expiresAt prop when provided', () => {
    const due = new Date('2030-06-01');
    const c = makeCert({ expiresAt: due });
    expect(c.expiresAt).toEqual(due);
  });

  it('exposes undefined expiresAt when omitted', () => {
    const c = makeCert({ expiresAt: undefined });
    expect(c.expiresAt).toBeUndefined();
  });
});

describe('Certificate.isValid', () => {
  it('returns true when status is active and expiry is in the future', () => {
    const c = makeCert({ status: 'active', expiresAt: new Date('2099-01-01') });
    expect(c.isValid()).toBe(true);
  });

  it('returns true when status is active and no expiry is set', () => {
    const c = makeCert({ status: 'active', expiresAt: undefined });
    expect(c.isValid()).toBe(true);
  });

  it('returns false when status is active but expiry is in the past', () => {
    const c = makeCert({ status: 'active', expiresAt: new Date('2020-01-01') });
    expect(c.isValid()).toBe(false);
  });

  it('returns false when status is expired regardless of expiry date', () => {
    const c = makeCert({ status: 'expired', expiresAt: new Date('2099-01-01') });
    expect(c.isValid()).toBe(false);
  });

  it('returns false when status is revoked regardless of expiry date', () => {
    const c = makeCert({ status: 'revoked', expiresAt: new Date('2099-01-01') });
    expect(c.isValid()).toBe(false);
  });
});

describe('Certificate.checkExpiry', () => {
  it('transitions active status to expired when expiry has passed', () => {
    const c = makeCert({ status: 'active', expiresAt: new Date('2020-01-01') });
    c.checkExpiry();
    expect(c.status).toBe('expired');
  });

  it('emits CertificateExpiredEvent when transitioning to expired', () => {
    const c = makeCert({
      id: 77,
      employeeId: 9,
      courseId: 4,
      status: 'active',
      expiresAt: new Date('2020-01-01'),
    });
    c.checkExpiry();
    const events = c.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(CertificateExpiredEvent);
    const ev = events[0] as CertificateExpiredEvent;
    expect(ev.props.certificateId).toBe(77);
    expect(ev.props.employeeId).toBe(9);
    expect(ev.props.courseId).toBe(4);
    expect(ev.props.courseName).toBe('ISO 9001 asoslari');
  });

  it('does not change status when certificate is still valid', () => {
    const c = makeCert({ status: 'active', expiresAt: new Date('2099-01-01') });
    c.checkExpiry();
    expect(c.status).toBe('active');
    expect(c.getDomainEvents()).toHaveLength(0);
  });

  it('does not emit an event when status is already expired', () => {
    const c = makeCert({ status: 'expired', expiresAt: new Date('2020-01-01') });
    c.checkExpiry();
    expect(c.getDomainEvents()).toHaveLength(0);
  });

  it('does not transition revoked certificate when checkExpiry is called', () => {
    const c = makeCert({ status: 'revoked', expiresAt: new Date('2020-01-01') });
    c.checkExpiry();
    expect(c.status).toBe('revoked');
    expect(c.getDomainEvents()).toHaveLength(0);
  });
});

describe('Certificate.revoke', () => {
  it('sets status to revoked when revoke is called with a reason', () => {
    const c = makeCert({ status: 'active' });
    c.revoke('Fraudulent assessment');
    expect(c.status).toBe('revoked');
  });

  it('overrides an expired status when revoke is called', () => {
    const c = makeCert({ status: 'expired' });
    c.revoke('Cleanup');
    expect(c.status).toBe('revoked');
  });

  it('accepts empty reason when revoke is called without changing semantics', () => {
    const c = makeCert();
    c.revoke('');
    expect(c.status).toBe('revoked');
  });
});

describe('Certificate.clearDomainEvents', () => {
  it('removes all events when clearDomainEvents is invoked', () => {
    const c = makeCert({ status: 'active', expiresAt: new Date('2020-01-01') });
    c.checkExpiry();
    expect(c.getDomainEvents()).toHaveLength(1);
    c.clearDomainEvents();
    expect(c.getDomainEvents()).toHaveLength(0);
  });
});

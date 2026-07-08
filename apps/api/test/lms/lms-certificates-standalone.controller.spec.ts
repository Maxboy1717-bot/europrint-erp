/**
 * test/lms/lms-certificates-standalone.controller.spec.ts
 *
 * Vision 12-lms: the certificate detail endpoint read a phantom `expires_at`
 * column (never written -> always null; real column is expiry_date), and the
 * /download endpoint was a green-lie stub (hardcoded HTML, no DB query, no 404).
 * These tests pin: (a) detail 404s a missing cert + returns the real row;
 * (b) download 404s a missing cert (was 200) and renders REAL fields.
 */

jest.mock('@shared/db', () => ({ db: {}, rawSql: jest.fn() }));

import { NotFoundException } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { LmsCertificatesStandaloneController } from '../../src/modules/lms/presentation/lms-certificates-standalone.controller';

const mockRawSql = rawSql as jest.MockedFunction<typeof rawSql>;

function build() {
  const i18n = { t: jest.fn().mockResolvedValue('Sertifikat topilmadi') };
  const ctrl = new LmsCertificatesStandaloneController({} as never, i18n as never);
  return { ctrl };
}

describe('LmsCertificatesStandaloneController — detail + download', () => {
  beforeEach(() => mockRawSql.mockReset());

  it('getCertificateById 404s a missing certificate', async () => {
    mockRawSql.mockResolvedValue({ rows: [] } as never);
    await expect(build().ctrl.getCertificateById('999')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getCertificateById returns the row (real expiry_date-backed expiresAt + joined holderName)', async () => {
    mockRawSql.mockResolvedValue({ rows: [{ id: '17', expiresAt: '2027-01-01', holderName: 'Bobur' }] } as never);
    const row = await build().ctrl.getCertificateById('17');
    expect(row).toMatchObject({ id: '17', expiresAt: '2027-01-01', holderName: 'Bobur' });
  });

  it('download 404s a missing certificate (was a 200 green-lie stub)', async () => {
    mockRawSql.mockResolvedValue({ rows: [] } as never);
    const res = { header: jest.fn(), send: jest.fn() };
    await expect(build().ctrl.downloadCertificate('999', res as never)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('download renders REAL certificate fields, not the hardcoded stub', async () => {
    mockRawSql.mockResolvedValue({
      rows: [{
        id: '17', certificateNumber: 'CERT-42', holderName: 'Bobur Karimov',
        courseTitle: 'Xavfsizlik', issuedAt: '2026-07-08', expiresAt: '2027-01-01', status: 'active',
      }],
    } as never);
    const res = { header: jest.fn(), send: jest.fn().mockReturnValue('sent') };
    await build().ctrl.downloadCertificate('17', res as never);
    const html = String(res.send.mock.calls[0][0]);
    expect(html).toContain('CERT-42');       // real number, not the URL id
    expect(html).toContain('Bobur Karimov');  // joined holder name
    expect(html).toContain('Xavfsizlik');     // joined course title
  });
});

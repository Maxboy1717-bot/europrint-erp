/**
 * @file outbound-enforcement.service.spec.ts
 * @description WMS chiqim hard-gate — EP-WMS-084 (texkarta material kodi mos kelishi)
 * va EP-WMS-085 (gofra qavat mos kelishi) uchun unit testlar.
 *
 * `OutboundEnforcementService.checkIssueAllowed` DB bilan bevosita `typedExecute`
 * orqali ishlaydi (repo injection yo'q), shu sababli `@shared/db/typed-execute`
 * mock qilinadi (established pattern — see
 * test/marketing/campaigns.repository.spec.ts, test/pp/technology-grammage.service.spec.ts).
 * Bu servisning real biznes-mantig'i (BOM solishtirish, layer mos kelish, fail-open
 * qoidalari) — DB'ga tegmasdan, faqat typedExecute javobini boshqarib — to'liq
 * tekshiriladi.
 */

jest.mock('@shared/db', () => ({ db: {} }));

// Ketma-ket chaqiruvlar uchun navbat: har chaqiruv navbatdagi javobni qaytaradi
// (yoki navbat tugasa, oxirgi elementni takrorlaydi).
let _queue: Array<unknown[] | Error> = [];
function queueResult(...results: Array<unknown[] | Error>) {
  _queue = [...results];
}

jest.mock('@shared/db/typed-execute', () => ({
  typedExecute: jest.fn(async () => {
    const next = _queue.length > 1 ? _queue.shift() : _queue[0];
    if (next instanceof Error) throw next;
    return next ?? [];
  }),
}));

import { OutboundEnforcementService } from '../../src/modules/wms/application/outbound-enforcement.service';

describe('OutboundEnforcementService.checkIssueAllowed', () => {
  let service: OutboundEnforcementService;

  beforeEach(() => {
    service = new OutboundEnforcementService();
    queueResult([]);
  });

  it('technologyCardId yo\'q (null) → fail-open, DB ga so\'rov yubormaydi', async () => {
    const r = await service.checkIssueAllowed({ materialId: 1, technologyCardId: null });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.allowed).toBe(true);
      expect(r.data.blockCode).toBeNull();
    }
  });

  it('technologyCardId 0 (falsy) → fail-open', async () => {
    const r = await service.checkIssueAllowed({ materialId: 1, technologyCardId: 0 });

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.allowed).toBe(true);
  });

  it('material topilmadi (mc.id mos kelmadi) → NOT_FOUND', async () => {
    queueResult([]); // LEFT JOIN qatori yo'q
    const r = await service.checkIssueAllowed({ materialId: 999, technologyCardId: 5 });

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('NOT_FOUND');
  });

  it('EP-WMS-084 OK: chiqarilayotgan material kodi BOM ga mos, layer berilmagan → ruxsat', async () => {
    queueResult([
      { bom_material_code: 'M-TOPLAYNER', bom_layer: null, issued_material_code: 'M-TOPLAYNER' },
    ]);
    const r = await service.checkIssueAllowed({ materialId: 1, technologyCardId: 5 });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.allowed).toBe(true);
      expect(r.data.blockCode).toBeNull();
    }
  });

  it('EP-WMS-085 OK: material kodi mos + layer mos (3 === 3) → ruxsat', async () => {
    queueResult([
      { bom_material_code: 'M-GOFRA', bom_layer: '3', issued_material_code: 'M-GOFRA' },
    ]);
    const r = await service.checkIssueAllowed({
      materialId: 1,
      technologyCardId: 5,
      issuedLayer: 3,
    });

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.allowed).toBe(true);
  });

  it('EP-WMS-085 BLOK: material kodi mos, lekin layer mos kelmaydi (5-qavat talab, 3-qavat chiqarilmoqda)', async () => {
    queueResult([
      { bom_material_code: 'M-GOFRA', bom_layer: '5', issued_material_code: 'M-GOFRA' },
    ]);
    const r = await service.checkIssueAllowed({
      materialId: 1,
      technologyCardId: 5,
      issuedLayer: 3,
    });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.allowed).toBe(false);
      expect(r.data.blockCode).toBe('BLOCK_GOFRA_LAYER_MISMATCH');
      expect(r.data.message).toContain('EP-WMS-085');
    }
  });

  it('EP-WMS-085 e\'tibordan chetda: issuedLayer berilmasa (undefined) qavat tekshiruvi o\'tkazib yuboriladi', async () => {
    queueResult([
      { bom_material_code: 'M-GOFRA', bom_layer: '5', issued_material_code: 'M-GOFRA' },
    ]);
    const r = await service.checkIssueAllowed({ materialId: 1, technologyCardId: 5 });

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.allowed).toBe(true);
  });

  it('EP-WMS-084 BLOK: chiqarilayotgan material texkarta BOM ida yo\'q, lekin BOM boshqa materiallar bilan to\'lgan', async () => {
    // 1-chaqiruv: LEFT JOIN mos kelmadi (bom_material_code = null)
    // 2-chaqiruv: COUNT(*) — texkartada boshqa BOM qatorlari bor
    queueResult(
      [{ bom_material_code: null, bom_layer: null, issued_material_code: 'M-MAKULATURA' }],
      [{ n: 3 }],
    );
    const r = await service.checkIssueAllowed({ materialId: 1, technologyCardId: 5 });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.allowed).toBe(false);
      expect(r.data.blockCode).toBe('BLOCK_TECH_CARD_MISMATCH');
      expect(r.data.message).toContain('EP-WMS-084');
      expect(r.data.message).toContain('M-MAKULATURA');
    }
  });

  it('fail-open: texkarta BOM butunlay bo\'sh (hali to\'ldirilmagan) → chiqim bloklanmaydi', async () => {
    queueResult(
      [{ bom_material_code: null, bom_layer: null, issued_material_code: 'M-X' }],
      [{ n: 0 }],
    );
    const r = await service.checkIssueAllowed({ materialId: 1, technologyCardId: 5 });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.allowed).toBe(true);
      expect(r.data.blockCode).toBeNull();
    }
  });

  it('fail-open: DB xatosi chiqimni TO\'XTATMAYDI', async () => {
    queueResult(new Error('connection lost'));
    const r = await service.checkIssueAllowed({ materialId: 1, technologyCardId: 5 });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.allowed).toBe(true);
      expect(r.data.blockCode).toBeNull();
    }
  });
});

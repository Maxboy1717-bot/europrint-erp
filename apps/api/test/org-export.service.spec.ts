/**
 * test/org-export.service.spec.ts
 *
 * Behavioral spec for OrgExportService (Rule 22: every service needs a unit test).
 *
 * The service's only real business logic is turning a flat list of org
 * nodes (as returned by OrgExportRepository.getFlatNodes) into a rendered
 * Excel workbook (exportExcel) and PDF report (exportPdf): indentation by
 * hierarchy level, node-type label translation, "Vakant" fallback for
 * unfilled head positions, and the derived summary stats (total
 * departments / total employees / vacant count). All of that is
 * deterministic once the repository is replaced with a fake returning
 * fixed rows — no DB needed — so this is a behavioural test, not a smoke
 * test. Buffers are round-tripped back through ExcelJS / pdf-lib to assert
 * on the *actual rendered content*, not just "is defined".
 *
 * NOTE on the `exceljs` mock below: the production build compiles with swc
 * (nest-cli.json `builder: "swc"`), which always synthesizes a CJS/ESM
 * interop `default` export. This repo's ts-jest config does not enable
 * `esModuleInterop`, so `import ExcelJS from 'exceljs'` (used inside
 * org-export.service.ts, which this spec must not modify) transpiles to
 * `require('exceljs').default` — `undefined` for the real exceljs package,
 * which only exports named members. The mock below re-requires the *real*
 * exceljs module and republishes it under both the named exports and
 * `default`, so the service gets the genuine ExcelJS API either way; no
 * behaviour is stubbed.
 */
import * as zlib from 'zlib';
jest.mock('exceljs', () => {
  const actual = jest.requireActual('exceljs');
  return { ...actual, default: actual };
});
import ExcelJS from 'exceljs';
import { PDFDocument } from 'pdf-lib';
import { Ok, type Result } from '@common/result';
import { OrgExportService } from '../src/modules/org-structure/org-export.service';
import type { OrgExportRepository } from '../src/modules/org-structure/org-export.repository';

type FlatNode = {
  id: number;
  name: string;
  parentName: string | null;
  nodeType: string;
  hierarchyLevel: number;
  headUserName: string | null;
  employeeCount: number;
  tskp: string | null;
};

const FLAT_NODES: FlatNode[] = [
  {
    id: 1,
    name: 'Ishlab chiqarish',
    parentName: null,
    nodeType: 'department',
    hierarchyLevel: 0,
    headUserName: 'Aziz Karimov',
    employeeCount: 12,
    tskp: 'Yillik reja 100%',
  },
  {
    id: 2,
    name: 'Gofra sexi',
    parentName: 'Ishlab chiqarish',
    nodeType: 'section',
    hierarchyLevel: 1,
    headUserName: null,
    employeeCount: 5,
    tskp: null,
  },
];

function makeRepo(rows: FlatNode[] = FLAT_NODES): OrgExportRepository {
  return {
    getFlatNodes: async (): Promise<Result<FlatNode[]>> => Ok(rows),
  } as unknown as OrgExportRepository;
}

/**
 * pdf-lib emits page content streams as FlateDecode-compressed, WinAnsi
 * hex-string `Tj` operands. This inflates every stream and decodes the
 * hex literals back to plain text so assertions can check what will
 * actually be visible on the page (mirrors test/unit/common/pdf/hr-pdf-generator.service.spec.ts).
 */
function extractRenderedText(pdfBytes: Buffer): string {
  const raw = pdfBytes.toString('latin1');
  const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let decoded = '';
  let streamMatch: RegExpExecArray | null;
  while ((streamMatch = streamRe.exec(raw))) {
    const streamBytes = Buffer.from(streamMatch[1], 'latin1');
    let content: string;
    try {
      content = zlib.inflateSync(streamBytes).toString('latin1');
    } catch {
      content = streamBytes.toString('latin1');
    }
    const hexRe = /<([0-9A-Fa-f]+)>/g;
    let hexMatch: RegExpExecArray | null;
    while ((hexMatch = hexRe.exec(content))) {
      const hex = hexMatch[1];
      let word = '';
      for (let i = 0; i + 1 < hex.length; i += 2) {
        word += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
      }
      decoded += word + '\n';
    }
  }
  return decoded;
}

describe('OrgExportService', () => {
  it('class is defined and constructible', () => {
    expect(OrgExportService).toBeDefined();
    const svc = new OrgExportService(makeRepo());
    expect(svc).toBeInstanceOf(OrgExportService);
  });

  describe('exportExcel', () => {
    it('renders a workbook with the org sheet + a statistics summary sheet', async () => {
      const svc = new OrgExportService(makeRepo());
      const result = await svc.exportExcel();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const buf = result.data as unknown as Buffer;
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.length).toBeGreaterThan(0);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buf);

      const ws = workbook.getWorksheet('Tashkiliy Tuzilma');
      expect(ws).toBeDefined();
      if (!ws) return;

      // Column order from ws.columns in the service: id, name, parentName,
      // nodeType, hierarchyLevel, headUserName, employeeCount, tskp.
      // A round-tripped (write→load) workbook loses the string `key`→column
      // mapping, so cells are addressed by their 1-based column index.
      const NAME_COL = 2;
      const NODE_TYPE_COL = 4;
      const HEAD_USER_COL = 6;
      const EMPLOYEE_COUNT_COL = 7;
      const TSKP_COL = 8;

      // Header row
      expect(ws.getRow(1).getCell(NAME_COL).value).toBe("Bo'lim / Lavozim");

      // Row 1 (level 0) — no indentation, node-type label translated.
      const row1 = ws.getRow(2);
      expect(row1.getCell(NAME_COL).value).toBe('Ishlab chiqarish');
      expect(row1.getCell(NODE_TYPE_COL).value).toBe("Bo'lim");
      expect(row1.getCell(HEAD_USER_COL).value).toBe('Aziz Karimov');
      expect(row1.getCell(EMPLOYEE_COUNT_COL).value).toBe(12);

      // Row 2 (level 1) — indented by 2 spaces, section label, vacant head.
      const row2 = ws.getRow(3);
      expect(row2.getCell(NAME_COL).value).toBe('  Gofra sexi');
      expect(row2.getCell(NODE_TYPE_COL).value).toBe('Sektor');
      expect(row2.getCell(HEAD_USER_COL).value).toBe('Vakant');
      expect(row2.getCell(TSKP_COL).value).toBe('—');

      const summaryWs = workbook.getWorksheet('Statistika');
      expect(summaryWs).toBeDefined();
      if (!summaryWs) return;
      const VALUE_COL = 2;
      expect(summaryWs.getRow(2).getCell(VALUE_COL).value).toBe(2); // Jami bo'limlar
      expect(summaryWs.getRow(3).getCell(VALUE_COL).value).toBe(17); // Jami xodimlar (12+5)
      expect(summaryWs.getRow(4).getCell(VALUE_COL).value).toBe(1); // Vakant lavozimlar
    });

    it('falls back to an empty node list when the repository reports failure', async () => {
      const repo = {
        getFlatNodes: async () => ({ ok: false, error: { code: 'INTERNAL', message: 'db down' } }),
      } as unknown as OrgExportRepository;
      const svc = new OrgExportService(repo);

      const result = await svc.exportExcel();
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(result.data as unknown as Buffer);
      const summaryWs = workbook.getWorksheet('Statistika');
      expect(summaryWs?.getRow(2).getCell(2).value).toBe(0);
    });
  });

  describe('exportPdf', () => {
    it('returns a valid A4-landscape PDF buffer with the org rows rendered', async () => {
      const svc = new OrgExportService(makeRepo());
      const result = await svc.exportPdf();

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const buf = result.data;
      expect(Buffer.isBuffer(buf)).toBe(true);
      expect(buf.subarray(0, 5).toString('latin1')).toBe('%PDF-');

      const reloaded = await PDFDocument.load(buf);
      expect(reloaded.getPageCount()).toBeGreaterThanOrEqual(1);
      const page = reloaded.getPage(0);
      expect(page.getWidth()).toBeCloseTo(841.89, 0);
      expect(page.getHeight()).toBeCloseTo(595.28, 0);

      const text = extractRenderedText(buf);
      expect(text).toContain('Ishlab chiqarish');
      expect(text).toContain('Gofra sexi');
      expect(text).toContain('Vakant');
      expect(text).toContain("Bo'lim");
      expect(text).toContain('Sektor');
    });

    it('renders "Jami bo\'limlar" count matching the number of rows', async () => {
      const svc = new OrgExportService(makeRepo());
      const result = await svc.exportPdf();
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const text = extractRenderedText(result.data);
      expect(text).toContain('Jami bo');
      expect(text).toContain(String(FLAT_NODES.length));
    });
  });
});

/**
 * @module DocumentPrintView
 * @description P1-11 "PDF ko'rinishida ochish" — a clean, chrome-free print/PDF view for a
 * document or spreadsheet, rendered OUTSIDE the AppShell (top-level route) so window.print()
 * (→ the browser's "Save as PDF") produces a proper document, not a screenshot of the app. Reuses
 * the read-only editor components + DocumentPaper + logo + tier watermark; logs a 'print' access
 * (decision #4/#7) and is leadership-gated (decision #5, same PRINT_ROLES as the editor button).
 * The top bar is print:hidden so only the paper reaches the PDF.
 */

import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Printer, ArrowLeft } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { tLabel } from '@/lib/i18n/tLabel';
import { RichTextEditor } from '@/components/document-control/RichTextEditor';
import { SpreadsheetGrid } from '@/components/document-control/SpreadsheetGrid';
import { DocumentWatermark } from '@/components/document-control/DocumentWatermark';
import { DocumentLogo } from '@/components/document-control/DocumentLogo';
import { parseWorkbook } from '@/lib/spreadsheetWorkbook';
import type { Cells } from '@/lib/spreadsheet';

const PRINT_ROLES = new Set(['admin', 'super_admin', 'director', 'manager', 'hr_manager', 'finance_manager', 'production_manager']);

interface DocRow { id: string; title: string; content: Record<string, unknown>; sensitivity_tier: string }
interface SheetRow { id: string; title: string; cells: Cells; sensitivity_tier: string }

export default function DocumentPrintView() {
  const params = useParams();
  const id = params.id as string;
  const [location, navigate] = useLocation();
  const isSheet = location.includes('/spreadsheets/');
  const { user } = useAuth();
  const canPrint = PRINT_ROLES.has((user?.role ?? '').toLowerCase());

  const endpoint = isSheet ? `/api/erp-spreadsheets/${id}` : `/api/erp-documents/${id}`;
  const q = useQuery<DocRow & SheetRow>({
    queryKey: [endpoint],
    queryFn: () => apiRequest<DocRow & SheetRow>('GET', endpoint),
    enabled: !!id && canPrint,
  });

  if (!canPrint) {
    return <div className="p-10 text-center text-[var(--ep-muted)]">{tLabel('documents.printDenied', 'Chop etish rad etildi')}</div>;
  }
  if (!q.data) {
    return <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--ep-muted)]" /></div>;
  }

  const tier = q.data.sensitivity_tier;
  const wb = isSheet ? parseWorkbook(q.data.cells) : null;

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-800">
      {/* Top bar — hidden from the print/PDF output */}
      <div className="print:hidden sticky top-0 z-10 flex items-center gap-2 px-4 py-2 border-b border-[var(--ep-border)] bg-[var(--ep-surface)]">
        <button onClick={() => navigate(isSheet ? `/spreadsheets/${id}` : `/documents/${id}`)}
          className="p-2 rounded-lg text-[var(--ep-muted)] hover:bg-[var(--ep-bg)]" title={tLabel('documents.back', 'Orqaga')}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="flex-1 font-medium text-[var(--ep-text)] truncate">{q.data.title}</span>
        <button onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[var(--ep-primary)] text-white text-sm font-medium hover:opacity-90">
          <Printer className="w-4 h-4" />{tLabel('documents.printPdf', 'Chop etish / PDF saqlash')}
        </button>
      </div>

      <div className="py-6 px-3">
        {isSheet && wb ? (
          <div className="bg-white mx-auto w-full max-w-[1000px] rounded-sm shadow-sm p-8 print:shadow-none print:p-0">
            <div className="mb-4 flex justify-start"><DocumentLogo /></div>
            <h1 className="text-lg font-semibold mb-3">{q.data.title}</h1>
            <DocumentWatermark tier={tier}>
              <SpreadsheetGrid cells={wb.sheets[wb.active] ?? {}} editable={false} />
            </DocumentWatermark>
          </div>
        ) : (
          <RichTextEditor value={q.data.content} editable={false} tier={tier} contentKey={`print:${id}`} />
        )}
      </div>
    </div>
  );
}

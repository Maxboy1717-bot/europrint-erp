/**
 * @module DocumentFormatChoice
 * @description "Yangi hujjat" → format-selection screen (item #1). Lightweight routing screen:
 * picks WHICH editor to launch (Matn = existing TipTap/erp_documents; Jadval = spreadsheet/
 * erp_spreadsheets, Phase B). Not a new document type — just decides the target editor/table.
 * "Jadval" is disabled until Phase B lands its route (no dead link).
 */

import { useLocation } from 'wouter';
import { FileText, Table2, ArrowLeft } from 'lucide-react';
import { tLabel } from '@/lib/i18n/tLabel';

function Card({ icon, title, desc, onClick, disabled, badge }: {
  icon: React.ReactNode; title: string; desc: string; onClick?: () => void; disabled?: boolean; badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group flex flex-col items-start gap-3 p-6 rounded-xl border border-[var(--ep-border)] bg-[var(--ep-surface)] text-left transition-colors hover:border-[var(--ep-blue)] hover:bg-[var(--ep-bg)] disabled:opacity-55 disabled:hover:border-[var(--ep-border)] disabled:hover:bg-[var(--ep-surface)] disabled:cursor-not-allowed w-full"
    >
      <div className="w-12 h-12 rounded-lg bg-[var(--ep-blue)]/10 flex items-center justify-center text-[var(--ep-blue)]">{icon}</div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-[var(--ep-text)]">{title}</span>
          {badge && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--ep-bg)] text-[var(--ep-muted)] border border-[var(--ep-border)]">{badge}</span>}
        </div>
        <p className="text-[13px] text-[var(--ep-muted)] mt-0.5">{desc}</p>
      </div>
    </button>
  );
}

export default function DocumentFormatChoice() {
  const [, navigate] = useLocation();
  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => navigate('/documents')} className="p-2 rounded-lg text-[var(--ep-muted)] hover:bg-[var(--ep-bg)]" title={tLabel('documents.back', 'Orqaga')}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-semibold text-[var(--ep-text)]">{tLabel('documents.newDocument', 'Yangi hujjat')}</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          icon={<FileText className="w-6 h-6" />}
          title={tLabel('documents.textDoc', 'Matn hujjati')}
          desc={tLabel('documents.textDocDesc', 'Word uslubidagi matn muharriri')}
          onClick={() => navigate('/documents/matn')}
        />
        <Card
          icon={<Table2 className="w-6 h-6" />}
          title={tLabel('documents.spreadsheet', 'Jadval')}
          desc={tLabel('documents.spreadsheetDesc', 'Excel uslubidagi jadval muharriri')}
          disabled
          badge={tLabel('documents.comingSoon', 'Tez orada')}
        />
      </div>
    </div>
  );
}

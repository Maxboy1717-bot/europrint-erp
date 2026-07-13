/**
 * @module ErpSpreadsheetEditor
 * @description Jadval yaratish/tahrirlash (Phase B-3). Mirrors the doc editor's chrome (inline
 * title + tier badge + save-status + naming modal + gated print) but hosts the custom
 * SpreadsheetGrid instead of TipTap. Saves cells (JSONB) to /api/erp-spreadsheets. Tier-gated
 * watermark over the grid; downloads blocked globally; view/print logged server-side.
 * CC-surfacing button is added in B-4.
 */

import { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, ArrowLeft, Check, Printer } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { tLabel } from '@/lib/i18n/tLabel';
import { SpreadsheetGrid } from '@/components/document-control/SpreadsheetGrid';
import { DocumentWatermark } from '@/components/document-control/DocumentWatermark';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Cells } from '@/lib/spreadsheet';

interface ErpSheet { id: string; title: string; cells: Cells; sensitivity_tier: string; version: number; }

const TIERS = [
  { value: 'oddiy', label: tLabel('documents.tierOddiy', 'Oddiy') },
  { value: 'maxfiy', label: tLabel('documents.tierMaxfiy', 'Maxfiy') },
  { value: 'juda-maxfiy', label: tLabel('documents.tierJudaMaxfiy', 'Juda maxfiy') },
];
const TIER_PILL: Record<string, string> = {
  oddiy: 'border-slate-200 text-slate-600 bg-slate-50',
  maxfiy: 'border-amber-200 text-amber-700 bg-amber-50',
  'juda-maxfiy': 'border-red-200 text-red-700 bg-red-50',
};
const PRINT_ROLES = new Set(['admin', 'super_admin', 'director', 'manager', 'hr_manager', 'finance_manager', 'production_manager']);

export default function ErpSpreadsheetEditor() {
  const params = useParams();
  const id = params.id as string | undefined;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const canPrint = PRINT_ROLES.has((user?.role ?? '').toLowerCase());

  const [title, setTitle] = useState('');
  const [tier, setTier] = useState('oddiy');
  const [cells, setCells] = useState<Cells>({});
  // Always-current mirror of `cells`. The active cell commits on blur (fires just before the
  // Save button's click), so reading this ref at save time captures the last edit even when the
  // user clicks Save without pressing Enter first — setCells alone would be one render stale.
  const cellsRef = useRef<Cells>({});
  const [dirty, setDirty] = useState(false);
  const [showName, setShowName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showPrint, setShowPrint] = useState(false);
  const [printReason, setPrintReason] = useState('');

  const sheetQ = useQuery<ErpSheet>({
    queryKey: [`/api/erp-spreadsheets/${id}`],
    queryFn: () => apiRequest<ErpSheet>('GET', `/api/erp-spreadsheets/${id}`),
    enabled: !!id,
  });
  useEffect(() => {
    if (sheetQ.data) { setTitle(sheetQ.data.title); setTier(sheetQ.data.sensitivity_tier); const c = sheetQ.data.cells ?? {}; setCells(c); cellsRef.current = c; setDirty(false); }
  }, [sheetQ.data]);

  const save = useMutation({
    mutationFn: async (finalTitle: string) => {
      const payload = { title: finalTitle.trim(), cells: cellsRef.current, sensitivityTier: tier };
      return id ? apiRequest<ErpSheet>('PATCH', `/api/erp-spreadsheets/${id}`, payload) : apiRequest<ErpSheet>('POST', '/api/erp-spreadsheets', payload);
    },
    onSuccess: (doc) => {
      toast({ title: tLabel('documents.saved', 'Saqlandi'), description: title.trim() });
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['/api/erp-spreadsheets'] });
      if (!id && doc?.id) navigate(`/spreadsheets/${doc.id}`);
    },
    onError: () => toast({ title: tLabel('common.error', 'Xatolik'), variant: 'destructive' }),
  });

  const doSave = (name?: string) => {
    const finalTitle = (name ?? title).trim();
    if (!finalTitle) return;
    if (name && name.trim() !== title) setTitle(name.trim());
    save.mutate(finalTitle);
  };
  const handleSaveClick = () => { if (!id) { setNameInput(title.trim()); setShowName(true); return; } doSave(); };

  const print = useMutation({
    mutationFn: (reason: string) => apiRequest('POST', `/api/erp-spreadsheets/${id}/print`, { reason }),
    onSuccess: () => { setShowPrint(false); setPrintReason(''); setTimeout(() => window.print(), 100); },
    onError: () => toast({ title: tLabel('common.error', 'Xatolik'), description: tLabel('documents.printDenied', 'Chop etish rad etildi'), variant: 'destructive' }),
  });

  const statusText = save.isPending
    ? tLabel('documents.saving', 'Saqlanmoqda…')
    : dirty ? tLabel('documents.unsaved', "Saqlanmagan o'zgarishlar")
      : id ? tLabel('documents.allSaved', "Barcha o'zgarishlar saqlangan") : '';

  if (id && sheetQ.isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--ep-muted)]" /></div>;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--ep-border)] bg-[var(--ep-surface)]">
        <button onClick={() => navigate('/documents')} className="p-2 rounded-lg text-[var(--ep-muted)] hover:bg-[var(--ep-bg)] shrink-0" title={tLabel('documents.back', 'Orqaga')}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <input value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }} placeholder={tLabel('documents.sheetTitlePlaceholder', 'Jadval nomi')}
            className="w-full text-[17px] font-medium text-[var(--ep-text)] bg-transparent outline-none border-b border-transparent hover:border-[var(--ep-border)] focus:border-[var(--ep-blue)] transition-colors py-0.5" />
          <div className="flex items-center gap-2 mt-0.5">
            <select value={tier} onChange={(e) => { setTier(e.target.value); setDirty(true); }} title={tLabel('documents.tierLabel', 'Maxfiylik darajasi')}
              className={`text-[11px] font-medium rounded-full border px-2 py-0.5 outline-none cursor-pointer ${TIER_PILL[tier] ?? TIER_PILL.oddiy}`}>
              {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <span className="text-[11px] text-[var(--ep-muted)] inline-flex items-center gap-1">
              {statusText && !dirty && !save.isPending && <Check className="w-3 h-3 text-[var(--ep-green)]" />}{statusText}
            </span>
          </div>
        </div>
        {id && canPrint && (
          <button onClick={() => setShowPrint(true)} className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[var(--ep-border)] text-[var(--ep-text)] hover:bg-[var(--ep-bg)] shrink-0" title={tLabel('documents.print', 'Chop etish')}>
            <Printer className="w-4 h-4" />
          </button>
        )}
        <button onClick={handleSaveClick} disabled={save.isPending} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[var(--ep-primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 shrink-0">
          {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{tLabel('documents.save', 'Saqlash')}
        </button>
      </div>

      <div className="p-4">
        <DocumentWatermark tier={tier}>
          <SpreadsheetGrid cells={cells} onChange={(c) => { cellsRef.current = c; setCells(c); setDirty(true); }} />
        </DocumentWatermark>
      </div>

      <Dialog open={showName} onOpenChange={setShowName}>
        <DialogContent className="max-w-sm p-6">
          <DialogHeader><DialogTitle>{tLabel('documents.nameDocument', 'Hujjat nomini kiriting')}</DialogTitle></DialogHeader>
          <input autoFocus value={nameInput} onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && nameInput.trim()) { setShowName(false); doSave(nameInput); } }}
            placeholder={tLabel('documents.sheetTitlePlaceholder', 'Jadval nomi')}
            className="w-full h-10 rounded-lg border border-[var(--ep-border)] bg-[var(--ep-surface)] px-3 text-sm outline-none focus:border-[var(--ep-blue)]" />
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setShowName(false)}>{tLabel('documents.cancel', 'Bekor')}</Button>
            <Button onClick={() => { if (nameInput.trim()) { setShowName(false); doSave(nameInput); } }} disabled={!nameInput.trim()}>{tLabel('documents.save', 'Saqlash')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPrint} onOpenChange={setShowPrint}>
        <DialogContent className="max-w-sm p-6">
          <DialogHeader><DialogTitle>{tLabel('documents.print', 'Chop etish')}</DialogTitle></DialogHeader>
          <p className="text-xs text-[var(--ep-muted)] -mt-1">{tLabel('documents.printReasonHint', 'Chop etish sababi majburiy va jurnalga yoziladi.')}</p>
          <input autoFocus value={printReason} onChange={(e) => setPrintReason(e.target.value)}
            placeholder={tLabel('documents.printReason', 'Chop etish sababi (kamida 3 belgi)')}
            className="w-full h-10 rounded-lg border border-[var(--ep-border)] bg-[var(--ep-surface)] px-3 text-sm outline-none focus:border-[var(--ep-blue)]" />
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setShowPrint(false)}>{tLabel('documents.cancel', 'Bekor')}</Button>
            <Button onClick={() => printReason.trim().length >= 3 && print.mutate(printReason.trim())} disabled={printReason.trim().length < 3 || print.isPending} className="gap-1.5">
              {print.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}{tLabel('documents.print', 'Chop etish')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * @module SendToCcModal
 * @description "CC orqali yuborish" (STEP 3.6a) — from an erkin hujjat, pick an employee and
 * send it into their CC inbox (+ Tizim chat ping) via POST /api/cc/documents/from-erp. The
 * doc itself stays editable in /documents. Reuses /api/chat/employees for the people picker.
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, Send, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { tLabel } from '@/lib/i18n/tLabel';

interface Employee { id: number; fullName: string; employeeId?: string | null; departmentName?: string | null; }

export function SendToCcModal({ erpDocumentId, documentType = 'erp_document', open, onClose }: {
  erpDocumentId: string; documentType?: 'erp_document' | 'erp_spreadsheet'; open: boolean; onClose: () => void;
}) {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Employee | null>(null);

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['/api/chat/employees'],
    queryFn: () => apiRequest('GET', '/api/chat/employees').then((r: unknown) => (Array.isArray(r) ? r as Employee[] : [])),
    enabled: open,
  });

  const filtered = search
    ? (Array.isArray(employees) ? employees : []).filter((e) => e.fullName.toLowerCase().includes(search.toLowerCase()))
    : employees;

  const send = useMutation({
    mutationFn: () => apiRequest('POST', '/api/cc/documents/from-erp', { erpDocumentId, documentType, targetUserId: selected!.id }),
    onSuccess: () => {
      toast({ title: tLabel('documents.sentToCc', 'CC orqali yuborildi'), description: selected?.fullName });
      setSelected(null); setSearch(''); onClose();
    },
    onError: () => toast({ title: tLabel('common.error', 'Xatolik'), variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle>{tLabel('documents.sendViaCc', 'CC orqali yuborish')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ep-muted)]" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tLabel('documents.searchEmployee', 'Xodimni qidirish...')} className="pl-8 h-9 text-sm" />
          </div>
          <div className="max-h-56 overflow-y-auto space-y-1 border border-[var(--ep-border)] rounded-lg p-1">
            {(Array.isArray(filtered) ? filtered : []).slice(0, 30).map((emp) => (
              <button
                key={emp.id}
                onClick={() => setSelected(emp)}
                className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left text-sm transition-colors ${selected?.id === emp.id ? 'bg-[var(--ep-blue)]/10' : 'hover:bg-[var(--ep-bg)]'}`}
              >
                <div className="w-6 h-6 rounded-full bg-[var(--ep-blue)]/10 flex items-center justify-center text-[10px] font-bold text-[var(--ep-blue)]">{emp.fullName[0]}</div>
                <span className="flex-1 min-w-0 truncate">{emp.fullName}</span>
                {selected?.id === emp.id && <span className="text-[var(--ep-blue)] text-xs">✓</span>}
              </button>
            ))}
            {filtered.length === 0 && <p className="text-sm text-[var(--ep-muted)] text-center py-4">{tLabel('documents.noEmployee', 'Xodim topilmadi')}</p>}
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">{tLabel('documents.cancel', 'Bekor')}</Button>
            <Button onClick={() => selected && send.mutate()} disabled={!selected || send.isPending} className="flex-1 gap-1.5">
              {send.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {tLabel('documents.send', 'Yuborish')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

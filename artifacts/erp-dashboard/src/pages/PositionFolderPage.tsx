/**
 * @module PositionFolderPage
 * @description Per-position virtual folder — admin manages docs/videos/tests/links
 *   that every employee in that position must read/complete.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/lib/i18n';

interface FolderContent {
  id: number;
  org_function_id: number;
  content_type: 'document' | 'video' | 'test' | 'link' | 'policy' | 'training';
  title: string;
  description: string | null;
  url: string;
  sort_order: number;
  is_mandatory: boolean;
}

interface OrgFunction { id: number; position_name: string; }

const CONTENT_TYPES = [
  { value: 'document', icon: '📄', label: 'Hujjat' },
  { value: 'video',    icon: '🎥', label: 'Video' },
  { value: 'test',     icon: '✅', label: 'Test' },
  { value: 'link',     icon: '🔗', label: 'Havola' },
  { value: 'policy',   icon: '⚖️', label: 'Siyosat' },
  { value: 'training', icon: '🎓', label: 'Trening' },
] as const;

export default function PositionFolderPage() {
  const { t } = useTranslation('common');
  const qc = useQueryClient();
  const [selectedFn, setSelectedFn] = useState<number | null>(null);
  const [editing, setEditing] = useState<Partial<FolderContent> | null>(null);

  const { data: functions } = useQuery<OrgFunction[]>({
    queryKey: ['/api/org-structure/functions'],
    queryFn: () => apiRequest<OrgFunction[]>('GET', '/api/org-structure/functions'),
  });

  const { data: contents } = useQuery<FolderContent[]>({
    queryKey: ['/api/org-structure/position-folder', selectedFn],
    queryFn: () => apiRequest<FolderContent[]>('GET', `/api/org-structure/position-folder/${selectedFn}`),
    enabled: selectedFn !== null,
  });

  const create = useMutation({
    mutationFn: (p: Partial<FolderContent>) => apiRequest('POST', '/api/org-structure/position-folder', p),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['/api/org-structure/position-folder'] }); setEditing(null); },
  });

  const update = useMutation({
    mutationFn: ({ id, ...p }: Partial<FolderContent> & { id: number }) =>
      apiRequest('PATCH', `/api/org-structure/position-folder/${id}`, p),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['/api/org-structure/position-folder'] }); setEditing(null); },
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/org-structure/position-folder/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['/api/org-structure/position-folder'] }),
  });

  const fnList = Array.isArray(functions) ? functions : [];
  const cList = Array.isArray(contents) ? contents : [];
  const grouped = CONTENT_TYPES.map(ct => ({ ...ct, items: cList.filter(c => c.content_type === ct.value) }));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('lavozim-papkasi') || 'Lavozim Papkasi (Virtual)'}</h1>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4 border rounded-lg p-4 bg-card">
          <h2 className="font-semibold mb-3">{t('lavozim') || 'Lavozim'}</h2>
          <select
            className="w-full border rounded p-2"
            value={selectedFn ?? ''}
            onChange={(e) => setSelectedFn(e.target.value ? parseInt(e.target.value, 10) : null)}
          >
            <option value="">{t("positionSelect")}</option>
            {fnList.map((f) => (
              <option key={f.id} value={f.id}>{f.position_name}</option>
            ))}
          </select>
          {selectedFn && (
            <button
              className="mt-4 w-full bg-primary text-primary-foreground rounded p-2"
              onClick={() => setEditing({ org_function_id: selectedFn, content_type: 'document', sort_order: 0, is_mandatory: false })}
            >
              + {t('content-add') || 'Yangi material qoʻshish'}
            </button>
          )}
        </div>

        <div className="col-span-8 border rounded-lg p-4 bg-card space-y-4">
          {selectedFn === null ? (
            <p className="text-muted-foreground text-sm">{t('lavozim-tanlang') || 'Lavozim tanlang →'}</p>
          ) : grouped.map(g => g.items.length > 0 && (
            <div key={g.value}>
              <h3 className="font-semibold mb-2">{g.icon} {g.label} ({g.items.length})</h3>
              <div className="space-y-1">
                {g.items.map(c => (
                  <div key={c.id} className="border rounded p-2 flex items-center justify-between hover:bg-muted/40">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{c.title}{c.is_mandatory && <span className="ml-2 text-xs text-red-600">★ majburiy</span>}</p>
                      <a href={c.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">{c.url}</a>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-xs text-blue-600" onClick={() => setEditing(c)}>Tahrir</button>
                      <button className="text-xs text-red-600" onClick={() => remove.mutate(c.id)}>{t("positionDelete")}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-xl">
            <h3 className="text-lg font-semibold mb-4">{editing.id ? 'Tahrirlash' : 'Yangi material'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs">Turi</label>
                <select className="w-full border rounded p-2" value={editing.content_type ?? 'document'}
                  onChange={(e) => setEditing({ ...editing, content_type: e.target.value as FolderContent['content_type'] })}>
                  {CONTENT_TYPES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs">Sarlavha</label>
                <input className="w-full border rounded p-2" value={editing.title ?? ''}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div>
                <label className="text-xs">{t("positionUrlAddress")}</label>
                <input className="w-full border rounded p-2" value={editing.url ?? ''}
                  onChange={(e) => setEditing({ ...editing, url: e.target.value })} />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.is_mandatory ?? false}
                    onChange={(e) => setEditing({ ...editing, is_mandatory: e.target.checked })} />
                  Majburiy (xodim oʻqishi shart)
                </label>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <button className="px-4 py-2 border rounded" onClick={() => setEditing(null)}>{t("positionCancel")}</button>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded"
                  onClick={() => editing.id ? update.mutate({ id: editing.id, ...editing }) : create.mutate(editing)}>
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @module HRQuestionBankAdmin
 * @description Admin UI for HR question bank. List + add + edit + delete.
 *   Per-position question banks (Tool/IQ/Leadership/Origin/Replication).
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/lib/i18n';

interface Question {
  id: number;
  org_function_id: number | null;
  category: string;
  question_uz: string;
  question_ru: string | null;
  expected_keywords: string[];
  difficulty: number;
  lang: string;
  is_active: boolean;
}

interface OrgFunction {
  id: number;
  position_name: string;
  department_id: number;
}

const CATEGORIES = ['technical', 'behavioral', 'iq', 'leadership', 'tool', 'origin', 'replication'] as const;

export default function HRQuestionBankAdmin() {
  const { t } = useTranslation('common');
  const qc = useQueryClient();
  const [selectedFn, setSelectedFn] = useState<number | null>(null);
  const [editing, setEditing] = useState<Partial<Question> | null>(null);

  const { data: functions } = useQuery<OrgFunction[]>({
    queryKey: ['/api/org-structure/functions'],
    queryFn: () => apiRequest<OrgFunction[]>('GET', '/api/org-structure/functions'),
  });

  const { data: questions } = useQuery<Question[]>({
    queryKey: ['/api/hr/question-bank', selectedFn],
    queryFn: () => apiRequest<Question[]>('GET', `/api/hr/question-bank${selectedFn ? `?org_function_id=${selectedFn}` : ''}`),
    enabled: selectedFn !== null,
  });

  const create = useMutation({
    mutationFn: (payload: Partial<Question>) => apiRequest('POST', '/api/hr/question-bank', payload),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['/api/hr/question-bank'] }); setEditing(null); },
  });

  const update = useMutation({
    mutationFn: ({ id, ...payload }: Partial<Question> & { id: number }) =>
      apiRequest('PATCH', `/api/hr/question-bank/${id}`, payload),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['/api/hr/question-bank'] }); setEditing(null); },
  });

  const remove = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/hr/question-bank/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['/api/hr/question-bank'] }),
  });

  const fnList = Array.isArray(functions) ? functions : [];
  const qList = Array.isArray(questions) ? questions : [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('hrQuestionBankAdmin') || 'HR Savol Banki — Admin'}</h1>

      <div className="grid grid-cols-12 gap-4">
        {/* Left: position picker */}
        <div className="col-span-4 border rounded-lg p-4 bg-card">
          <h2 className="font-semibold mb-3">{t('lavozimni-tanlang') || 'Lavozimni tanlang'}</h2>
          <select
            className="w-full border rounded p-2"
            value={selectedFn ?? ''}
            onChange={(e) => setSelectedFn(e.target.value ? parseInt(e.target.value, 10) : null)}
          >
            <option value="">— tanlang —</option>
            {fnList.map((f) => (
              <option key={f.id} value={f.id}>{f.position_name}</option>
            ))}
          </select>
          {selectedFn && (
            <button
              className="mt-4 w-full bg-primary text-primary-foreground rounded p-2"
              onClick={() => setEditing({ org_function_id: selectedFn, category: 'technical', difficulty: 3, lang: 'uz', expected_keywords: [] })}
            >
              + {t('yangi-savol') || 'Yangi savol qoʻshish'}
            </button>
          )}
        </div>

        {/* Right: questions list */}
        <div className="col-span-8 border rounded-lg p-4 bg-card">
          <h2 className="font-semibold mb-3">
            {t('savollar') || 'Savollar'} ({qList.length})
          </h2>
          {selectedFn === null ? (
            <p className="text-muted-foreground text-sm">{t('lavozim-tanlang') || 'Lavozim tanlang →'}</p>
          ) : qList.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('savollar-yoq') || 'Bu lavozim uchun savol yoʻq'}</p>
          ) : (
            <div className="space-y-2">
              {qList.map((q) => (
                <div key={q.id} className="border rounded p-3 hover:bg-muted/40">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {q.category} · D{q.difficulty}
                    </span>
                    <div className="flex gap-1">
                      <button className="text-xs text-blue-600" onClick={() => setEditing(q)}>{t('edit') || 'Tahrirlash'}</button>
                      <button className="text-xs text-red-600 ml-2" onClick={() => remove.mutate(q.id)}>{t('delete') || 'Oʻchirish'}</button>
                    </div>
                  </div>
                  <p className="text-sm">{q.question_uz}</p>
                  {q.expected_keywords?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Kalit soʻzlar: {q.expected_keywords.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">
              {editing.id ? (t('savolni-tahrirlash') || 'Savolni tahrirlash') : (t('yangi-savol') || 'Yangi savol')}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs">{t('category') || 'Kategoriya'}</label>
                <select
                  className="w-full border rounded p-2"
                  value={editing.category ?? 'technical'}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs">{t('savol-uz') || 'Savol (UZ)'}</label>
                <textarea
                  className="w-full border rounded p-2"
                  rows={3}
                  value={editing.question_uz ?? ''}
                  onChange={(e) => setEditing({ ...editing, question_uz: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs">{t('expected-keywords') || 'Kutilgan kalit soʻzlar (vergul bilan)'}</label>
                <input
                  className="w-full border rounded p-2"
                  value={(editing.expected_keywords ?? []).join(', ')}
                  onChange={(e) => setEditing({ ...editing, expected_keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                />
              </div>
              <div>
                <label className="text-xs">{t('difficulty') || 'Qiyinlik (1-5)'}</label>
                <input
                  type="number" min={1} max={5}
                  className="w-full border rounded p-2"
                  value={editing.difficulty ?? 3}
                  onChange={(e) => setEditing({ ...editing, difficulty: parseInt(e.target.value, 10) })}
                />
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <button className="px-4 py-2 border rounded" onClick={() => setEditing(null)}>{t('cancel') || 'Bekor'}</button>
                <button
                  className="px-4 py-2 bg-primary text-primary-foreground rounded"
                  onClick={() => editing.id
                    ? update.mutate({ id: editing.id, ...editing })
                    : create.mutate(editing)
                  }
                >
                  {t('save') || 'Saqlash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

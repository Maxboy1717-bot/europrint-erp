/**
 * @module DocumentRoutingAdmin
 * @description Admin UI for document workflow routing rules.
 *   For each document_type (avans, tatil, etc.) define the horizontal
 *   approval chain (which functions/departments to involve after vertical).
 *
 *   Vertical chain is auto-derived from org-tree at runtime.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from '@/lib/i18n';

interface RoutingRule {
  id: number;
  document_type: string;
  source_org_function_id: number | null;
  target_org_function_id: number | null;
  target_org_department_id: number | null;
  step_order: number;
  requires_signature: boolean;
  reject_requires_reason: boolean;
}

interface OrgFunction { id: number; position_name: string; }
interface OrgDepartment { id: number; name: string; }

const DOC_TYPES = [
  'avans_ariza',
  'tatil_ariza',
  'material_request',
  'asbob_request',
  'kasallik',
  'ishdan_chiqish',
  'transfer',
  'training_request',
];

export default function DocumentRoutingAdmin() {
  const { t } = useTranslation('common');
  const qc = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>(DOC_TYPES[0]);
  const [editing, setEditing] = useState<Partial<RoutingRule> | null>(null);

  const { data: rules } = useQuery<RoutingRule[]>({
    queryKey: ['/api/hr/document-workflow/rules', selectedType],
    queryFn: () => apiRequest<RoutingRule[]>('GET', `/api/hr/document-workflow/rules?document_type=${selectedType}`),
  });

  const { data: functions } = useQuery<OrgFunction[]>({
    queryKey: ['/api/org-structure/functions'],
    queryFn: () => apiRequest<OrgFunction[]>('GET', '/api/org-structure/functions'),
  });

  const { data: depts } = useQuery<OrgDepartment[]>({
    queryKey: ['/api/org-structure/departments'],
    queryFn: () => apiRequest<OrgDepartment[]>('GET', '/api/org-structure/departments'),
  });

  const ruleList = Array.isArray(rules) ? rules : [];
  const fnList = Array.isArray(functions) ? functions : [];
  const deptList = Array.isArray(depts) ? depts : [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('document-routing-admin') || 'Hujjat Yoʻnaltirish Qoidalari'}</h1>

      <div className="mb-4 flex gap-2">
        {DOC_TYPES.map(t => (
          <button key={t}
            className={`px-3 py-1.5 rounded text-sm ${selectedType === t ? 'bg-primary text-primary-foreground' : 'border'}`}
            onClick={() => setSelectedType(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="border rounded-lg p-4 bg-card">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">
            {selectedType} — gorizontal qadamlar ({ruleList.length})
          </h2>
          <button
            className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm"
            onClick={() => setEditing({
              document_type: selectedType,
              step_order: ruleList.length + 1,
              requires_signature: true,
              reject_requires_reason: true,
            })}>
            + Qadam qoʻshish
          </button>
        </div>

        <div className="space-y-2">
          {ruleList.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Bu hujjat turi uchun qoidalar yoʻq. Vertikal yoʻl (rahbar zanjiri) avtomatik hisoblanadi.
            </p>
          ) : ruleList.map(r => {
            const fn = fnList.find(f => f.id === r.target_org_function_id);
            const dept = deptList.find(d => d.id === r.target_org_department_id);
            return (
              <div key={r.id} className="border rounded p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">Qadam #{r.step_order}</span>
                  <p className="text-sm mt-1">
                    → {fn?.position_name ?? dept?.name ?? '(belgilanmagan)'}
                  </p>
                  {r.requires_signature && <span className="text-xs text-amber-600">{t("docRoutSignRequired")}</span>}
                </div>
                <button className="text-xs text-blue-600" onClick={() => setEditing(r)}>Tahrir</button>
              </div>
            );
          })}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-xl">
            <h3 className="text-lg font-semibold mb-4">
              {editing.id ? 'Qadamni tahrirlash' : 'Yangi qadam'}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs">{t("docRoutTargetPosition")}</label>
                <select className="w-full border rounded p-2"
                  value={editing.target_org_function_id ?? ''}
                  onChange={(e) => setEditing({ ...editing, target_org_function_id: e.target.value ? parseInt(e.target.value, 10) : null })}>
                  <option value="">— biror —</option>
                  {fnList.map(f => <option key={f.id} value={f.id}>{f.position_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs">{t("docRoutOrTargetDept")}</label>
                <select className="w-full border rounded p-2"
                  value={editing.target_org_department_id ?? ''}
                  onChange={(e) => setEditing({ ...editing, target_org_department_id: e.target.value ? parseInt(e.target.value, 10) : null })}>
                  <option value="">— biror —</option>
                  {deptList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs">{t("docRoutStepOrder")}</label>
                <input type="number" className="w-full border rounded p-2"
                  value={editing.step_order ?? 1}
                  onChange={(e) => setEditing({ ...editing, step_order: parseInt(e.target.value, 10) })} />
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <button className="px-4 py-2 border rounded" onClick={() => setEditing(null)}>{t("docRoutCancel")}</button>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded">
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

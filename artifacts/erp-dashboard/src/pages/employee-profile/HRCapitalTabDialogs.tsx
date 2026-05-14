/**
 * @module HRCapitalTabDialogs
 * @description Edit form for HRCapitalTab (inline, not modal, but isolated here per convention).
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "./HRCapitalTabTypes";
import { TOOL_TEST_SCORES } from "./HRCapitalTabTypes";

interface HRCapitalEditFormProps {
  form: FormState;
  onChange: (form: FormState) => void;
}

export function HRCapitalEditForm({ form, onChange }: HRCapitalEditFormProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
          <Label>Visotskiy kategoriyasi</Label>
        <Select
          value={form.visotskiyCategory}
          onValueChange={(v) => onChange({ ...form, visotskiyCategory: v })}
        >
          <SelectTrigger data-testid="select-visotskiy" className="h-9">
            <SelectValue placeholder="Tanlang..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Flagman">Flagman (Yetakchi)</SelectItem>
            <SelectItem value="Performer">Performer (Bajaruvchi)</SelectItem>
            <SelectItem value="Troublemaker">Troublemaker (Muammoli)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
          <Label>Tool Test natijasi (A-J)</Label>
        <Select
          value={form.toolTestScore}
          onValueChange={(v) => onChange({ ...form, toolTestScore: v })}
        >
          <SelectTrigger data-testid="select-tool-test" className="h-9">
            <SelectValue placeholder="Shkala..." />
          </SelectTrigger>
          <SelectContent>
            {(Array.isArray(TOOL_TEST_SCORES) ? TOOL_TEST_SCORES : []).map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
          <Label>Psixologik profil sindromi</Label>
        <Input
          value={form.psychologicalProfile}
          onChange={(e) => onChange({ ...form, psychologicalProfile: e.target.value })}
          placeholder="Masalan: DISC — D turi"
          data-testid="input-psych-profile"
        />
      </div>

      <div className="space-y-1">
          <Label>Onboarding holati</Label>
        <Select
          value={form.onboardingStatus}
          onValueChange={(v) => onChange({ ...form, onboardingStatus: v })}
        >
          <SelectTrigger data-testid="select-onboarding" className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="not_started">Boshlanmagan</SelectItem>
            <SelectItem value="in_progress">Davom etmoqda</SelectItem>
            <SelectItem value="completed">Yakunlangan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
          <Label>Recruiting kanali</Label>
        <Input
          value={form.recruitingChannel}
          onChange={(e) => onChange({ ...form, recruitingChannel: e.target.value })}
          placeholder="Masalan: LinkedIn, Do'stlar tavsiyasi"
          data-testid="input-recruiting-channel"
        />
      </div>

      <div className="space-y-1">
          <Label>Offboarding holati</Label>
        <Input
          value={form.offboardingStatus}
          onChange={(e) => onChange({ ...form, offboardingStatus: e.target.value })}
          placeholder="—"
          data-testid="input-offboarding"
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <Label>Eslatmalar</Label>
        <Input
          value={form.notes}
          onChange={(e) => onChange({ ...form, notes: e.target.value })}
          placeholder="HR izohlar..."
          data-testid="input-hr-capital-notes"
        />
      </div>
    </div>
  );
}

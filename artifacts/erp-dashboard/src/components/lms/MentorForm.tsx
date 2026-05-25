/**
 * @module MentorForm
 * @description React UI component.
 */

import { Users, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
import { tLabel } from '@/lib/i18n/tLabel';
interface MentorData {
  name: string;
  bio: string;
  source: string;
  achievements: string;
  experience: string;
  expertise: string;
  userId: string;
}

interface Mentor {
  id: string;
  name: string;
  source?: string;
}

interface Employee {
  id: string;
  fullName: string;
  employeeId: string;
}

interface MentorFormProps {
  showMentorForm: boolean;
  setShowMentorForm: (show: boolean) => void;
  mentorId: string;
  setMentorId: (id: string) => void;
  mentors: Mentor[];
  mentorData: MentorData;
  setMentorData: (data: MentorData) => void;
  handleMentorSubmit: (e: React.FormEvent) => void;
  createMentorPending: boolean;
  employees: Employee[];
}

export function MentorForm({
  showMentorForm,
  setShowMentorForm,
  mentorId,
  setMentorId,
  mentors,
  mentorData,
  setMentorData,
  handleMentorSubmit,
  createMentorPending,
  employees
}: MentorFormProps) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Mentor (ixtiyoriy)</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowMentorForm(!showMentorForm)}
          data-testid="button-toggle-mentor-form"
        >
          {showMentorForm ? (
            <>
              <Users className="w-4 h-4 mr-2" />
              {t("mavjudMentorlarniTanlash")}
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              {t("yangiMentorQoshish")}
            </>
          )}
        </Button>
      </div>

      {!showMentorForm ? (
        <div className="space-y-2">
          <Select value={mentorId || "none"} onValueChange={(value) => setMentorId(value === "none" ? "" : value)}>
            <SelectTrigger data-testid="select-mentor" className="h-9">
              <SelectValue placeholder={t("mentorniTanlang")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("mentorsiz")}</SelectItem>
              {(Array.isArray(mentors) ? mentors : []).map(mentor => (
                <SelectItem key={mentor.id} value={mentor.id}>
                  {mentor.name} {mentor.source && `(${mentor.source})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <Card className="p-4 space-y-4">
          <div className="space-y-1">
          <Label htmlFor="mentorName">{t("mentorIsmi1")}</Label>
            <Input
              id="mentorName"
              placeholder={t("ismiFamiliyasi")}
              value={mentorData.name}
              onChange={(e) => setMentorData({ ...mentorData, name: e.target.value })}
              required={showMentorForm}
              data-testid="input-mentor-name"
            />
          </div>

          <div className="space-y-1">
          <Label htmlFor="mentorBio">{tLabel('common.MentorForm.kimQisqachaMalumot', "Kim (qisqacha ma'lumot)")}</Label>
            <Textarea
              id="mentorBio"
              placeholder={t("mentorHaqidaQisqachaMalumotKasbi")}
              value={mentorData.bio}
              onChange={(e) => setMentorData({ ...mentorData, bio: e.target.value })}
              rows={2}
              data-testid="input-mentor-bio"
            />
          </div>

          <div className="space-y-1">
          <Label htmlFor="mentorSource">{t("qayerdan")}</Label>
            <Input
              id="mentorSource"
              placeholder={t("kompaniyaUniversitetTashkilotNomi")}
              value={mentorData.source}
              onChange={(e) => setMentorData({ ...mentorData, source: e.target.value })}
              data-testid="input-mentor-source"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
          <Label htmlFor="mentorExperience">{t("tajriba")}</Label>
              <Textarea
                id="mentorExperience"
                placeholder={t("tajribasiYillarLoyihalar")}
                value={mentorData.experience}
                onChange={(e) => setMentorData({ ...mentorData, experience: e.target.value })}
                rows={2}
                data-testid="input-mentor-experience"
              />
            </div>

            <div className="space-y-1">
          <Label htmlFor="mentorExpertise">{t("mutaxassislik")}</Label>
              <Textarea
                id="mentorExpertise"
                placeholder={t("mutaxassislikSohalari")}
                value={mentorData.expertise}
                onChange={(e) => setMentorData({ ...mentorData, expertise: e.target.value })}
                rows={2}
                data-testid="input-mentor-expertise"
              />
            </div>
          </div>

          <div className="space-y-1">
          <Label htmlFor="mentorAchievements">{t("yutuqlar")}</Label>
            <Textarea
              id="mentorAchievements"
              placeholder={t("yutuqlariMukofotlariSertifikatlari")}
              value={mentorData.achievements}
              onChange={(e) => setMentorData({ ...mentorData, achievements: e.target.value })}
              rows={2}
              data-testid="input-mentor-achievements"
            />
          </div>

          <div className="space-y-1">
          <Label htmlFor="mentorEmployee">{t("bizningXodimimizmi")}</Label>
            <Select value={mentorData.userId || "none"} onValueChange={(value) => setMentorData({ ...mentorData, userId: value === "none" ? "" : value })}>
              <SelectTrigger data-testid="select-mentor-employee" className="h-9">
                <SelectValue placeholder={t("xodimniTanlang")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("yoqTashqiMentor")}</SelectItem>
                {(Array.isArray(employees) ? employees : []).map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={handleMentorSubmit}
            disabled={!mentorData.name || createMentorPending}
            className="w-full"
            data-testid="button-save-mentor"
          >
            {createMentorPending && <EPLoader className="w-4 h-4 mr-2" />}
            Mentorni saqlash va tanlash
          </Button>
        </Card>
      )}
    </div>
  );
}

/**
 * @module BasicTab
 * @description React UI component.
 */

import { SdBasicData, SdContactItem, SdDecisionMaker } from "./sd-types";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, MapPin, Mail, Phone, User, Hash, Tag, Linkedin, Crown, ShieldCheck } from "lucide-react";
import { fmtMoney, fmtDate, fmtNum } from "./helpers";
import { useTranslation } from '@/lib/i18n';

const INFLUENCE_CONF: Record<number, { label: string; cls: string; ring: string }> = {
  1: { label: "Minimal",   cls: "text-gray-500",   ring: "border-gray-300 bg-gray-100" },
  2: { label: "Past",      cls: "text-[var(--ep-blue)]",   ring: "border-blue-300 bg-blue-100" },
  3: { label: "O'rta",    cls: "text-[var(--ep-yellow)]",  ring: "border-amber-300 bg-amber-100" },
  4: { label: "Yuqori",   cls: "text-[var(--ep-primary)]", ring: "border-orange-300 bg-orange-100" },
  5: { label: "Kritik",   cls: "text-[var(--ep-red)]",   ring: "border-rose-300 bg-rose-100" },
};

function InfluenceRing({ level }: { level: number }) {
  const conf = INFLUENCE_CONF[Math.min(5, Math.max(1, level))] || INFLUENCE_CONF[3];
  return (
    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-black ${conf.ring} ${conf.cls}`} title={`Ta'sir darajasi: ${conf.label}`}>
      {level}
    </div>
  );
}

export function BasicTab({ data, contacts, decisionMakers }: {
  data: SdBasicData;
  contacts: SdContactItem[];
  decisionMakers?: SdDecisionMaker[];
}) {
  const { t } = useTranslation("common");
  const d = data ?? ({} as Partial<SdBasicData>);
  const phones = (d.phones as { value: string; type: string }[] | null) || [];
  const emails = (d.emails as { value: string; type: string }[] | null) || [];
  const websites = (d.websites as { value: string }[] | null) || [];
  const safeContacts = Array.isArray(contacts) ? contacts : [];
  const safeDMs = Array.isArray(decisionMakers) ? decisionMakers : [];

  const structureLabel: Record<string, string> = {
    independent: "Mustaqil kompaniya",
    subsidiary: "Sho'ba kompaniya",
    holding: "Holding",
    franchise: "Franshayz",
    branch: "Filial",
  };

  return (
    <div className="space-y-4">
      {/* Company + Contact grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Company details */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />{t("kompaniyaMalumotlari")}
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <InfoRow icon={Building2} label={t("name")} value={d.title || d.name || "—"} bold />
            {d.customerCode && <InfoRow icon={Hash} label={t("mijozKodi")} value={d.customerCode} mono />}
            {d.stir && <InfoRow icon={Hash} label="STIR" value={d.stir} />}
            {d.industry && <InfoRow icon={Tag} label={t("soha")} value={d.industry} />}
            {d.address && <InfoRow icon={MapPin} label={t("address")} value={d.address} />}
            {d.companyStructure && d.companyStructure !== 'independent' && (
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground w-20 shrink-0">{t("struktura")}</span>
                <Badge variant="outline" className="text-[10px]">{structureLabel[d.companyStructure] || d.companyStructure}</Badge>
              </div>
            )}
            {websites.map((w, i) => (
              <div key={`w-${i}`} className="flex items-center gap-3 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground w-20 shrink-0">{t("vebSayt")}</span>
                <a href={w.value} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">{w.value}</a>
              </div>
            ))}
          </div>
        </div>

        {/* Contact details */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />{t("aloqaMalumotlari")}
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {phones.length > 0 ? phones.map((p, i) => (
              <div key={`p-${i}`} className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`tel:${p.value}`} className="text-primary hover:underline">{p.value}</a>
                <Badge variant="outline" className="text-[10px] ml-auto">{p.type}</Badge>
              </div>
            )) : (
              <p className="text-xs text-muted-foreground">{t("telefonKorsatilmagan")}</p>
            )}
            {emails.map((e, i) => (
              <div key={`e-${i}`} className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`mailto:${e.value}`} className="text-primary hover:underline truncate">{e.value}</a>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t space-y-2.5">
              <MiniRow label={t("manbaa")} value={d.source || "—"} />
              <MiniRow label={t("chegirma1")} value={`${fmtNum(d.discountRate)}%`} />
              <MiniRow label={t("tolovMuddati")} value={`${d.paymentTermsDays || 30} kun`} />
              <MiniRow label={t("kreditLimiti")} value={fmtMoney(d.creditLimit)} />
              <MiniRow label={t("royxatdan")} value={fmtDate(d.dateCreate)} />
            </div>
          </div>
        </div>
      </div>

      {/* Decision Makers */}
      {safeDMs.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Crown className="h-4 w-4 text-[var(--ep-yellow)]" />
              {t("qarorQabulQiluvchilar")}
              <Badge className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 ml-1" variant="outline">{safeDMs.length}</Badge>
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {safeDMs.map((dm) => {
                const lvl = dm.influenceLevel ?? 3;
                const conf = INFLUENCE_CONF[Math.min(5, Math.max(1, lvl))] || INFLUENCE_CONF[3];
                return (
                  <div key={dm.id} className={`flex items-start gap-3 p-3 rounded-lg border-2 bg-muted/20 ${lvl >= 4 ? 'border-amber-200 dark:border-amber-800' : 'border-transparent'}`}>
                    <InfluenceRing level={lvl} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{dm.fullName}</p>
                        <Badge className={`text-[9px] px-1.5 ${conf.ring} ${conf.cls} border`} variant="outline">{conf.label} ta'sir</Badge>
                      </div>
                      {dm.position && <p className="text-[11px] text-muted-foreground">{dm.position}</p>}
                      {dm.department && <p className="text-[11px] text-muted-foreground">{dm.department}</p>}
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {dm.phone && (
                          <a href={`tel:${dm.phone}`} className="text-[11px] text-primary hover:underline flex items-center gap-1">
                            <Phone className="h-3 w-3" />{dm.phone}
                          </a>
                        )}
                        {dm.email && (
                          <a href={`mailto:${dm.email}`} className="text-[11px] text-primary hover:underline flex items-center gap-1">
                            <Mail className="h-3 w-3" />{dm.email}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* All Contacts */}
      {safeContacts.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              {t("kontaktlar")}
              <Badge variant="outline" className="text-[10px] ml-1">{safeContacts.length}</Badge>
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {safeContacts.map((c) => {
                const lvl = c.influenceLevel ?? 3;
                return (
                  <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-transparent hover:border-border transition-colors">
                    <div className="shrink-0">
                      {c.isDecisionMaker
                        ? <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center"><ShieldCheck className="h-4 w-4 text-white" /></div>
                        : <div className="w-9 h-9 rounded-full from-primary/20 to-primary/5 flex items-center justify-center"><User className="h-4 w-4 text-primary" /></div>
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">{c.fullName}</p>
                        {c.isPrimary && (
                          <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20" variant="outline">{t("primary")}</Badge>
                        )}
                        {c.isDecisionMaker && (
                          <Badge className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200" variant="outline">DM</Badge>
                        )}
                      </div>
                      {c.position && <p className="text-[11px] text-muted-foreground">{c.position}</p>}
                      {c.department && <p className="text-[11px] text-muted-foreground italic">{c.department}</p>}
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />{c.phone}
                        </a>
                      )}
                      {c.email && <p className="text-[11px] text-muted-foreground truncate">{c.email}</p>}
                      {c.telegram && <p className="text-[11px] text-muted-foreground">TG: {c.telegram}</p>}
                      {c.linkedinUrl && (
                        <a href={c.linkedinUrl} target="_blank" rel="noreferrer"
                          className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-0.5">
                          <Linkedin className="h-3 w-3" />{t("linkedin")}
                        </a>
                      )}
                      {/* Influence dots */}
                      {lvl > 1 && (
                        <div className="flex gap-0.5 mt-1">
                          {[1,2,3,4,5].map(i => (
                            <div key={i} className={`w-2 h-2 rounded-full ${i <= lvl
                              ? lvl >= 5 ? 'bg-rose-500' : lvl >= 4 ? 'bg-orange-500' : lvl >= 3 ? 'bg-amber-500' : 'bg-blue-500'
                              : 'bg-muted'}`} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {d.comments && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold">{t("Izoh")}</h3>
          </div>
          <div className="p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">{d.comments}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, bold, mono }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; bold?: boolean; mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
      <span className={`truncate ${bold ? "font-semibold" : ""} ${mono ? "font-mono text-xs bg-muted px-1.5 py-0.5 rounded" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-medium text-xs">{value}</span>
    </div>
  );
}

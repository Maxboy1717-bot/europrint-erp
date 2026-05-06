import { SdBasicData, SdContactItem } from "./sd-types";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, MapPin, Mail, Phone, User, Hash, Tag } from "lucide-react";
import { fmtMoney, fmtDate, fmtNum } from "./helpers";

export function BasicTab({ data, contacts }: { data: SdBasicData; contacts: SdContactItem[] }) {
  const d = data ?? ({} as Partial<SdBasicData>);
  const phones = (d.phones as { value: string; type: string }[] | null) || [];
  const emails = (d.emails as { value: string; type: string }[] | null) || [];
  const websites = (d.websites as { value: string }[] | null) || [];
  const safeContacts = Array.isArray(contacts) ? contacts : [];

  return (
    <div className="space-y-4">
      {/* Company + Contact grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Company details */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />Kompaniya ma'lumotlari
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <InfoRow icon={Building2} label="Nomi" value={d.title || d.name || "—"} bold />
            {d.customerCode && <InfoRow icon={Hash} label="Mijoz kodi" value={d.customerCode} mono />}
            {d.stir && <InfoRow icon={Hash} label="STIR" value={d.stir} />}
            {d.industry && <InfoRow icon={Tag} label="Soha" value={d.industry} />}
            {d.address && <InfoRow icon={MapPin} label="Manzil" value={d.address} />}
            {websites.map((w, i) => (
              <div key={`w-${i}`} className="flex items-center gap-3 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground w-20 shrink-0">Veb-sayt</span>
                <a href={w.value} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">{w.value}</a>
              </div>
            ))}
          </div>
        </div>

        {/* Contact details */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />Aloqa ma'lumotlari
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
              <p className="text-xs text-muted-foreground">Telefon ko'rsatilmagan</p>
            )}
            {emails.map((e, i) => (
              <div key={`e-${i}`} className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`mailto:${e.value}`} className="text-primary hover:underline truncate">{e.value}</a>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t space-y-2.5">
              <MiniRow label="Manbaa" value={d.source || "—"} />
              <MiniRow label="Chegirma" value={`${fmtNum(d.discountRate)}%`} />
              <MiniRow label="To'lov muddati" value={`${d.paymentTermsDays || 30} kun`} />
              <MiniRow label="Kredit limiti" value={fmtMoney(d.creditLimit)} />
              <MiniRow label="Ro'yxatdan" value={fmtDate(d.dateCreate)} />
            </div>
          </div>
        </div>
      </div>

      {/* Contacts */}
      {safeContacts.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Kontaktlar
              <Badge variant="outline" className="text-[10px] ml-1">{safeContacts.length}</Badge>
            </h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {safeContacts.map((c) => (
                <div key={c.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-transparent hover:border-border transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{c.fullName}</p>
                      {c.isPrimary && (
                        <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20" variant="outline">Asosiy</Badge>
                      )}
                    </div>
                    {c.position && <p className="text-[11px] text-muted-foreground">{c.position}</p>}
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />{c.phone}
                      </a>
                    )}
                    {c.email && <p className="text-[11px] text-muted-foreground truncate">{c.email}</p>}
                    {c.telegram && <p className="text-[11px] text-muted-foreground">TG: {c.telegram}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {d.comments && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="text-sm font-semibold">Izoh</h3>
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

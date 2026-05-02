import { SdBasicData, SdContactItem } from "./sd-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, MapPin, Mail, Phone, User } from "lucide-react";
import { KpiCard, fmtMoney, fmtDate, fmtNum } from "./helpers";
import { ShieldAlert, Trophy, DollarSign } from "lucide-react";

export function BasicTab({ data, contacts }: { data: SdBasicData; contacts: SdContactItem[] }) {
  const phones = (data.phones as { value: string; type: string }[] | null) || [];
  const emails = (data.emails as { value: string; type: string }[] | null) || [];
  const websites = (data.websites as { value: string }[] | null) || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard icon={ShieldAlert} label="Holat"
          value={data.status === "blacklist" ? "Qora ro'yxat" : data.status === "inactive" ? "Nofaol" : "Aktiv"} />
        <KpiCard icon={Trophy} label="Kategoriya" value={data.customerCategory || "C"}
          color={data.customerCategory === "A" ? "text-green-600" : data.customerCategory === "B" ? "text-blue-600" : data.customerCategory === "D" ? "text-red-600" : "text-yellow-600"} />
        <KpiCard icon={DollarSign} label="Kredit limiti" value={fmtMoney(data.creditLimit)}
          sub={`${data.paymentTermsDays || 30} kun muddati`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Kompaniya ma'lumotlari</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium">{data.title}</span>
            </div>
            {data.customerCode && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground w-28 shrink-0">Mijoz kodi:</span>
                <code className="bg-muted px-2 py-0.5 rounded text-xs">{data.customerCode}</code>
              </div>
            )}
            {data.stir && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground w-28 shrink-0">STIR:</span>
                <span>{data.stir}</span>
              </div>
            )}
            {data.industry && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground w-28 shrink-0">Soha:</span>
                <span>{data.industry}</span>
              </div>
            )}
            {data.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{data.address}</span>
              </div>
            )}
            {(Array.isArray(websites) ? websites : []).map((w, i) => (
              <div key={`k-${i}`} className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={w.value} target="_blank" rel="noreferrer" className="text-primary hover:underline">{w.value}</a>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Aloqa ma'lumotlari</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(Array.isArray(phones) ? phones : []).map((p, i) => (
              <div key={`k-${i}`} className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`tel:${p.value}`} className="text-primary hover:underline">{p.value}</a>
                <Badge variant="outline" className="text-xs">{p.type}</Badge>
              </div>
            ))}
            {(Array.isArray(emails) ? emails : []).map((e, i) => (
              <div key={`k-${i}`} className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={`mailto:${e.value}`} className="text-primary hover:underline">{e.value}</a>
              </div>
            ))}
            <div className="pt-2 border-t space-y-1">
              <div className="flex gap-2 text-sm">
                <span className="text-muted-foreground w-28 shrink-0">Manbaa:</span>
                <span className="capitalize">{data.source || "—"}</span>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="text-muted-foreground w-28 shrink-0">Chegirma:</span>
                <span>{fmtNum(data.discountRate)}%</span>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="text-muted-foreground w-28 shrink-0">Ro'yxatdan:</span>
                <span>{fmtDate(data.dateCreate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {contacts.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Kontaktlar</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Array.isArray(contacts) ? contacts : []).map((c) => (
                <div key={c.id} className="flex items-start gap-3 p-3 bg-muted rounded-md">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{c.fullName}</p>
                    <p className="text-xs text-muted-foreground">{c.position}</p>
                    {c.phone && <p className="text-xs">{c.phone}</p>}
                    {c.email && <p className="text-xs text-muted-foreground truncate">{c.email}</p>}
                    {c.telegram && <p className="text-xs text-muted-foreground">Telegram: {c.telegram}</p>}
                  </div>
                  {c.isPrimary && <Badge variant="outline" className="text-xs shrink-0">Asosiy</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.comments && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Izoh</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{data.comments}</p></CardContent>
        </Card>
      )}
    </div>
  );
}

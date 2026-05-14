/**
 * @module ReferralPageSections
 * @description Major section components for ReferralPage:
 *   - StatsGrid
 *   - MyReferralsTab
 *   - AllReferralsTab
 *   - BoomerangTab
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Users, Gift, CheckCircle, Clock, RefreshCcw } from "lucide-react";
import { Referral, BoomerangAlumni, STATUS_MAP } from "./ReferralPageTypes";
import { EPStatusPill } from "@/components/ep";

// ---------------------------------------------------------------------------
// StatsGrid
// ---------------------------------------------------------------------------

interface StatsGridProps {
  stats: Record<string, unknown>;
}

export function StatsGrid({ stats }: StatsGridProps) {
  const items = [
    { label: "Jami tavsiyalar",  value: (stats.total as number) || 0,           icon: Users,       color: "text-[var(--ep-blue)]"   },
    { label: "Qabul qilingan",   value: (stats.hired as number) || 0,            icon: CheckCircle, color: "text-[var(--ep-green)]"  },
    { label: "Kutilmoqda",       value: (stats.pending as number) || 0,          icon: Clock,       color: "text-[var(--ep-yellow)]"  },
    { label: "Bonus to'langan",  value: (stats.bonus_paid_count as number) || 0, icon: Gift,        color: "text-[var(--ep-purple)]" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {items.map(s => (
        <Card key={s.label}>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <s.icon className={`h-5 w-5 ${s.color}`} />
            <div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MyReferralsTab
// ---------------------------------------------------------------------------

interface MyReferralsTabProps {
  referrals: Referral[];
  isLoading: boolean;
  onAddOpen: () => void;
}

export function MyReferralsTab({ referrals, isLoading, onAddOpen }: MyReferralsTabProps) {
  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Yuklanmoqda...</div>
        ) : referrals.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Hali tavsiya yo'q</p>
            <Button size="sm" className="mt-3" onClick={onAddOpen}>
              Do'stingizni tavsiya qiling
            </Button>
          </div>
        ) : (
          <div className="ep-table-scroll"><Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomzod</TableHead>
                <TableHead>Lavozim</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead>Sana</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(referrals) ? referrals : []).map((r) => {
                const st = STATUS_MAP[r.status] || { label: r.status, color: "bg-gray-100 text-gray-700" };
                return (
                  <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <p className="font-medium text-sm">{r.candidate_full_name}</p>
                      <p className="text-xs text-muted-foreground">{r.candidate_phone}</p>
                    </TableCell>
                    <TableCell className="text-sm">{r.position_title}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.bonus_paid ? (
                        <span className="text-[var(--ep-green)] flex items-center gap-1">
                          <Gift className="h-3 w-3" />
                          {r.bonus_type === "money" ? `${r.bonus_amount} so'm` : `${r.bonus_amount} kun ta'til`}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString("uz-UZ") : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// AllReferralsTab
// ---------------------------------------------------------------------------

interface AllReferralsTabProps {
  referrals: Referral[];
  isLoading: boolean;
  onEdit: (r: Referral) => void;
}

export function AllReferralsTab({ referrals, isLoading, onEdit }: AllReferralsTabProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nomzod</TableHead>
              <TableHead>Tavsiyachi</TableHead>
              <TableHead>Lavozim</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead>Bonus</TableHead>
              <TableHead className="text-right">Amal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-6">Yuklanmoqda...</TableCell></TableRow>
            ) : referrals.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-6 text-[13px] text-muted-foreground">Tavsiyalar yo'q</TableCell></TableRow>
            ) : (Array.isArray(referrals) ? referrals : []).map((r) => {
              const st = STATUS_MAP[r.status] || { label: r.status, color: "bg-gray-100 text-gray-700" };
              return (
                <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell>
                    <p className="font-medium text-sm">{r.candidate_full_name}</p>
                    <p className="text-xs text-muted-foreground">{r.candidate_phone}</p>
                  </TableCell>
                  <TableCell className="text-sm">{r.referrer_name || `#${r.referrer_id}`}</TableCell>
                  <TableCell className="text-sm">{r.position_title}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.bonus_paid ? (
                      <EPStatusPill tone="success" className="text-xs">To'langan</EPStatusPill>
                    ) : r.status === "hired" ? (
                      <Badge variant="outline" className="text-xs text-[var(--ep-primary)]">Kutilmoqda</Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => onEdit(r)}
                    >
                      Tahrirlash
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table></div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// BoomerangTab
// ---------------------------------------------------------------------------

interface BoomerangTabProps {
  alumni: BoomerangAlumni[];
}

export function BoomerangTab({ alumni }: BoomerangTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <RefreshCcw className="h-4 w-4 text-[var(--ep-blue)]" />
          Boomerang Hire — Sobiq xodimlar
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="ep-table-scroll"><Table>
          <TableHeader>
            <TableRow>
              <TableHead>Xodim</TableHead>
              <TableHead>Bo'lim</TableHead>
              <TableHead>Lavozim</TableHead>
              <TableHead>Holat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alumni.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-[13px] text-muted-foreground">
                  Sobiq xodimlar bazasi bo'sh
                </TableCell>
              </TableRow>
            ) : (Array.isArray(alumni) ? alumni : []).map((a) => (
              <TableRow key={a.id} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-medium text-sm">{a.full_name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{a.department_name || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{a.position_name || "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {a.status === "fired" ? "Ishdan bo'shatilgan" : a.status === "resigned" ? "Ketgan" : a.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></div>
      </CardContent>
    </Card>
  );
}

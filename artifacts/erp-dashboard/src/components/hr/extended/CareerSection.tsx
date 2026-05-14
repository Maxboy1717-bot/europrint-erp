/**
 * @module CareerSection
 * @description React UI component.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, UserPlus, FileText } from "lucide-react";
import { CareerPlan } from "./types";

interface CareerSectionProps {
  careerPlans: CareerPlan[];
  careerLoading: boolean;
}

export function CareerSection({
  careerPlans,
  careerLoading,
}: CareerSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Kasbiy O'sish va Vorislik Rejalashtirish</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {([
          { l: "Faol reja", v: careerPlans.length, c: "text-[var(--ep-blue)]", i: TrendingUp },
          { l: "Kandidatlar", v: "14", c: "text-[var(--ep-green)]", i: UserPlus },
          { l: "O'sish (bu oy)", v: "3", c: "text-[var(--ep-primary)]", i: FileText },
          { l: "Vorislik tayyorgarligi", v: "68%", c: "text-primary", i: TrendingUp },
        ]).map(s => (
          <Card key={s.l}><CardContent className="pt-4 pb-3 flex items-start justify-between">
            <div>
              <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
            </div>
            <s.i className={`h-5 w-5 ${s.c} mt-1`} />
          </CardContent></Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Karyera Rivojlanish Rejalari</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="ep-table-scroll"><Table>
            <TableHeader><TableRow>
              <TableHead>Xodim</TableHead><TableHead>Joriy lavozim</TableHead>
              <TableHead>Maqsadli lavozim</TableHead><TableHead>Sana</TableHead>
              <TableHead>Holati</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {careerLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-6">Yuklanmoqda...</TableCell></TableRow>
              ) : careerPlans.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-[13px] text-muted-foreground">Rejalar mavjud emas</TableCell></TableRow>
              ) : (Array.isArray(careerPlans) ? careerPlans : []).map((plan) => (
                <TableRow key={plan.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">{plan.employee_name}</TableCell>
                  <TableCell className="text-muted-foreground">{plan.current_position_title || "—"}</TableCell>
                  <TableCell>{plan.target_position_title || "—"}</TableCell>
                  <TableCell>{plan.target_date || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={plan.status === "completed" ? "default" : "outline"}>
                      {plan.status === "completed" ? "Bajarildi" : plan.status === "in_progress" ? "Jarayonda" : "Rejalashtirilgan"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Award, RefreshCw, FileText, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export function CertificateSection() {
  const { data: certList = [], isLoading: certLoading, refetch: refetchCerts } = useQuery<Record<string, unknown>[]>({
    queryKey: ["/api/qc/certificates"],
    enabled: true,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Mahsulot Sertifikatlari</h2>
          <p className="text-sm text-muted-foreground">Sifat va muvofiqlik sertifikatlari reestri</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchCerts()} data-testid="button-refresh-certs">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Yangilash
          </Button>
          <Button data-testid="button-add-cert">
            Sertifikat Yuklash
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {([
          { label: "Faol sertifikatlar", value: certList.length, icon: Award, color: "text-blue-600" },
          { label: "Muddati o'tayotgan", value: (Array.isArray(certList) ? certList : []).filter(c => (c.daysLeft as number ?? 0) < 30).length, icon: Clock, color: "text-yellow-600" },
          { label: "Tasdiqlangan", value: (Array.isArray(certList) ? certList : []).filter(c => c.status === "approved").length, icon: CheckCircle, color: "text-green-600" },
        ]).map(s => (
          <Card key={s.label}><CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Sertifikat nomi</TableHead>
              <TableHead>Turi</TableHead>
              <TableHead>Berilgan sana</TableHead>
              <TableHead>Amal qilish muddati</TableHead>
              <TableHead>Holati</TableHead>
              <TableHead>Fayl</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {certLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Yuklanmoqda...</TableCell></TableRow>
              ) : certList.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <Award className="h-8 w-8 mx-auto mb-2 opacity-30" />Sertifikatlar topilmadi
                </TableCell></TableRow>
              ) : (Array.isArray(certList) ? certList : []).map((c, i) => (
                <TableRow key={`k-${i}`} data-testid={`row-cert-${i}`}>
                  <TableCell className="font-medium">{c.name as string}</TableCell>
                  <TableCell>{c.type as string}</TableCell>
                  <TableCell>{c.issueDate ? format(new Date(c.issueDate as string), "dd.MM.yyyy") : "—"}</TableCell>
                  <TableCell>{c.expiryDate ? format(new Date(c.expiryDate as string), "dd.MM.yyyy") : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status as string}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" data-testid={`button-download-cert-${i}`}><FileText className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

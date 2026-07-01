/**
 * @module WarehouseExitGuard
 * @description FAZA Q — Ombor chiqish nazorati: chiqish darvozasi kamerasidan olingan
 *   suratni HR yuz-tanish infratuzilmasi orqali xodim bilan solishtiradi (reuse,
 *   Q-46 — yangi tanish servisi yozilmagan) va WMS chiqim hujjati bilan cross-check
 *   qiladi. Natija `ai_camera_cross_check` jadvaliga yoziladi; nomuvofiqlikda
 *   avtomatik xavfsizlik hodisasi ochiladi (security_incidents).
 */

import { useRef, useState, type ChangeEvent } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { tLabel } from "@/lib/i18n/tLabel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ShieldAlert, ShieldCheck, Upload, X } from "lucide-react";

interface CameraOption {
  id: number;
  code: string;
  name: string;
  location: string | null;
}

interface CrossCheckRow {
  id: number;
  employee_id: number;
  expected_location: string | null;
  detected_location: string | null;
  match_score: string | null;
  anomaly_detected: boolean;
  camera_source: string | null;
  checked_at: string;
}

const NS = "common.warehouse-exit-guard.tsx.";

const L = {
  cardTitle: tLabel(`${NS}cardTitle`, "Ombor chiqish nazorati (AI-kamera)"),
  cameraLabel: tLabel(`${NS}cameraLabel`, "Chiqish darvozasi kamerasi"),
  cameraPlaceholder: tLabel(`${NS}cameraPlaceholder`, "Kamerani tanlang"),
  employeeLabel: tLabel(`${NS}employeeLabel`, "Da'vo qilingan xodim ID"),
  goodsIssueLabel: tLabel(`${NS}goodsIssueLabel`, "WMS chiqim hujjati ID (ixtiyoriy)"),
  photoLabel: tLabel(`${NS}photoLabel`, "Kamera surati"),
  photoAlt: tLabel(`${NS}photoAlt`, "surat"),
  attachPhoto: tLabel(`${NS}attachPhoto`, "Surat biriktirish"),
  onlyImages: tLabel(`${NS}onlyImages`, "Faqat rasm fayllari qabul qilinadi"),
  photoRequired: tLabel(`${NS}photoRequired`, "Kamera surati majburiy"),
  verifying: tLabel(`${NS}verifying`, "Tekshirilmoqda..."),
  verify: tLabel(`${NS}verify`, "Tekshirish"),
  recentChecks: tLabel(`${NS}recentChecks`, "So'nggi tekshiruvlar"),
  loading: tLabel(`${NS}loading`, "Yuklanmoqda..."),
  noChecksYet: tLabel(`${NS}noChecksYet`, "Hali tekshiruv yo'q"),
  colEmployee: tLabel(`${NS}colEmployee`, "Xodim"),
  colExpected: tLabel(`${NS}colExpected`, "Kutilgan"),
  colDetected: tLabel(`${NS}colDetected`, "Aniqlangan"),
  colMatch: tLabel(`${NS}colMatch`, "Moslik"),
  colStatus: tLabel(`${NS}colStatus`, "Holat"),
  colTime: tLabel(`${NS}colTime`, "Vaqt"),
  anomalyBadge: tLabel(`${NS}anomalyBadge`, "Anomaliya"),
  confirmedBadge: tLabel(`${NS}confirmedBadge`, "Tasdiqlandi"),
  anomalyToastTitle: tLabel(`${NS}anomalyToastTitle`, "Anomaliya aniqlandi — xavfsizlik hodisasi ochildi"),
  okToastTitle: tLabel(`${NS}okToastTitle`, "Tasdiqlandi — moslik topildi"),
  verifyErrorFallback: tLabel(`${NS}verifyErrorFallback`, "Tekshirishda xatolik"),
  errorToastTitle: tLabel(`${NS}errorToastTitle`, "Xatolik"),
  cameraRequired: tLabel(`${NS}cameraRequired`, "Kamera tanlang"),
  employeeRequired: tLabel(`${NS}employeeRequired`, "Xodim ID kiriting"),
};

const FormSchema = z.object({
  cameraId: z.coerce.number().int().positive({ message: L.cameraRequired }),
  claimedEmployeeId: z.coerce.number().int().positive({ message: L.employeeRequired }),
  goodsIssueId: z.coerce.number().int().positive().optional().or(z.literal("")),
});
type FormValues = z.infer<typeof FormSchema>;

export function WarehouseExitGuard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageBase64, setImageBase64] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: camerasData } = useQuery<CameraOption[]>({ queryKey: ["/api/cameras"] });
  const cameras = Array.isArray(camerasData) ? camerasData : [];

  const { data: crossChecksData, isLoading: crossChecksLoading } = useQuery<CrossCheckRow[]>({
    queryKey: ["/api/iot/warehouse-guard/cross-checks"],
  });
  const crossChecks = Array.isArray(crossChecksData) ? crossChecksData : [];

  const { control, register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { cameraId: undefined, claimedEmployeeId: undefined, goodsIssueId: "" },
  });

  const verifyMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiRequest<{ anomalyDetected: boolean }>("POST", "/api/iot/warehouse-guard/verify-exit", body),
    onSuccess: (data: { anomalyDetected: boolean }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/iot/warehouse-guard/cross-checks"] });
      toast({
        title: data.anomalyDetected ? L.anomalyToastTitle : L.okToastTitle,
        variant: data.anomalyDetected ? "destructive" : "default",
      });
      reset();
      setImageBase64("");
      setImagePreview(null);
    },
    onError: (e: unknown) => {
      const msg = (e as Error)?.message ?? L.verifyErrorFallback;
      setSubmitError(msg);
      toast({ title: L.errorToastTitle, description: msg, variant: "destructive" });
    },
  });

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setSubmitError(L.onlyImages); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (values: FormValues) => {
    setSubmitError(null);
    if (!imageBase64) { setSubmitError(L.photoRequired); return; }
    verifyMutation.mutate({
      cameraId: values.cameraId,
      claimedEmployeeId: values.claimedEmployeeId,
      imageBase64,
      goodsIssueId: values.goodsIssueId === "" ? undefined : values.goodsIssueId,
    });
  };

  return (
    <Card data-testid="warehouse-exit-guard-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlert className="w-5 h-5 text-[var(--ep-red)]" />
          {L.cardTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>{L.cameraLabel}</Label>
            <Controller
              name="cameraId"
              control={control}
              render={({ field }) => (
                <Select value={field.value ? String(field.value) : undefined} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger data-testid="select-warehouse-guard-camera">
                    <SelectValue placeholder={L.cameraPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {cameras.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} {c.location ? `— ${c.location}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.cameraId && <p className="text-xs text-[var(--ep-red)]">{errors.cameraId.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>{L.employeeLabel}</Label>
            <Input type="number" min={1} data-testid="input-warehouse-guard-employee"
              {...register("claimedEmployeeId")} />
            {errors.claimedEmployeeId && <p className="text-xs text-[var(--ep-red)]">{errors.claimedEmployeeId.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>{L.goodsIssueLabel}</Label>
            <Input type="number" min={1} data-testid="input-warehouse-guard-goods-issue"
              {...register("goodsIssueId")} />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <Label>{L.photoLabel}</Label>
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border bg-gray-50 w-40">
                <img src={imagePreview} alt={L.photoAlt} className="w-40 h-28 object-cover" />
                <button type="button" onClick={() => { setImageBase64(""); setImagePreview(null); }}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:bg-red-50">
                  <X className="w-3 h-3 text-[var(--ep-red)]" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full h-16 border-2 border-dashed border-gray-200 rounded-lg flex items-center
                           justify-center gap-2 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <Upload className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">{L.attachPhoto}</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          {submitError && (
            <p className="text-sm text-[var(--ep-red)] bg-red-50 px-3 py-2 rounded-md sm:col-span-2">{submitError}</p>
          )}

          <div className="sm:col-span-2">
            <Button type="submit" disabled={isSubmitting || verifyMutation.isPending} data-testid="button-warehouse-guard-verify">
              {verifyMutation.isPending ? L.verifying : L.verify}
            </Button>
          </div>
        </form>

        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">{L.recentChecks}</div>
          {crossChecksLoading ? (
            <div className="text-sm text-muted-foreground">{L.loading}</div>
          ) : crossChecks.length === 0 ? (
            <div className="text-sm text-muted-foreground">{L.noChecksYet}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{L.colEmployee}</TableHead>
                  <TableHead>{L.colExpected}</TableHead>
                  <TableHead>{L.colDetected}</TableHead>
                  <TableHead>{L.colMatch}</TableHead>
                  <TableHead>{L.colStatus}</TableHead>
                  <TableHead>{L.colTime}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crossChecks.map((row) => (
                  <TableRow key={row.id} data-testid={`row-cross-check-${row.id}`}>
                    <TableCell>#{row.employee_id}</TableCell>
                    <TableCell className="max-w-[160px] truncate">{row.expected_location ?? "—"}</TableCell>
                    <TableCell className="max-w-[160px] truncate">{row.detected_location ?? "—"}</TableCell>
                    <TableCell>{row.match_score ?? "0"}</TableCell>
                    <TableCell>
                      {row.anomaly_detected ? (
                        <Badge variant="destructive" className="gap-1">
                          <ShieldAlert className="w-3 h-3" /> {L.anomalyBadge}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <ShieldCheck className="w-3 h-3" /> {L.confirmedBadge}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(row.checked_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

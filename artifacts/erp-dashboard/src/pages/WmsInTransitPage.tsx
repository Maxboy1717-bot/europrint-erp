/**
 * @module WmsInTransitPage
 * @description OMBOR (ERP) — Import xom-ashyo YO'LDA kuzatuvi (in-transit).
 *   Jo'natmalar jadvali (status shipped → customs → arrived / cancelled) +
 *   holat-o'tkazish tugmalari + import hujjat (GTD/invoys) ilova-dialog +
 *   "Yetkazuvchi reytingi" panel (FE-B1 GET supplier rating).
 *
 *   EP-dizayn: EPPageHeader + EP/ui komponent + var(--ep-*) token + EPSkeleton
 *   (F1) + useMutation onError→toast (F2) + Zod forma (Q-43 real saqlash) +
 *   o'chirish/bekor ConfirmDialog (Q-14, AlertDialog).
 *
 *   ADDITIVE (Q-46): yangi sahifa; mavjud WMS route/sahifaga tegmaydi.
 *   Route: /wms/in-transit
 * @layer Frontend page (WMS / ERP nazorat)
 */

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { EPPageHeader } from "@/components/ep/EPPageHeader";
import { EPSkeletonTable, EPSkeletonKpiRow } from "@/components/ep/EPSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { Ship, Plus, FileText, Star, ArrowRight, PackageCheck, Ban } from "lucide-react";
import {
  wmsInTransitApi,
  type InTransitShipment,
  type ImportDocument,
  type SupplierRatingRow,
  type ListEnvelope,
} from "@/lib/api/wms-in-transit";

const QK_SHIPMENTS = ["/api/wms/in-transit/shipments"] as const;
const QK_RATINGS = ["/api/wms/suppliers/rating"] as const;

/** Yangi jo'natma Zod forma (Q-43 — real saqlash). */
const CreateShipmentSchema = z.object({
  shipment_number: z.string().min(1, "Jo'natma raqami majburiy").max(64),
  supplier_name: z.string().max(255).optional(),
  origin_country: z.string().max(80).optional(),
  invoice_number: z.string().max(120).optional(),
  incoterm: z.string().max(16).optional(),
  currency: z.string().max(10).optional(),
  declared_value: z.string().optional(),
  eta: z.string().optional(),
  shipped_date: z.string().optional(),
  notes: z.string().optional(),
});

/** Hujjat biriktirish Zod forma. */
const AddDocSchema = z.object({
  doc_type: z.enum(["GTD", "invoice", "cert", "packing_list", "other"]),
  doc_number: z.string().max(120).optional(),
  file_url: z.string().max(2048).optional(),
  issued_date: z.string().optional(),
  notes: z.string().optional(),
});

function statusBadge(status: string) {
  const map: Record<string, string> = {
    shipped: "bg-[var(--ep-blue)]/15 text-[var(--ep-blue)]",
    customs: "bg-[var(--ep-yellow)]/15 text-[var(--ep-yellow)]",
    arrived: "bg-[var(--ep-green)]/15 text-[var(--ep-green)]",
    cancelled: "bg-[var(--ep-red)]/15 text-[var(--ep-red)]",
  };
  const label: Record<string, string> = {
    shipped: "Yo'lda",
    customs: "Bojxonada",
    arrived: "Yetib keldi",
    cancelled: "Bekor qilingan",
  };
  return (
    <Badge variant="outline" className={`text-xs ${map[status] ?? ""}`}>
      {label[status] ?? status}
    </Badge>
  );
}

function ratingStars(rating: number | null) {
  if (rating == null) return <span className="text-xs text-muted-foreground">—</span>;
  const full = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${n <= full ? "fill-[var(--ep-yellow)] text-[var(--ep-yellow)]" : "text-muted-foreground/40"}`}
        />
      ))}
      <span className="ml-1 text-xs font-medium">{rating.toFixed(2)}</span>
    </span>
  );
}

export default function WmsInTransitPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [docShipment, setDocShipment] = useState<InTransitShipment | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<InTransitShipment | null>(null);

  // --- Forma state (yangi jo'natma) ---
  const [shipmentNumber, setShipmentNumber] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [originCountry, setOriginCountry] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [incoterm, setIncoterm] = useState("");
  const [currency, setCurrency] = useState("");
  const [declaredValue, setDeclaredValue] = useState("");
  const [eta, setEta] = useState("");
  const [shippedDate, setShippedDate] = useState("");
  const [notes, setNotes] = useState("");

  // --- Forma state (hujjat) ---
  const [docType, setDocType] = useState<string>("GTD");
  const [docNumber, setDocNumber] = useState("");
  const [docFileUrl, setDocFileUrl] = useState("");
  const [docIssuedDate, setDocIssuedDate] = useState("");
  const [docNotes, setDocNotes] = useState("");

  // --- Queries (F1 loading) ---
  const { data: shipData, isLoading } = useQuery<ListEnvelope<InTransitShipment>>({
    queryKey: QK_SHIPMENTS,
    queryFn: () => wmsInTransitApi.listShipments(),
  });
  const shipments = Array.isArray(shipData?.items) ? shipData.items : [];

  const { data: ratings, isLoading: ratingsLoading } = useQuery<SupplierRatingRow[]>({
    queryKey: QK_RATINGS,
    queryFn: () => wmsInTransitApi.listSupplierRatings(false),
  });
  const ratingRows = Array.isArray(ratings) ? ratings : [];

  const { data: docData } = useQuery<ListEnvelope<ImportDocument>>({
    queryKey: ["/api/wms/in-transit/shipments", docShipment?.id, "documents"],
    queryFn: () => wmsInTransitApi.listDocuments(docShipment?.id ?? 0),
    enabled: docShipment != null,
  });
  const documents = Array.isArray(docData?.items) ? docData.items : [];

  const resetCreate = () => {
    setShipmentNumber(""); setSupplierName(""); setOriginCountry(""); setInvoiceNumber("");
    setIncoterm(""); setCurrency(""); setDeclaredValue(""); setEta(""); setShippedDate(""); setNotes("");
  };
  const resetDoc = () => {
    setDocType("GTD"); setDocNumber(""); setDocFileUrl(""); setDocIssuedDate(""); setDocNotes("");
  };

  // --- Mutations (F2 onError) ---
  const createMutation = useMutation({
    mutationFn: () => {
      const parsed = CreateShipmentSchema.parse({
        shipment_number: shipmentNumber,
        supplier_name: supplierName || undefined,
        origin_country: originCountry || undefined,
        invoice_number: invoiceNumber || undefined,
        incoterm: incoterm || undefined,
        currency: currency || undefined,
        declared_value: declaredValue || undefined,
        eta: eta || undefined,
        shipped_date: shippedDate || undefined,
        notes: notes || undefined,
      });
      const dv = parsed.declared_value ? Number(parsed.declared_value) : undefined;
      return wmsInTransitApi.createShipment({
        shipment_number: parsed.shipment_number,
        supplier_name: parsed.supplier_name,
        origin_country: parsed.origin_country,
        invoice_number: parsed.invoice_number,
        incoterm: parsed.incoterm,
        currency: parsed.currency,
        declared_value: dv != null && Number.isFinite(dv) && dv >= 0 ? dv : undefined,
        eta: parsed.eta,
        shipped_date: parsed.shipped_date,
        notes: parsed.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK_SHIPMENTS });
      setIsCreateOpen(false);
      resetCreate();
      toast({ title: t("jonatmaQoshildi", "Jo'natma qo'shildi") });
    },
    onError: (e: unknown) =>
      toast({
        title: t("xatolikYuzBerdi", "Xatolik yuz berdi"),
        description: e instanceof z.ZodError ? e.errors[0]?.message : undefined,
        variant: "destructive",
      }),
  });

  const customsMutation = useMutation({
    mutationFn: (id: number) => wmsInTransitApi.markCustoms(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK_SHIPMENTS });
      toast({ title: t("bojxonagaOtkazildi", "Bojxonaga o'tkazildi") });
    },
    onError: () => toast({ title: t("xatolikYuzBerdi", "Xatolik yuz berdi"), variant: "destructive" }),
  });

  const arrivedMutation = useMutation({
    mutationFn: (id: number) => wmsInTransitApi.markArrived(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK_SHIPMENTS });
      toast({ title: t("yetibKeldiKarantin", "Yetib keldi — karantin kirim ochildi") });
    },
    onError: () => toast({ title: t("xatolikYuzBerdi", "Xatolik yuz berdi"), variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => wmsInTransitApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK_SHIPMENTS });
      setConfirmCancel(null);
      toast({ title: t("jonatmaBekorQilindi", "Jo'natma bekor qilindi") });
    },
    onError: () => toast({ title: t("xatolikYuzBerdi", "Xatolik yuz berdi"), variant: "destructive" }),
  });

  const addDocMutation = useMutation({
    mutationFn: () => {
      const parsed = AddDocSchema.parse({
        doc_type: docType,
        doc_number: docNumber || undefined,
        file_url: docFileUrl || undefined,
        issued_date: docIssuedDate || undefined,
        notes: docNotes || undefined,
      });
      return wmsInTransitApi.addDocument(docShipment?.id ?? 0, parsed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wms/in-transit/shipments", docShipment?.id, "documents"] });
      resetDoc();
      toast({ title: t("hujjatBiriktirildi", "Hujjat biriktirildi") });
    },
    onError: (e: unknown) =>
      toast({
        title: t("xatolikYuzBerdi", "Xatolik yuz berdi"),
        description: e instanceof z.ZodError ? e.errors[0]?.message : undefined,
        variant: "destructive",
      }),
  });

  const kpis = [
    { label: t("jamiJonatma", "Jami jo'natma"), value: shipments.length, color: "text-[var(--ep-blue)]" },
    { label: t("yolda", "Yo'lda"), value: shipments.filter((s) => s.status === "shipped").length, color: "text-[var(--ep-blue)]" },
    { label: t("bojxonada", "Bojxonada"), value: shipments.filter((s) => s.status === "customs").length, color: "text-[var(--ep-yellow)]" },
    { label: t("yetibKeldi", "Yetib keldi"), value: shipments.filter((s) => s.status === "arrived").length, color: "text-[var(--ep-green)]" },
  ];

  return (
    <div className="flex flex-col h-full p-5 lg:p-6 gap-5">
      <EPPageHeader
        icon={<Ship className="h-5 w-5 text-[var(--ep-blue)]" />}
        title={t("importYolda", "Import — Yo'lda kuzatuv")}
        subtitle={t("importYoldaSub", "Import xom-ashyo jo'natmalari: yo'lda → bojxona → keldi")}
        breadcrumb={<>{t("ombor", "Ombor")} · {t("nazorat", "Nazorat")} · {t("importYolda", "Import — Yo'lda")}</>}
        actions={
          <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-in-transit">
            <Plus className="h-4 w-4 mr-2" />
            {t("yangiJonatma", "Yangi jo'natma")}
          </Button>
        }
      />

      {/* KPI */}
      {isLoading ? (
        <EPSkeletonKpiRow count={4} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <Card key={k.label}>
              <CardContent className="pt-4 pb-3">
                <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Jo'natmalar jadvali */}
        <div className="xl:col-span-2">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4"><EPSkeletonTable rows={6} cols={6} /></div>
              ) : shipments.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">
                  <Ship className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>{t("jonatmalarYoq", "Jo'natmalar topilmadi")}</p>
                </div>
              ) : (
                <div className="ep-table-scroll">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("jonatmaRaqam", "Jo'natma №")}</TableHead>
                        <TableHead>{t("yetkazuvchi", "Yetkazuvchi")}</TableHead>
                        <TableHead>{t("davlat", "Davlat")}</TableHead>
                        <TableHead>{t("eta", "ETA")}</TableHead>
                        <TableHead>{t("status28", "Status")}</TableHead>
                        <TableHead className="text-right">{t("amallar", "Amallar")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shipments.map((s) => (
                        <TableRow key={s.id} data-testid={`row-in-transit-${s.id}`}>
                          <TableCell className="font-mono text-sm">{s.shipment_number}</TableCell>
                          <TableCell className="text-sm">{s.supplier_name ?? (s.supplier_id ?? "—")}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{s.origin_country ?? "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {s.eta ? new Date(s.eta).toLocaleDateString("uz-UZ") : "—"}
                          </TableCell>
                          <TableCell>{statusBadge(String(s.status))}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 justify-end flex-wrap">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => setDocShipment(s)}
                                data-testid={`button-docs-${s.id}`}
                                title={t("hujjatlar", "Hujjatlar")}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              {s.status === "shipped" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  disabled={customsMutation.isPending}
                                  onClick={() => customsMutation.mutate(s.id)}
                                  data-testid={`button-customs-${s.id}`}
                                >
                                  <ArrowRight className="h-3.5 w-3.5 mr-1" />
                                  {t("bojxona", "Bojxona")}
                                </Button>
                              )}
                              {s.status === "customs" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  disabled={arrivedMutation.isPending}
                                  onClick={() => arrivedMutation.mutate(s.id)}
                                  data-testid={`button-arrived-${s.id}`}
                                >
                                  <PackageCheck className="h-3.5 w-3.5 mr-1" />
                                  {t("keldi", "Keldi")}
                                </Button>
                              )}
                              {(s.status === "shipped" || s.status === "customs") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-[var(--ep-red)]"
                                  onClick={() => setConfirmCancel(s)}
                                  data-testid={`button-cancel-${s.id}`}
                                  title={t("bekorQilish", "Bekor qilish")}
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Yetkazuvchi reytingi panel */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-[var(--ep-yellow)]" />
                {t("yetkazuvchiReytingi", "Yetkazuvchi reytingi")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {ratingsLoading ? (
                <div className="p-4"><EPSkeletonTable rows={5} cols={2} /></div>
              ) : ratingRows.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  <Star className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>{t("reytingYoq", "Reyting ma'lumoti yo'q")}</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {ratingRows.map((r) => (
                    <div
                      key={r.vendorId}
                      className="flex items-center justify-between px-4 py-2.5"
                      data-testid={`rating-row-${r.vendorId}`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {r.vendorName ?? `#${r.vendorId}`}
                        </div>
                        {r.ratingLowFlag && (
                          <span className="text-[11px] text-[var(--ep-red)]">
                            {t("pastReyting", "Past reyting — PO ogohlantirish")}
                          </span>
                        )}
                      </div>
                      {ratingStars(r.rating)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* === Yangi jo'natma dialog === */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">
              {t("yangiImportJonatma", "Yangi import jo'natmasi")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <Label>{t("jonatmaRaqam", "Jo'natma raqami")} *</Label>
              <Input
                value={shipmentNumber}
                onChange={(e) => setShipmentNumber(e.target.value)}
                placeholder="SHP-2026-001"
                data-testid="input-shipment-number"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("yetkazuvchi", "Yetkazuvchi")}</Label>
                <Input value={supplierName} onChange={(e) => setSupplierName(e.target.value)} data-testid="input-supplier-name" />
              </div>
              <div>
                <Label>{t("davlat", "Davlat")}</Label>
                <Input value={originCountry} onChange={(e) => setOriginCountry(e.target.value)} placeholder="China" data-testid="input-origin-country" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("invoysRaqam", "Invoys №")}</Label>
                <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} data-testid="input-invoice-number" />
              </div>
              <div>
                <Label>{t("incoterm", "Incoterm")}</Label>
                <Input value={incoterm} onChange={(e) => setIncoterm(e.target.value)} placeholder="CIF" data-testid="input-incoterm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("valyuta", "Valyuta")}</Label>
                <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="USD" data-testid="input-currency" />
              </div>
              <div>
                <Label>{t("deklaratsiyaQiymat", "Deklaratsiya qiymati")}</Label>
                <Input
                  type="number"
                  value={declaredValue}
                  onChange={(e) => setDeclaredValue(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  data-testid="input-declared-value"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("jonatilganSana", "Jo'natilgan sana")}</Label>
                <Input type="date" value={shippedDate} onChange={(e) => setShippedDate(e.target.value)} data-testid="input-shipped-date" />
              </div>
              <div>
                <Label>{t("eta", "ETA (taxminiy)")}</Label>
                <Input type="date" value={eta} onChange={(e) => setEta(e.target.value)} data-testid="input-eta" />
              </div>
            </div>
            <div>
              <Label>{t("izoh", "Izoh")}</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} data-testid="input-notes" />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                {t("cancel", "Bekor qilish")}
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !shipmentNumber.trim()}
                data-testid="button-save-in-transit"
              >
                {t("Saqlash", "Saqlash")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* === Hujjatlar dialog === */}
      <Dialog open={docShipment != null} onOpenChange={(open) => { if (!open) { setDocShipment(null); resetDoc(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("importHujjatlari", "Import hujjatlari")} {docShipment ? `· ${docShipment.shipment_number}` : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Mavjud hujjatlar */}
            <div className="rounded-md border border-border">
              {documents.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {t("hujjatYoq", "Hujjat biriktirilmagan")}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {documents.map((d) => (
                    <div key={d.id} className="flex items-center justify-between px-3 py-2 text-sm" data-testid={`doc-row-${d.id}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className="text-xs">{d.doc_type}</Badge>
                        <span className="truncate">{d.doc_number ?? "—"}</span>
                      </div>
                      {d.file_url ? (
                        <a href={d.file_url} target="_blank" rel="noreferrer" className="text-xs text-[var(--ep-blue)] underline shrink-0">
                          {t("ochish", "Ochish")}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {d.issued_date ? new Date(d.issued_date).toLocaleDateString("uz-UZ") : "—"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Yangi hujjat biriktirish */}
            <div className="space-y-3 border-t border-border pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t("hujjatTuri", "Hujjat turi")} *</Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger data-testid="select-doc-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GTD">GTD (BYD)</SelectItem>
                      <SelectItem value="invoice">{t("invoys", "Invoys")}</SelectItem>
                      <SelectItem value="cert">{t("sertifikat", "Sertifikat")}</SelectItem>
                      <SelectItem value="packing_list">{t("packingList", "Packing list")}</SelectItem>
                      <SelectItem value="other">{t("boshqa", "Boshqa")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("hujjatRaqam", "Hujjat №")}</Label>
                  <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} data-testid="input-doc-number" />
                </div>
              </div>
              <div>
                <Label>{t("faylUrl", "Fayl URL")}</Label>
                <Input value={docFileUrl} onChange={(e) => setDocFileUrl(e.target.value)} placeholder="https://..." data-testid="input-doc-url" />
              </div>
              <div>
                <Label>{t("berilganSana", "Berilgan sana")}</Label>
                <Input type="date" value={docIssuedDate} onChange={(e) => setDocIssuedDate(e.target.value)} data-testid="input-doc-issued-date" />
              </div>
              <div>
                <Label>{t("izoh", "Izoh")}</Label>
                <Textarea value={docNotes} onChange={(e) => setDocNotes(e.target.value)} rows={2} data-testid="input-doc-notes" />
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => addDocMutation.mutate()}
                  disabled={addDocMutation.isPending || docShipment == null}
                  data-testid="button-add-document"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("hujjatBiriktirish", "Hujjat biriktirish")}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* === Bekor qilish tasdiq (Q-14) === */}
      <AlertDialog open={confirmCancel != null} onOpenChange={(open) => { if (!open) setConfirmCancel(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("jonatmaBekorTasdiq", "Jo'natmani bekor qilishni tasdiqlang")}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmCancel
                ? t("jonatmaBekorDesc", "Bu jo'natma bekor qilinadi va qaytarib bo'lmaydi.") + ` (${confirmCancel.shipment_number})`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel", "Bekor qilish")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[var(--ep-red)] hover:bg-[var(--ep-red)]/90"
              onClick={() => { if (confirmCancel) cancelMutation.mutate(confirmCancel.id); }}
              data-testid="button-confirm-cancel"
            >
              {t("hatBekorQilish", "Ha, bekor qilish")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

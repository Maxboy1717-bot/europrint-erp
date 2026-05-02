import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Briefcase, Stethoscope, UserCheck, Plus } from "lucide-react";
import type { LeaveRequest, SickLeaveRecord, BusinessTrip, TranslationFn } from "./profile-types";
import type { UseMutationResult } from "@tanstack/react-query";

interface LeaveTabProps {
  t: TranslationFn;
  tCommon: TranslationFn;
  leaveRequests: LeaveRequest[] | undefined;
  loadingLeaveRequests: boolean;
  leaveRequestDialogOpen: boolean;
  setLeaveRequestDialogOpen: (open: boolean) => void;
  leaveRequestForm: { leaveType: string; startDate: string; endDate: string; reason: string };
  setLeaveRequestForm: (form: LeaveTabProps["leaveRequestForm"]) => void;
  saveLeaveRequestMutation: UseMutationResult<unknown, Error, unknown, unknown>;
  sickLeaves: SickLeaveRecord[] | undefined;
  loadingSickLeaves: boolean;
  sickLeaveDialogOpen: boolean;
  setSickLeaveDialogOpen: (open: boolean) => void;
  sickLeaveForm: { startDate: string; endDate: string; diagnosis: string; hospitalName: string; doctorName: string; documentNumber: string; isPaid: boolean; paymentPercent: string };
  setSickLeaveForm: (form: LeaveTabProps["sickLeaveForm"]) => void;
  saveSickLeaveMutation: UseMutationResult<unknown, Error, unknown, unknown>;
  businessTrips: BusinessTrip[] | undefined;
  loadingBusinessTrips: boolean;
  businessTripDialogOpen: boolean;
  setBusinessTripDialogOpen: (open: boolean) => void;
  businessTripForm: { destination: string; purpose: string; startDate: string; endDate: string; dailyAllowance: string; transportCost: string; accommodationCost: string };
  setBusinessTripForm: (form: LeaveTabProps["businessTripForm"]) => void;
  saveBusinessTripMutation: UseMutationResult<unknown, Error, unknown, unknown>;
}

export function LeaveTab({
  t, tCommon,
  leaveRequests, loadingLeaveRequests, leaveRequestDialogOpen, setLeaveRequestDialogOpen,
  leaveRequestForm, setLeaveRequestForm, saveLeaveRequestMutation,
  sickLeaves, loadingSickLeaves, sickLeaveDialogOpen, setSickLeaveDialogOpen,
  sickLeaveForm, setSickLeaveForm, saveSickLeaveMutation,
  businessTrips, loadingBusinessTrips, businessTripDialogOpen, setBusinessTripDialogOpen,
  businessTripForm, setBusinessTripForm, saveBusinessTripMutation,
}: LeaveTabProps) {
  return (
    <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Ta'til so'rovlari</p>
                      <p className="text-3xl font-bold text-purple-600">{leaveRequests?.length || 0}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Kasallik varaqalari</p>
                      <p className="text-3xl font-bold text-blue-600">{sickLeaves?.length || 0}</p>
                    </div>
                    <Stethoscope className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Xizmat safaralari</p>
                      <p className="text-3xl font-bold text-orange-600">{businessTrips?.length || 0}</p>
                    </div>
                    <Briefcase className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Qolgan ta'til kunlari</p>
                      <p className="text-3xl font-bold text-green-600">24</p>
                    </div>
                    <UserCheck className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Ta'til so'rovlari
                  </CardTitle>
                  <CardDescription>Xodimning ta'til so'rovlari tarixi</CardDescription>
                </div>
                <Dialog open={leaveRequestDialogOpen} onOpenChange={setLeaveRequestDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-leave-request">
                      <Plus className="h-4 w-4 mr-2" />
                      Yangi so'rov
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Yangi ta'til so'rovi</DialogTitle>
                      <DialogDescription>Ta'til so'rovi ma'lumotlarini kiriting</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Ta'til turi</Label>
                        <Select
                          value={leaveRequestForm.leaveType}
                          onValueChange={(value) => setLeaveRequestForm({ ...leaveRequestForm, leaveType: value })}
                        >
                          <SelectTrigger data-testid="select-leave-type">
                            <SelectValue placeholder="Turni tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="annual">Yillik ta'til</SelectItem>
                            <SelectItem value="sick">Kasallik</SelectItem>
                            <SelectItem value="unpaid">Haq to'lanmaydigan</SelectItem>
                            <SelectItem value="maternity">Ona tug'ruq</SelectItem>
                            <SelectItem value="paternity">Ota tug'ruq</SelectItem>
                            <SelectItem value="study">O'quv ta'tili</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Boshlanish sanasi</Label>
                          <Input
                            type="date"
                            value={leaveRequestForm.startDate}
                            onChange={(e) => setLeaveRequestForm({ ...leaveRequestForm, startDate: e.target.value })}
                            data-testid="input-leave-start"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tugash sanasi</Label>
                          <Input
                            type="date"
                            value={leaveRequestForm.endDate}
                            onChange={(e) => setLeaveRequestForm({ ...leaveRequestForm, endDate: e.target.value })}
                            data-testid="input-leave-end"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Sabab</Label>
                        <Input
                          value={leaveRequestForm.reason}
                          onChange={(e) => setLeaveRequestForm({ ...leaveRequestForm, reason: e.target.value })}
                          placeholder="Ta'til sababi"
                          data-testid="input-leave-reason"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => saveLeaveRequestMutation.mutate(leaveRequestForm)}
                        disabled={saveLeaveRequestMutation.isPending || !leaveRequestForm.startDate || !leaveRequestForm.endDate}
                        data-testid="button-save-leave-request"
                      >
                        {saveLeaveRequestMutation.isPending ? tCommon('loading') : tCommon('save')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingLeaveRequests ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : leaveRequests && leaveRequests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Array.isArray(leaveRequests) ? leaveRequests : []).map((request: LeaveRequest) => {
                      const leaveTypeLabels: Record<string, string> = {
                        annual: "Yillik ta'til",
                        sick: "Kasallik",
                        unpaid: "Haq to'lanmaydigan",
                        maternity: "Ona tug'ruq",
                        paternity: "Ota tug'ruq",
                        study: "O'quv ta'tili"
                      };
                      const statusBadge = (status: string) => {
                        switch (status) {
                          case "pending": return <Badge className="bg-yellow-500">Kutilmoqda</Badge>;
                          case "approved": return <Badge className="bg-green-500">Tasdiqlangan</Badge>;
                          case "rejected": return <Badge variant="destructive">Rad etilgan</Badge>;
                          case "cancelled": return <Badge variant="secondary">Bekor qilindi</Badge>;
                          default: return <Badge variant="secondary">{status}</Badge>;
                        }
                      };
                      return (
                        <Card key={request.id} className="border" data-testid={`card-leave-request-${request.id}`}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-3">
                              <Badge variant="outline">{leaveTypeLabels[request.leaveType] || request.leaveType}</Badge>
                              {statusBadge(request.status)}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">{t('startDate')}</p>
                                <p className="font-medium">{request.startDate}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Tugash</p>
                                <p className="font-medium">{request.endDate}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Jami kunlar</p>
                                <p className="font-medium">{request.totalDays} kun</p>
                              </div>
                              {request.reason && (
                                <div>
                                  <p className="text-muted-foreground">Sabab</p>
                                  <p className="font-medium">{request.reason}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Ta'til so'rovlari mavjud emas
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    Kasallik varaqalari
                  </CardTitle>
                  <CardDescription>Tibbiy kasallik varaqalari ro'yxati</CardDescription>
                </div>
                <Dialog open={sickLeaveDialogOpen} onOpenChange={setSickLeaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-sick-leave">
                      <Plus className="h-4 w-4 mr-2" />
                      Yangi varaq
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Yangi kasallik varaqasi</DialogTitle>
                      <DialogDescription>Kasallik varaqasi ma'lumotlarini kiriting</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Boshlanish sanasi</Label>
                          <Input
                            type="date"
                            value={sickLeaveForm.startDate}
                            onChange={(e) => setSickLeaveForm({ ...sickLeaveForm, startDate: e.target.value })}
                            data-testid="input-sick-start"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tugash sanasi</Label>
                          <Input
                            type="date"
                            value={sickLeaveForm.endDate}
                            onChange={(e) => setSickLeaveForm({ ...sickLeaveForm, endDate: e.target.value })}
                            data-testid="input-sick-end"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Diagnoz</Label>
                        <Input
                          value={sickLeaveForm.diagnosis}
                          onChange={(e) => setSickLeaveForm({ ...sickLeaveForm, diagnosis: e.target.value })}
                          placeholder="Kasallik diagnozi"
                          data-testid="input-sick-diagnosis"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Kasalxona nomi</Label>
                          <Input
                            value={sickLeaveForm.hospitalName}
                            onChange={(e) => setSickLeaveForm({ ...sickLeaveForm, hospitalName: e.target.value })}
                            placeholder="Shifoxona nomi"
                            data-testid="input-sick-hospital"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Shifokor ismi</Label>
                          <Input
                            value={sickLeaveForm.doctorName}
                            onChange={(e) => setSickLeaveForm({ ...sickLeaveForm, doctorName: e.target.value })}
                            placeholder="Shifokor F.I.O"
                            data-testid="input-sick-doctor"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Hujjat raqami</Label>
                          <Input
                            value={sickLeaveForm.documentNumber}
                            onChange={(e) => setSickLeaveForm({ ...sickLeaveForm, documentNumber: e.target.value })}
                            placeholder="Varaq raqami"
                            data-testid="input-sick-document"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>To'lov foizi (%)</Label>
                          <Input
                            type="number"
                            value={sickLeaveForm.paymentPercent}
                            onChange={(e) => setSickLeaveForm({ ...sickLeaveForm, paymentPercent: e.target.value })}
                            placeholder="100"
                            data-testid="input-sick-payment"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => saveSickLeaveMutation.mutate(sickLeaveForm)}
                        disabled={saveSickLeaveMutation.isPending || !sickLeaveForm.startDate || !sickLeaveForm.endDate}
                        data-testid="button-save-sick-leave"
                      >
                        {saveSickLeaveMutation.isPending ? tCommon('loading') : tCommon('save')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingSickLeaves ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : sickLeaves && sickLeaves.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Array.isArray(sickLeaves) ? sickLeaves : []).map((sick: SickLeaveRecord) => (
                      <Card key={sick.id} className="border" data-testid={`card-sick-leave-${sick.id}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="outline">{sick.documentNumber || "Hujjat raqami yo'q"}</Badge>
                            {sick.isPaid ? (
                              <Badge className="bg-green-500">{sick.paymentPercent}% to'langan</Badge>
                            ) : (
                              <Badge variant="secondary">To'lanmagan</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Boshlanish</p>
                              <p className="font-medium">{sick.startDate}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Tugash</p>
                              <p className="font-medium">{sick.endDate}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Jami kunlar</p>
                              <p className="font-medium">{sick.totalDays} kun</p>
                            </div>
                            {sick.diagnosis && (
                              <div>
                                <p className="text-muted-foreground">Diagnoz</p>
                                <p className="font-medium">{sick.diagnosis}</p>
                              </div>
                            )}
                            {sick.hospitalName && (
                              <div>
                                <p className="text-muted-foreground">Kasalxona</p>
                                <p className="font-medium">{sick.hospitalName}</p>
                              </div>
                            )}
                            {sick.doctorName && (
                              <div>
                                <p className="text-muted-foreground">Shifokor</p>
                                <p className="font-medium">{sick.doctorName}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Kasallik varaqalari mavjud emas
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Xizmat safaralari
                  </CardTitle>
                  <CardDescription>Xodimning xizmat safaralari tarixi</CardDescription>
                </div>
                <Dialog open={businessTripDialogOpen} onOpenChange={setBusinessTripDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-business-trip">
                      <Plus className="h-4 w-4 mr-2" />
                      Yangi safar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Yangi xizmat safari</DialogTitle>
                      <DialogDescription>Xizmat safari ma'lumotlarini kiriting</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Manzil</Label>
                        <Input
                          value={businessTripForm.destination}
                          onChange={(e) => setBusinessTripForm({ ...businessTripForm, destination: e.target.value })}
                          placeholder="Samarqand shahri"
                          data-testid="input-trip-destination"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Maqsad</Label>
                        <Input
                          value={businessTripForm.purpose}
                          onChange={(e) => setBusinessTripForm({ ...businessTripForm, purpose: e.target.value })}
                          placeholder="Safari maqsadi"
                          data-testid="input-trip-purpose"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Boshlanish sanasi</Label>
                          <Input
                            type="date"
                            value={businessTripForm.startDate}
                            onChange={(e) => setBusinessTripForm({ ...businessTripForm, startDate: e.target.value })}
                            data-testid="input-trip-start"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tugash sanasi</Label>
                          <Input
                            type="date"
                            value={businessTripForm.endDate}
                            onChange={(e) => setBusinessTripForm({ ...businessTripForm, endDate: e.target.value })}
                            data-testid="input-trip-end"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Kunlik xarajat (so'm)</Label>
                          <Input
                            type="number"
                            value={businessTripForm.dailyAllowance}
                            onChange={(e) => setBusinessTripForm({ ...businessTripForm, dailyAllowance: e.target.value })}
                            placeholder="150000"
                            data-testid="input-trip-daily"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Transport (so'm)</Label>
                          <Input
                            type="number"
                            value={businessTripForm.transportCost}
                            onChange={(e) => setBusinessTripForm({ ...businessTripForm, transportCost: e.target.value })}
                            placeholder="500000"
                            data-testid="input-trip-transport"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Yashash (so'm)</Label>
                          <Input
                            type="number"
                            value={businessTripForm.accommodationCost}
                            onChange={(e) => setBusinessTripForm({ ...businessTripForm, accommodationCost: e.target.value })}
                            placeholder="300000"
                            data-testid="input-trip-accommodation"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => saveBusinessTripMutation.mutate(businessTripForm)}
                        disabled={saveBusinessTripMutation.isPending || !businessTripForm.destination || !businessTripForm.startDate || !businessTripForm.endDate}
                        data-testid="button-save-business-trip"
                      >
                        {saveBusinessTripMutation.isPending ? tCommon('loading') : tCommon('save')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loadingBusinessTrips ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : businessTrips && businessTrips.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Array.isArray(businessTrips) ? businessTrips : []).map((trip: BusinessTrip) => {
                      const tripStatusBadge = (status: string) => {
                        switch (status) {
                          case "planned": return <Badge className="bg-blue-500">Rejalashtirilgan</Badge>;
                          case "in_progress": return <Badge className="bg-yellow-500">Jarayonda</Badge>;
                          case "completed": return <Badge className="bg-green-500">Tugallangan</Badge>;
                          case "cancelled": return <Badge variant="secondary">Bekor qilindi</Badge>;
                          default: return <Badge variant="secondary">{status}</Badge>;
                        }
                      };
                      return (
                        <Card key={trip.id} className="border" data-testid={`card-business-trip-${trip.id}`}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="font-medium">{trip.destination}</div>
                              {tripStatusBadge(trip.status)}
                            </div>
                            {trip.purpose && (
                              <p className="text-sm text-muted-foreground mb-3">{trip.purpose}</p>
                            )}
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">{t('startDate')}</p>
                                <p className="font-medium">{trip.startDate}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Tugash</p>
                                <p className="font-medium">{trip.endDate}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Jami kunlar</p>
                                <p className="font-medium">{trip.totalDays} kun</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Jami xarajat</p>
                                <p className="font-medium">{(trip.totalCost || 0).toLocaleString()} so'm</p>
                              </div>
                            </div>
                            {(trip.dailyAllowance || trip.transportCost || trip.accommodationCost) && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs text-muted-foreground mb-2">Xarajatlar tafsiloti:</p>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  {trip.dailyAllowance > 0 && (
                                    <div>
                                      <p className="text-muted-foreground">Kunlik</p>
                                      <p>{trip.dailyAllowance.toLocaleString()} so'm</p>
                                    </div>
                                  )}
                                  {trip.transportCost > 0 && (
                                    <div>
                                      <p className="text-muted-foreground">Transport</p>
                                      <p>{trip.transportCost.toLocaleString()} so'm</p>
                                    </div>
                                  )}
                                  {trip.accommodationCost > 0 && (
                                    <div>
                                      <p className="text-muted-foreground">Yashash</p>
                                      <p>{trip.accommodationCost.toLocaleString()} so'm</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Xizmat safaralari mavjud emas
                  </p>
                )}
              </CardContent>
            </Card>
    </div>
  );
}

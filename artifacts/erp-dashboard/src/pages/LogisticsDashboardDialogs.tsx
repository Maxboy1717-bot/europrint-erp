/**
 * @module LogisticsDashboardDialogs
 * @description React page component. Route-level UI.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
;
import { type Vehicle } from "./LogisticsDashboardVehiclesTab";

import { EPLoader } from "@/components/ep";
import { useTranslation } from '@/lib/i18n';
interface VehicleForm {
  plateNumber: string;
  model: string;
  type: string;
  driverName: string;
  fuelLevel: string;
  mileage: string;
  loadCapacity: string;
  insuranceExpiry: string;
}

interface FuelForm {
  vehicleId: string;
  date: string;
  liters: string;
  costPerLiter: string;
  station: string;
  mileage: string;
}

interface DeliveryForm {
  orderNo: string;
  customerName: string;
  address: string;
  vehicleId: string;
  driverName: string;
  estimatedArrival: string;
  weight: string;
  cost: string;
}

interface Props {
  vehicleList: Vehicle[];
  addVehicleOpen: boolean;
  setAddVehicleOpen: (v: boolean) => void;
  vehicleForm: VehicleForm;
  setVehicleForm: (fn: (p: VehicleForm) => VehicleForm) => void;
  onSubmitVehicle: () => void;
  isSubmittingVehicle: boolean;
  addFuelOpen: boolean;
  setAddFuelOpen: (v: boolean) => void;
  fuelForm: FuelForm;
  setFuelForm: (fn: (p: FuelForm) => FuelForm) => void;
  onSubmitFuel: () => void;
  isSubmittingFuel: boolean;
  addDeliveryOpen: boolean;
  setAddDeliveryOpen: (v: boolean) => void;
  deliveryForm: DeliveryForm;
  setDeliveryForm: (fn: (p: DeliveryForm) => DeliveryForm) => void;
  onSubmitDelivery: () => void;
  isSubmittingDelivery: boolean;
}

export function LogisticsDashboardDialogs({
  vehicleList,
  addVehicleOpen, setAddVehicleOpen, vehicleForm, setVehicleForm, onSubmitVehicle, isSubmittingVehicle,
  addFuelOpen, setAddFuelOpen, fuelForm, setFuelForm, onSubmitFuel, isSubmittingFuel,
  addDeliveryOpen, setAddDeliveryOpen, deliveryForm, setDeliveryForm, onSubmitDelivery, isSubmittingDelivery,
}: Props) {
  const { t } = useTranslation("common");
  return (
    <>
      {/* Mashina Qo'shish */}
      <Dialog open={addVehicleOpen} onOpenChange={setAddVehicleOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("mashinaQoshish")}</DialogTitle>
            <DialogDescription>{t("transportParkigaYangiAvtomobilQoshing")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">{t("davlatRaqami")}</label>
              <Input value={vehicleForm.plateNumber} onChange={e => setVehicleForm(p => ({ ...p, plateNumber: e.target.value }))} placeholder={t("k01A123Aa")} data-testid="input-vehicle-plate" />
            </div>
            <div>
              <label className="text-sm font-medium">{t("model")}</label>
              <Input value={vehicleForm.model} onChange={e => setVehicleForm(p => ({ ...p, model: e.target.value }))} placeholder={t("manTgs18400")} data-testid="input-vehicle-model" />
            </div>
            <div>
              <label className="text-sm font-medium">{t("type")}</label>
              <Select value={vehicleForm.type} onValueChange={v => setVehicleForm(p => ({ ...p, type: v }))}>
                <SelectTrigger data-testid="select-vehicle-type" className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="own">{t("ozTransport")}</SelectItem>
                  <SelectItem value="rental">{t("ijara")}</SelectItem>
                  <SelectItem value="external">{t("tashqi")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{t("haydovchi")}</label>
              <Input value={vehicleForm.driverName} onChange={e => setVehicleForm(p => ({ ...p, driverName: e.target.value }))} placeholder={t("raximovSardor")} data-testid="input-vehicle-driver" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">{t("sugurtaMuddati")}</label>
                <Input type="date" value={vehicleForm.insuranceExpiry} onChange={e => setVehicleForm(p => ({ ...p, insuranceExpiry: e.target.value }))} data-testid="input-vehicle-insurance" />
              </div>
              <div>
                <label className="text-sm font-medium">{t("yukKoTarishKg")}</label>
                <Input type="number" value={vehicleForm.loadCapacity} onChange={e => setVehicleForm(p => ({ ...p, loadCapacity: e.target.value }))} placeholder="5000" data-testid="input-vehicle-capacity" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddVehicleOpen(false)}>{t("Bekor")}</Button>
            <Button onClick={onSubmitVehicle} disabled={isSubmittingVehicle} data-testid="button-submit-vehicle">
              {isSubmittingVehicle ? <EPLoader className="w-4 h-4 mr-2" /> : null}Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Yoqilg'i Dialog */}
      <Dialog open={addFuelOpen} onOpenChange={setAddFuelOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("yoqilgiQoshish")}</DialogTitle>
            <DialogDescription>{t("mashinaYoqilgiSarfiniQaydEting")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">{t("mashina1")}</label>
              <Select value={fuelForm.vehicleId} onValueChange={v => setFuelForm(p => ({ ...p, vehicleId: v }))}>
                <SelectTrigger data-testid="select-fuel-vehicle" className="h-9"><SelectValue placeholder={t("mashinaniTanlang")} /></SelectTrigger>
                <SelectContent>
                  {(Array.isArray(vehicleList) ? vehicleList : []).map(v => <SelectItem key={v.id} value={v.id}>{v.plateNumber} — {v.model}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{t("sana")}</label>
              <Input type="date" value={fuelForm.date} onChange={e => setFuelForm(p => ({ ...p, date: e.target.value }))} data-testid="input-fuel-date" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">{t("litri")}</label>
                <Input type="number" value={fuelForm.liters} onChange={e => setFuelForm(p => ({ ...p, liters: e.target.value }))} placeholder="120" data-testid="input-fuel-liters" />
              </div>
              <div>
                <label className="text-sm font-medium">{t("narxiSoML")}</label>
                <Input type="number" value={fuelForm.costPerLiter} onChange={e => setFuelForm(p => ({ ...p, costPerLiter: e.target.value }))} data-testid="input-fuel-price" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{t("stantsiya")}</label>
              <Input value={fuelForm.station} onChange={e => setFuelForm(p => ({ ...p, station: e.target.value }))} placeholder={t("lukoilYunusobod")} data-testid="input-fuel-station" />
            </div>
            <div>
              <label className="text-sm font-medium">{t("probegKm")}</label>
              <Input type="number" value={fuelForm.mileage} onChange={e => setFuelForm(p => ({ ...p, mileage: e.target.value }))} placeholder="125400" data-testid="input-fuel-mileage" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddFuelOpen(false)}>{t("Bekor")}</Button>
            <Button onClick={onSubmitFuel} disabled={isSubmittingFuel} data-testid="button-submit-fuel">
              {isSubmittingFuel ? <EPLoader className="w-4 h-4 mr-2" /> : null}Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Yetkazish Dialog */}
      <Dialog open={addDeliveryOpen} onOpenChange={setAddDeliveryOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold">{t("yetkazibBerishQoshish")}</DialogTitle>
            <DialogDescription>{t("yangiYetkazibBerishRejalashtiring")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">{t("buyurtmaRaqami")}</label>
              <Input value={deliveryForm.orderNo} onChange={e => setDeliveryForm(p => ({ ...p, orderNo: e.target.value }))} placeholder="SO-2026-001" data-testid="input-delivery-order" />
            </div>
            <div>
              <label className="text-sm font-medium">{t("mijoz2")}</label>
              <Input value={deliveryForm.customerName} onChange={e => setDeliveryForm(p => ({ ...p, customerName: e.target.value }))} placeholder={t("alifNashriyot")} data-testid="input-delivery-customer" />
            </div>
            <div>
              <label className="text-sm font-medium">{t("address")}</label>
              <Input value={deliveryForm.address} onChange={e => setDeliveryForm(p => ({ ...p, address: e.target.value }))} placeholder={t("yunusobodToshkent")} data-testid="input-delivery-address" />
            </div>
            <div>
              <label className="text-sm font-medium">{t("mashina")}</label>
              <Select value={deliveryForm.vehicleId} onValueChange={v => {
                const veh = (Array.isArray(vehicleList) ? vehicleList : []).find(x => x.id === v);
                setDeliveryForm(p => ({ ...p, vehicleId: v, driverName: veh?.driverName || p.driverName }));
              }}>
                <SelectTrigger data-testid="select-delivery-vehicle" className="h-9"><SelectValue placeholder={t("mashinaniTanlang")} /></SelectTrigger>
                <SelectContent>
                  {(Array.isArray(vehicleList) ? vehicleList : []).filter(v => v.status !== "maintenance" && v.status !== "retired").map(v => <SelectItem key={v.id} value={v.id}>{v.plateNumber} — {v.model}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{t("haydovchi")}</label>
              <Input value={deliveryForm.driverName} onChange={e => setDeliveryForm(p => ({ ...p, driverName: e.target.value }))} placeholder={t("raximovSardor")} data-testid="input-delivery-driver" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">ETA</label>
                <Input type="datetime-local" value={deliveryForm.estimatedArrival} onChange={e => setDeliveryForm(p => ({ ...p, estimatedArrival: e.target.value }))} data-testid="input-delivery-eta" />
              </div>
              <div>
                <label className="text-sm font-medium">{t("ogIrlikKg")}</label>
                <Input type="number" value={deliveryForm.weight} onChange={e => setDeliveryForm(p => ({ ...p, weight: e.target.value }))} placeholder="2400" data-testid="input-delivery-weight" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDeliveryOpen(false)}>{t("Bekor")}</Button>
            <Button onClick={onSubmitDelivery} disabled={isSubmittingDelivery} data-testid="button-submit-delivery">
              {isSubmittingDelivery ? <EPLoader className="w-4 h-4 mr-2" /> : null}Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

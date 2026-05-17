import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User, MapPin, Phone, Users, Home, Cake, IdCard, Landmark,
  Contact, PhoneCall, Trash2, Edit, Plus, Briefcase, DollarSign, Building2
} from "lucide-react";
import type {
  Employee, PassportData, BankAccount, EmergencyContact, TranslationFn
} from "./profile-types";
import type { UseMutationResult } from "@tanstack/react-query";
import { RoleGate, PII_VIEWER_ROLES } from "@/components/RoleGate";

interface PersonalTabProps {
  employee: Employee;
  t: TranslationFn;
  tCommon: TranslationFn;
  passportData: PassportData | null | undefined;
  loadingPassport: boolean;
  passportDialogOpen: boolean;
  setPassportDialogOpen: (open: boolean) => void;
  passportForm: {
    passportNumber: string;
    passportSeries: string;
    issuedBy: string;
    issuedDate: string;
    expiryDate: string;
    birthPlace: string;
    citizenship: string;
  };
  setPassportForm: (form: PersonalTabProps["passportForm"]) => void;
  savePassportMutation: UseMutationResult<unknown, Error, any, unknown>;
  bankAccounts: BankAccount[] | undefined;
  loadingBanks: boolean;
  bankDialogOpen: boolean;
  setBankDialogOpen: (open: boolean) => void;
  bankForm: {
    bankName: string;
    accountNumber: string;
    cardNumber: string;
    cardHolderName: string;
    mfo: string;
    inn: string;
    isPrimary: boolean;
  };
  setBankForm: (form: PersonalTabProps["bankForm"]) => void;
  saveBankMutation: UseMutationResult<unknown, Error, any, unknown>;
  emergencyContacts: EmergencyContact[] | undefined;
  loadingEmergency: boolean;
  emergencyDialogOpen: boolean;
  setEmergencyDialogOpen: (open: boolean) => void;
  emergencyForm: {
    contactName: string;
    relationship: string;
    phoneNumber: string;
    alternativePhone: string;
    address: string;
    isPrimary: boolean;
  };
  setEmergencyForm: (form: PersonalTabProps["emergencyForm"]) => void;
  saveEmergencyMutation: UseMutationResult<unknown, Error, any, unknown>;
}

export function PersonalTab({
  employee, t, tCommon,
  passportData, loadingPassport, passportDialogOpen, setPassportDialogOpen,
  passportForm, setPassportForm, savePassportMutation,
  bankAccounts, loadingBanks, bankDialogOpen, setBankDialogOpen,
  bankForm, setBankForm, saveBankMutation,
  emergencyContacts, loadingEmergency, emergencyDialogOpen, setEmergencyDialogOpen,
  emergencyForm, setEmergencyForm, saveEmergencyMutation,
}: PersonalTabProps) {
  return (
    <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {t('personalInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('fullName')}</p>
                      <p className="font-medium">{employee.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('birthDate')}</p>
                      <p className="font-medium flex items-center gap-2">
                        <Cake className="h-4 w-4" />
                        {employee.birthDate || tCommon('notSpecified')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('age')}</p>
                      <p className="font-medium">{employee.age || tCommon('unknown')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('gender')}</p>
                      <p className="font-medium">{employee.gender === "erkak" ? t('male') : employee.gender === "ayol" ? t('female') : tCommon('notSpecified')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    {t('contactInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{tCommon('phone')}</p>
                        <p className="font-medium">{employee.phone || tCommon('notSpecified')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('address')}</p>
                        <p className="font-medium">{employee.address || tCommon('notSpecified')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t('district')}</p>
                        <p className="font-medium">{employee.district || tCommon('notSpecified')}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Ish shartlari
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Maosh turi</p>
                      {employee.salaryType ? (
                        <div className="flex items-center gap-2 mt-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            {(employee.salaryType === "monthly" || employee.salaryType === "oylik") && (
                              <div>
                                <p className="font-medium">Oylik stavka</p>
                                <p className="text-xs text-muted-foreground">Belgilangan oylik maosh</p>
                              </div>
                            )}
                            {(employee.salaryType === "hourly" || employee.salaryType === "soatbay") && (
                              <div>
                                <p className="font-medium">Soatbay</p>
                                <p className="text-xs text-muted-foreground">Ish soati × soatlik tarif</p>
                              </div>
                            )}
                            {(employee.salaryType === "piecework" || employee.salaryType === "ishbay") && (
                              <div>
                                <p className="font-medium">Akkord (Ishbay)</p>
                                <p className="text-xs text-muted-foreground">Miqdor × tarif formulasi</p>
                              </div>
                            )}
                            {employee.salaryType === "contract" && (
                              <div>
                                <p className="font-medium">Shartnoma asosida</p>
                                <p className="text-xs text-muted-foreground">Alohida shartnoma shartlari</p>
                              </div>
                            )}
                            {!["monthly", "hourly", "piecework", "contract", "oylik", "soatbay", "ishbay"].includes(employee.salaryType) && (
                              <p className="font-medium">{employee.salaryType}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="font-medium text-muted-foreground">{tCommon('notSpecified')}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Smena</p>
                      <p className="font-medium">{employee.shift || tCommon('notSpecified')}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Sex / Zona</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{employee.workshopZone || employee.departmentName || tCommon('notSpecified')}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {t('familyInfo')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('maritalStatus')}</p>
                      <p className="font-medium">{employee.maritalStatus || tCommon('notSpecified')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('childrenCount')}</p>
                      <p className="font-medium">{employee.childrenCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('householdSize')}</p>
                      <p className="font-medium">{employee.householdSize || tCommon('notSpecified')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('housingType')}</p>
                      <p className="font-medium">
                        {employee.housingType === "ijara" ? "Ijaraga olingan"
                          : (employee.housingType === "shaxsiy" || employee.housingType === "shaxsiy uy") ? "Shaxsiy uy"
                          : employee.housingType === "kvartira" ? "Kvartira"
                          : employee.housingType === "yotoqxona" ? "Yotoqxona"
                          : employee.housingType === "qarindoshlar bilan" ? "Qarindoshlar bilan"
                          : employee.housingType || tCommon('notSpecified')}
                      </p>
                    </div>
                  </div>
                  {employee.householdMembers && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t('householdMembers')}</p>
                      <p className="font-medium">{employee.householdMembers}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <IdCard className="h-5 w-5" />
                    {t('passportInfo')}
                  </CardTitle>
                  <Dialog open={passportDialogOpen} onOpenChange={setPassportDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-edit-passport">
                        {passportData ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>{t('passportInfo')}</DialogTitle>
                        <DialogDescription>{t('employeeDetails')}</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>{t('passportSeries')}</Label>
                            <Input
                              value={passportForm.passportSeries}
                              onChange={(e) => setPassportForm({ ...passportForm, passportSeries: e.target.value })}
                              placeholder="AA"
                              data-testid="input-passport-series"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('passportNumber')}</Label>
                            <Input
                              value={passportForm.passportNumber}
                              onChange={(e) => setPassportForm({ ...passportForm, passportNumber: e.target.value })}
                              placeholder="1234567"
                              data-testid="input-passport-number"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('issuedBy')}</Label>
                          <Input
                            value={passportForm.issuedBy}
                            onChange={(e) => setPassportForm({ ...passportForm, issuedBy: e.target.value })}
                            placeholder="IIV"
                            data-testid="input-passport-issued-by"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>{t('issuedDate')}</Label>
                            <Input
                              type="date"
                              value={passportForm.issuedDate}
                              onChange={(e) => setPassportForm({ ...passportForm, issuedDate: e.target.value })}
                              data-testid="input-passport-issued-date"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('expiryDate')}</Label>
                            <Input
                              type="date"
                              value={passportForm.expiryDate}
                              onChange={(e) => setPassportForm({ ...passportForm, expiryDate: e.target.value })}
                              data-testid="input-passport-expiry-date"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('birthPlace')}</Label>
                          <Input
                            value={passportForm.birthPlace}
                            onChange={(e) => setPassportForm({ ...passportForm, birthPlace: e.target.value })}
                            placeholder="Toshkent shahri"
                            data-testid="input-passport-birth-place"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('citizenship')}</Label>
                          <Input
                            value={passportForm.citizenship}
                            onChange={(e) => setPassportForm({ ...passportForm, citizenship: e.target.value })}
                            placeholder="Uzbekistan"
                            data-testid="input-passport-citizenship"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => savePassportMutation.mutate(passportForm)}
                          disabled={savePassportMutation.isPending || !passportForm.passportNumber}
                          data-testid="button-save-passport"
                        >
                          {savePassportMutation.isPending ? tCommon('loading') : tCommon('save')}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {loadingPassport ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ) : passportData ? (
                    <RoleGate
                      roles={PII_VIEWER_ROLES}
                      ownerUserId={employee.id}
                      fallback={
                        <div className="text-muted-foreground text-center py-8" data-testid="passport-masked">
                          <p className="text-sm">Pasport ma'lumotlari maxfiy</p>
                          <p className="text-xs mt-1">Faqat HR ko'ra oladi</p>
                        </div>
                      }
                    >
                      <div className="grid grid-cols-2 gap-4" data-testid="passport-data">
                        <div>
                          <p className="text-sm text-muted-foreground">{t('passportSeries')}</p>
                          <p className="font-medium">{passportData.passportSeries} {passportData.passportNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('issuedBy')}</p>
                          <p className="font-medium">{passportData.issuedBy || tCommon('notSpecified')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('issuedDate')}</p>
                          <p className="font-medium">{passportData.issuedDate || tCommon('notSpecified')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('expiryDate')}</p>
                          <p className="font-medium">{passportData.expiryDate || tCommon('notSpecified')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('birthPlace')}</p>
                          <p className="font-medium">{passportData.birthPlace || tCommon('notSpecified')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('citizenship')}</p>
                          <p className="font-medium">{passportData.citizenship || "Uzbekistan"}</p>
                        </div>
                      </div>
                    </RoleGate>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      {tCommon('noData')}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Landmark className="h-5 w-5" />
                    {t('bankDetails')}
                  </CardTitle>
                  <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-add-bank">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>{t('bankDetails')}</DialogTitle>
                        <DialogDescription>{t('employeeDetails')}</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label>{t('bankName')}</Label>
                          <Input
                            value={bankForm.bankName}
                            onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                            placeholder="Xalq banki"
                            data-testid="input-bank-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('accountNumber')}</Label>
                          <Input
                            value={bankForm.accountNumber}
                            onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                            placeholder="20208000..."
                            data-testid="input-account-number"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>{t('cardNumber')}</Label>
                            <Input
                              value={bankForm.cardNumber}
                              onChange={(e) => setBankForm({ ...bankForm, cardNumber: e.target.value })}
                              placeholder="8600..."
                              data-testid="input-card-number"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('cardHolder')}</Label>
                            <Input
                              value={bankForm.cardHolderName}
                              onChange={(e) => setBankForm({ ...bankForm, cardHolderName: e.target.value })}
                              placeholder="Ism Familiya"
                              data-testid="input-card-holder"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>MFO</Label>
                            <Input
                              value={bankForm.mfo}
                              onChange={(e) => setBankForm({ ...bankForm, mfo: e.target.value })}
                              placeholder="00014"
                              data-testid="input-mfo"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>INN</Label>
                            <Input
                              value={bankForm.inn}
                              onChange={(e) => setBankForm({ ...bankForm, inn: e.target.value })}
                              placeholder="123456789"
                              data-testid="input-inn"
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => saveBankMutation.mutate(bankForm)}
                          disabled={saveBankMutation.isPending || !bankForm.bankName || !bankForm.accountNumber}
                          data-testid="button-save-bank"
                        >
                          {saveBankMutation.isPending ? tCommon('loading') : tCommon('save')}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {loadingBanks ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : bankAccounts && bankAccounts.length > 0 ? (
                    <RoleGate
                      roles={PII_VIEWER_ROLES}
                      ownerUserId={employee.id}
                      fallback={
                        <div className="text-muted-foreground text-center py-8" data-testid="bank-masked">
                          <p className="text-sm">Bank ma'lumotlari maxfiy</p>
                          <p className="text-xs mt-1">Faqat HR ko'ra oladi</p>
                        </div>
                      }
                    >
                      <div className="space-y-4" data-testid="bank-data">
                        {(Array.isArray(bankAccounts) ? bankAccounts : []).map((bank: BankAccount) => (
                          <div key={bank.id} className="p-3 border rounded-md space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{bank.bankName}</p>
                              {bank.isPrimary && <Badge variant="secondary">{tCommon('primary')}</Badge>}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">{t('accountNumber')}</p>
                                <p>{bank.accountNumber}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">{t('cardNumber')}</p>
                                <p>{bank.cardNumber || tCommon('notSpecified')}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">MFO</p>
                                <p>{bank.mfo || tCommon('notSpecified')}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">INN</p>
                                <p>{bank.inn || tCommon('notSpecified')}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </RoleGate>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      {tCommon('noData')}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Contact className="h-5 w-5" />
                    {t('emergencyContacts')}
                  </CardTitle>
                  <Dialog open={emergencyDialogOpen} onOpenChange={setEmergencyDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-add-emergency">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>{t('emergencyContacts')}</DialogTitle>
                        <DialogDescription>{t('employeeDetails')}</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>{t('contactName')}</Label>
                            <Input
                              value={emergencyForm.contactName}
                              onChange={(e) => setEmergencyForm({ ...emergencyForm, contactName: e.target.value })}
                              placeholder="Ism Familiya"
                              data-testid="input-emergency-name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('relationship')}</Label>
                            <Input
                              value={emergencyForm.relationship}
                              onChange={(e) => setEmergencyForm({ ...emergencyForm, relationship: e.target.value })}
                              placeholder="Ota / Ona / Turmush o'rtog'i"
                              data-testid="input-emergency-relationship"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>{tCommon('phone')}</Label>
                            <Input
                              value={emergencyForm.phoneNumber}
                              onChange={(e) => setEmergencyForm({ ...emergencyForm, phoneNumber: e.target.value })}
                              placeholder="+998 90 123 45 67"
                              data-testid="input-emergency-phone"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('alternativePhone')}</Label>
                            <Input
                              value={emergencyForm.alternativePhone}
                              onChange={(e) => setEmergencyForm({ ...emergencyForm, alternativePhone: e.target.value })}
                              placeholder="+998 90 123 45 67"
                              data-testid="input-emergency-alt-phone"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('address')}</Label>
                          <Input
                            value={emergencyForm.address}
                            onChange={(e) => setEmergencyForm({ ...emergencyForm, address: e.target.value })}
                            placeholder="Manzil"
                            data-testid="input-emergency-address"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => saveEmergencyMutation.mutate(emergencyForm)}
                          disabled={saveEmergencyMutation.isPending || !emergencyForm.contactName || !emergencyForm.phoneNumber}
                          data-testid="button-save-emergency"
                        >
                          {saveEmergencyMutation.isPending ? tCommon('loading') : tCommon('save')}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {loadingEmergency ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : emergencyContacts && emergencyContacts.length > 0 ? (
                    <div className="space-y-4">
                      {(Array.isArray(emergencyContacts) ? emergencyContacts : []).map((contact: EmergencyContact) => (
                        <div key={contact.id} className="p-3 border rounded-md space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <PhoneCall className="h-4 w-4 text-red-500" />
                              <p className="font-medium">{contact.contactName}</p>
                            </div>
                            {contact.isPrimary && <Badge variant="secondary">{tCommon('primary')}</Badge>}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">{t('relationship')}</p>
                              <p>{contact.relationship || tCommon('notSpecified')}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">{tCommon('phone')}</p>
                              <p>{contact.phoneNumber}</p>
                            </div>
                            {contact.alternativePhone && (
                              <div>
                                <p className="text-muted-foreground">{t('alternativePhone')}</p>
                                <p>{contact.alternativePhone}</p>
                              </div>
                            )}
                            {contact.address && (
                              <div>
                                <p className="text-muted-foreground">{t('address')}</p>
                                <p>{contact.address}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      {tCommon('noData')}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
    </div>
  );
}

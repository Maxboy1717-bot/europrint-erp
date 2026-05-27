/**
 * @module LoginForm
 * @description React UI component.
 */

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Phone, Hash } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from '@/lib/i18n';

interface LoginFormProps {
  onLogin?: (phone: string, employeeId: string) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const { t } = useTranslation("common");
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"phone" | "otp" | "employeeId">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  // sessionId is returned by /api/auth/resend-otp and required by /api/auth/verify-otp
  const [sessionId, setSessionId] = useState<string>("");

  const requestOtpMutation = useMutation({
    // POST /api/auth/resend-otp — creates an OTP session identified by the
    // caller's IP address and returns { sessionId, expiresIn }.
    // Phone is included in the body for future SMS routing but the current
    // backend derives the identifier from req.ip.
    mutationFn: () =>
      apiRequest<{ sessionId: string; expiresIn: number }>(
        "POST",
        "/api/auth/resend-otp",
        { phone },
      ),
    onSuccess: (data) => {
      // Store the sessionId so the verify step can submit it to the backend.
      setSessionId(data?.sessionId ?? "");
      setStep("otp");
    },
  });

  const verifyOtpMutation = useMutation({
    // POST /api/auth/verify-otp — validates { code, sessionId }.
    // Server sets the httpOnly access_token cookie on success.
    // Frontend doesn't store the token — `credentials: 'include'` in
    // apiRequest sends the cookie back on every subsequent call.
    mutationFn: () =>
      apiRequest<{ success: boolean; message: string }>(
        "POST",
        "/api/auth/verify-otp",
        { code: otp, sessionId },
      ),
    onSuccess: () => {
      setStep("employeeId");
    },
  });

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneRegex = /^\+998\d{9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setPhoneError("To'g'ri format: +998 XX XXX XX XX");
      return;
    }
    setPhoneError(null);
    requestOtpMutation.mutate();
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyOtpMutation.mutate();
  };

  const handleEmployeeIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin?.(phone, employeeId);
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-md bg-primary flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-[14px] font-semibold">{t("europrintSystem")}</CardTitle>
          <CardDescription>
            {step === "phone" && "Telefon raqamingizni kiriting"}
            {step === "otp" && "SMS orqali yuborilgan kodni kiriting"}
            {step === "employeeId" && "Tabel raqamingizni kiriting"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "phone" && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-1">
          <Label htmlFor="phone">{t("telefonRaqami")}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+998 90 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                    data-testid="input-phone"
                  />
                </div>
                {phoneError && <p className="text-sm text-destructive">{phoneError}</p>}
              </div>
              {requestOtpMutation.isError && (
                <p className="text-sm text-destructive">
                  {(requestOtpMutation.error as Error)?.message ?? "Xatolik yuz berdi"}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={requestOtpMutation.isPending}
                data-testid="button-send-otp"
              >
                {requestOtpMutation.isPending ? "Yuborilmoqda..." : "SMS kod yuborish"}
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="space-y-1">
          <Label htmlFor="otp">{t("tasdiqlashKodi")}</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  className="text-center text-lg tracking-widest"
                  data-testid="input-otp"
                />
              </div>
              {verifyOtpMutation.isError && (
                <p className="text-sm text-destructive">
                  {(verifyOtpMutation.error as Error)?.message ?? "Noto'g'ri kod"}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("phone")}
                  data-testid="button-back"
                >
                  {t("back")}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={verifyOtpMutation.isPending}
                  data-testid="button-verify-otp"
                >
                  {verifyOtpMutation.isPending ? "Tekshirilmoqda..." : "Tasdiqlash"}
                </Button>
              </div>
            </form>
          )}

          {step === "employeeId" && (
            <form onSubmit={handleEmployeeIdSubmit} className="space-y-4">
              <div className="space-y-1">
          <Label htmlFor="employeeId">{t("tabelRaqami")}</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="employeeId"
                    type="text"
                    placeholder="EP-2024-001"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="pl-10"
                    data-testid="input-employee-id"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                data-testid="button-login"
              >
                {t("login1")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

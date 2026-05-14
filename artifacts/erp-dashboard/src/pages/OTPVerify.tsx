/**
 * @module OTPVerify
 * @description React page component. Route-level UI.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Shield, RefreshCw } from "lucide-react";
import { useTranslation } from '@/lib/i18n';

const OTP_LENGTH = 6;

interface ResendOtpResponse {
  sessionId: string;
  expiresIn: number;
  success: boolean;
}

export default function OTPVerify() {
  const { t } = useTranslation("common");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [timeLeft, setTimeLeft] = useState(180);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const resendMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/resend-otp", {}) as Promise<ResendOtpResponse>,
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setTimeLeft(data.expiresIn ?? 180);
      setOtp(Array(OTP_LENGTH).fill(""));
      toast({ title: "Yangi kod yuborildi" });
    },
    onError: () =>
      toast({ title: "Kod yuborishda xatolik", variant: "destructive" }),
  });

  const issueOtp = useCallback(() => {
    resendMutation.mutate();
  }, [resendMutation]);

  useEffect(() => {
    issueOtp();
  }, []);

  const verifyMutation = useMutation({
    mutationFn: (code: string) => {
      if (!sessionId) throw new Error("SessionId mavjud emas. Kodni qayta yuboring.");
      return apiRequest("POST", "/api/auth/verify-otp", { code, sessionId });
    },
    onSuccess: () => {
      toast({ title: "Muvaffaqiyatli tasdiqlandi" });
      navigate("/");
    },
    onError: (err: Error) =>
      toast({
        title: "Noto'g'ri kod",
        description: err.message || "Iltimos, qaytadan urinib ko'ring",
        variant: "destructive",
      }),
  });

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if ((Array.isArray(newOtp) ? newOtp : []).every((d) => d !== "")) {
      verifyMutation.mutate(newOtp.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const newOtp = Array(OTP_LENGTH).fill("");
    text.split("").forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    if (text.length === OTP_LENGTH) {
      verifyMutation.mutate(text);
    }
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLoading = resendMutation.isPending && !sessionId;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-[14px] font-semibold">{t("otpTasdiqlash")}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Telegramga yuborilgan {OTP_LENGTH} raqamli kodni kiriting
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground">{t("kodYuborilmoqda")}</p>
          ) : (
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {(Array.isArray(otp) ? otp : []).map((digit, i) => (
                <Input
                  key={`k-${i}`}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  maxLength={1}
                  value={digit}
                  inputMode="numeric"
                  className="w-12 h-12 text-center text-xl font-bold"
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  data-testid={`otp-input-${i}`}
                />
              ))}
            </div>
          )}

          <div className="text-center">
            {timeLeft > 0 ? (
              <p className="text-sm text-muted-foreground">
                Muddati:{" "}
                <span className="font-mono font-medium text-foreground">
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </span>
              </p>
            ) : (
              <p className="text-sm text-destructive">{t("kodMuddatiOtdi")}</p>
            )}
          </div>

          <Button
            onClick={() => verifyMutation.mutate(otp.join(""))}
            className="w-full"
            disabled={(Array.isArray(otp) ? otp : []).some((d) => !d) || verifyMutation.isPending || timeLeft === 0 || !sessionId}
            data-testid="button-verify-otp"
          >
            {verifyMutation.isPending ? "Tekshirilmoqda..." : "Tasdiqlash"}
          </Button>

          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => resendMutation.mutate()}
              disabled={timeLeft > 0 || resendMutation.isPending}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              {t("qaytaYuborish")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

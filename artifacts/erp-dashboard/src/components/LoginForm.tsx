import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Phone, Hash } from "lucide-react";

interface LoginFormProps {
  onLogin?: (phone: string, employeeId: string) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [step, setStep] = useState<"phone" | "otp" | "employeeId">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("otp");
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("employeeId");
  };

  const handleEmployeeIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin?.(phone, employeeId);
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
          <CardTitle className="text-2xl">Europrint system</CardTitle>
          <CardDescription>
            {step === "phone" && "Telefon raqamingizni kiriting"}
            {step === "otp" && "SMS orqali yuborilgan kodni kiriting"}
            {step === "employeeId" && "Tabel raqamingizni kiriting"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "phone" && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon raqami</Label>
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
              </div>
              <Button 
                type="submit" 
                className="w-full"
                data-testid="button-send-otp"
              >
                SMS kod yuborish
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Tasdiqlash kodi</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  data-testid="input-otp"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setStep("phone")}
                  data-testid="button-back"
                >
                  Orqaga
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  data-testid="button-verify-otp"
                >
                  Tasdiqlash
                </Button>
              </div>
            </form>
          )}

          {step === "employeeId" && (
            <form onSubmit={handleEmployeeIdSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Tabel raqami</Label>
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
                Kirish
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

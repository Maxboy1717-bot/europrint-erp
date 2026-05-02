import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Languages } from "lucide-react";
import { IotLang } from "./iot-types";

interface IoTLoginPanelProps {
  lang: IotLang;
  setLang: (lang: IotLang) => void;
  tabelNumber: string;
  setTabelNumber: (v: string) => void;
  workerPassword: string;
  setWorkerPassword: (v: string) => void;
  handleLogin: () => void;
}

export function IoTLoginPanel({ lang, setLang, tabelNumber, setTabelNumber, workerPassword, setWorkerPassword, handleLogin }: IoTLoginPanelProps) {
  const t = (uz: string, ru: string) => lang === "uz" ? uz : ru;

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 font-inter" data-testid="iot-tablet-login">
      <Card className="w-full max-w-md bg-surface-container-lowest border-outline-variant shadow-none rounded-xl overflow-hidden">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary-container flex items-center justify-center">
            <User className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-light tracking-tight text-on-surface">
            Operator <span className="font-bold text-primary">Kirishi</span>
          </h1>
          <p className="text-on-surface-variant text-sm mt-2">{t("Tabel raqami va parol bilan kiring", "Войдите с табельным номером и паролем")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-on-surface-variant uppercase tracking-wider text-xs font-semibold">{t("Tabel raqami", "Табельный номер")}</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder={t("Masalan: 001", "Например: 001")}
              value={tabelNumber}
              onChange={e => setTabelNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="text-center text-2xl h-14 bg-surface border-outline-variant text-on-surface focus-visible:ring-primary"
              data-testid="input-tabel-number"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-on-surface-variant uppercase tracking-wider text-xs font-semibold">{t("Parol", "Пароль")}</Label>
            <Input
              type="password"
              placeholder="••••"
              value={workerPassword}
              onChange={e => setWorkerPassword(e.target.value)}
              className="text-center text-2xl h-14 bg-surface border-outline-variant text-on-surface focus-visible:ring-primary"
              data-testid="input-worker-password"
            />
          </div>
          <Button
            className="w-full h-14 text-xl font-bold bg-gradient-to-br from-primary to-primary-dim text-white rounded-xl shadow-none hover:opacity-90 transition-opacity"
            onClick={handleLogin}
            disabled={tabelNumber.length < 3 || workerPassword.length < 4}
            data-testid="button-login"
          >
            {t("KIRISH", "ВОЙТИ")}
          </Button>
          <div className="flex justify-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLang(lang === "uz" ? "ru" : "uz")} 
              data-testid="button-lang-login"
              className="text-on-surface-variant hover:bg-surface-container-high"
            >
              <Languages className="h-4 w-4 mr-2" />
              {lang === "uz" ? "Русский" : "O'zbekcha"}
            </Button>
          </div>
          <p className="text-xs text-center text-on-surface-variant">
            {t("Tabel raqami va PIN kodingizni kiriting", "Введите табельный номер и PIN-код")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * @module IoTLoginPanel
 * @description React page component. Route-level UI.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Languages } from "lucide-react";
import { IotLang } from "./iot-types";
import { EPPageHeader } from "@/components/ep";
import { useTranslation } from "@/lib/i18n";

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
  const { t } = useTranslation("iot");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 font-inter" data-testid="iot-tablet-login">
      <Card className="w-full max-w-md bg-card border-border shadow-none rounded-xl overflow-hidden">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-10 w-10 text-primary" />
          </div>
          <EPPageHeader
        breadcrumb={<>{t("dashboard1")}<b className="text-foreground">{t("loginTitle")}</b></>}
        title={t("loginTitle")}
        subtitle={t("loginSubtitle")}
      />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
          <Label className="text-muted-foreground uppercase tracking-wider text-xs font-semibold">{t("tabelNumberLabel")}</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder={t("tabelNumberPlaceholder")}
              value={tabelNumber}
              onChange={e => setTabelNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="text-center text-2xl h-14 bg-background border-border text-foreground focus-visible:ring-primary"
              data-testid="input-tabel-number"
            />
          </div>
          <div className="space-y-1">
          <Label className="text-muted-foreground uppercase tracking-wider text-xs font-semibold">{t("passwordLabel")}</Label>
            <Input
              type="password"
              placeholder="••••"
              value={workerPassword}
              onChange={e => setWorkerPassword(e.target.value)}
              className="text-center text-2xl h-14 bg-background border-border text-foreground focus-visible:ring-primary"
              data-testid="input-worker-password"
            />
          </div>
          <Button
            className="w-full h-14 text-xl font-bold bg-primary text-white rounded-xl shadow-none hover:opacity-90 transition-opacity"
            onClick={handleLogin}
            disabled={tabelNumber.length < 3 || workerPassword.length < 4}
            data-testid="button-login"
          >
            {t("loginButton")}
          </Button>
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLang(lang === "uz" ? "ru" : "uz")}
              data-testid="button-lang-login"
              className="text-muted-foreground hover:bg-muted"
            >
              <Languages className="h-4 w-4 mr-2" />
              {lang === "uz" ? "Русский" : "O'zbekcha"}
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground">
            {t("loginHelpText")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

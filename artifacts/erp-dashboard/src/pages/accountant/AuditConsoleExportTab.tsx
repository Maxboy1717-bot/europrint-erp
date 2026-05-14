/**
 * @module AuditConsoleExportTab
 * @description Export tab (CSV / Excel / PDF) for AuditConsole.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download, Table, FileCheck } from "lucide-react";

interface ExportTabProps {
  onExportCSV: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
}

export function ExportTab({ onExportCSV, onExportExcel, onExportPDF }: ExportTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover-elevate cursor-pointer">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-[var(--ep-blue)]" />
            <h3 className="font-bold mb-2">CSV eksport</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Audit loglarni CSV formatda yuklash
            </p>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={onExportCSV}
              data-testid="button-export-csv"
            >
              <Download className="h-4 w-4" />
              Yuklash
            </Button>
          </CardContent>
        </Card>
        <Card className="hover-elevate cursor-pointer">
          <CardContent className="p-6 text-center">
            <Table className="h-12 w-12 mx-auto mb-4 text-[var(--ep-green)]" />
            <h3 className="font-bold mb-2">Excel eksport</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Audit loglarni Excel formatda yuklash
            </p>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={onExportExcel}
              data-testid="button-export-excel"
            >
              <Download className="h-4 w-4" />
              Yuklash
            </Button>
          </CardContent>
        </Card>
        <Card className="hover-elevate cursor-pointer">
          <CardContent className="p-6 text-center">
            <FileCheck className="h-12 w-12 mx-auto mb-4 text-[var(--ep-red)]" />
            <h3 className="font-bold mb-2">PDF Hisobot</h3>
            <p className="text-sm text-muted-foreground mb-4">Auditor uchun PDF hisobot</p>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={onExportPDF}
              data-testid="button-export-pdf"
            >
              <Download className="h-4 w-4" />
              Yuklash
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
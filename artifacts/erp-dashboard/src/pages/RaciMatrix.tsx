/**
 * @module RaciMatrix
 * @description Route-level page for RACI responsibility matrix.
 * Pre-populated with EuroPrint business processes — no live API needed.
 * Route: /raci-matrix
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, ResponsiveContainer } from "@/components/ui/page-header";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Grid3X3, Printer, Info } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

// ─── Types ────────────────────────────────────────────────────────────────────

type RaciValue = "R" | "A" | "C" | "I" | "-";

interface RaciRow {
  process: string;
  category: string;
  roles: Record<string, RaciValue>;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ROLES = [
  "Direktor",
  "HR Menejer",
  "Moliya",
  "Ishlab chiqarish",
  "Ombor",
  "Sifat nazorati",
] as const;

type Role = typeof ROLES[number];

const RACI_DATA: RaciRow[] = [
  {
    process: "Buyurtma bajarish",
    category: "Ishlab chiqarish",
    roles: {
      "Direktor":        "A",
      "HR Menejer":      "-",
      "Moliya":          "C",
      "Ishlab chiqarish": "R",
      "Ombor":           "C",
      "Sifat nazorati":  "C",
    },
  },
  {
    process: "Sifat nazorati",
    category: "Sifat",
    roles: {
      "Direktor":        "A",
      "HR Menejer":      "-",
      "Moliya":          "-",
      "Ishlab chiqarish": "C",
      "Ombor":           "I",
      "Sifat nazorati":  "R",
    },
  },
  {
    process: "Xodim yollash",
    category: "HR",
    roles: {
      "Direktor":        "A",
      "HR Menejer":      "R",
      "Moliya":          "C",
      "Ishlab chiqarish": "C",
      "Ombor":           "-",
      "Sifat nazorati":  "-",
    },
  },
  {
    process: "Ish haqi hisoblash",
    category: "Moliya",
    roles: {
      "Direktor":        "A",
      "HR Menejer":      "C",
      "Moliya":          "R",
      "Ishlab chiqarish": "I",
      "Ombor":           "I",
      "Sifat nazorati":  "I",
    },
  },
  {
    process: "Inventarizatsiya",
    category: "Ombor",
    roles: { "Direktor": "I", "HR Menejer": "-", "Moliya": "C", "Ishlab chiqarish": "C", "Ombor": "R", "Sifat nazorati": "A" },
  },
  {
    process: "IT xavfsizlik",
    category: "IT",
    roles: { "Direktor": "A", "HR Menejer": "I", "Moliya": "I", "Ishlab chiqarish": "I", "Ombor": "I", "Sifat nazorati": "I" },
  },
  {
    process: "Byudjetlashtirish",
    category: "Moliya",
    roles: { "Direktor": "A", "HR Menejer": "C", "Moliya": "R", "Ishlab chiqarish": "C", "Ombor": "C", "Sifat nazorati": "I" },
  },
  {
    process: "Xavfsizlik treningi",
    category: "HR",
    roles: { "Direktor": "I", "HR Menejer": "R", "Moliya": "I", "Ishlab chiqarish": "C", "Ombor": "C", "Sifat nazorati": "A" },
  },
  {
    process: "Mijozga yetkazib berish",
    category: "Ishlab chiqarish",
    roles: { "Direktor": "I", "HR Menejer": "-", "Moliya": "C", "Ishlab chiqarish": "A", "Ombor": "R", "Sifat nazorati": "C" },
  },
];

const LEGEND = [
  { code: "R", label: "Responsible",   nameUz: "Bajaruvchi",    desc: "Vazifani bevosita bajaradi",        colorClass: "bg-red-100 text-red-700 border-red-200" },
  { code: "A", label: "Accountable",   nameUz: "Mas'ul",        desc: "Oxirgi javobgarlik o'zida",         colorClass: "bg-orange-100 text-orange-700 border-orange-200" },
  { code: "C", label: "Consulted",     nameUz: "Maslahatchi",   desc: "Maslahati so'raladi",                colorClass: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { code: "I", label: "Informed",      nameUz: "Xabardor",      desc: "Natijadan xabardor qilinadi",        colorClass: "bg-green-100 text-green-700 border-green-200" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Ishlab chiqarish": "bg-blue-50 text-blue-700",
  "Sifat":            "bg-green-50 text-green-700",
  "HR":               "bg-purple-50 text-purple-700",
  "Moliya":           "bg-orange-50 text-orange-700",
  "Ombor":            "bg-cyan-50 text-cyan-700",
  "IT":               "bg-gray-100 text-gray-700",
};

const RACI_CELL_STYLE: Record<RaciValue, string> = {
  R: "bg-red-50 text-red-700 font-bold border border-red-200",
  A: "bg-orange-50 text-orange-700 font-bold border border-orange-200",
  C: "bg-yellow-50 text-yellow-700 font-semibold border border-yellow-200",
  I: "bg-green-50 text-green-700 border border-green-200",
  "-": "text-muted-foreground/40",
};

const ALL_CATEGORIES = Array.from(new Set(RACI_DATA.map((r) => r.category)));

// ─── Component ────────────────────────────────────────────────────────────────

export default function RaciMatrix() {
  const { t } = useTranslation("common");
  const [filterCategory, setFilterCategory] = useState<string>("Barchasi");

  const filtered = filterCategory === "Barchasi"
    ? RACI_DATA
    : RACI_DATA.filter((r) => r.category === filterCategory);

  return (
    <ResponsiveContainer>
      {/* Header */}
      <PageHeader
        title="RACI Matritsasi"
        description="Javobgarlik va vakolatlar taqsimoti"
        icon={<Grid3X3 className="w-6 h-6 text-primary" />}
        actions={
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Chop etish
          </Button>
        }
      />

      {/* Legend cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {LEGEND.map((item) => (
          <Card key={item.code} className={`border ${item.colorClass.replace("bg-", "border-").split(" ")[0]}`}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-7 h-7 flex items-center justify-center rounded-md text-sm font-bold ${item.colorClass}`}>
                  {item.code}
                </span>
                <span className="text-sm font-semibold">{item.nameUz}</span>
              </div>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {["Barchasi", ...ALL_CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filterCategory === cat
                ? "bg-primary text-white border-primary"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Matrix table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4 text-muted-foreground" />
            Jarayonlar × Lavozimlar matritsasi
          </CardTitle>
          <span className="text-xs text-muted-foreground">{filtered.length} jarayon</span>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4 min-w-[200px]">Jarayon</TableHead>
                <TableHead className="min-w-[110px]">Kategoriya</TableHead>
                {ROLES.map((role) => (
                  <TableHead key={role} className="text-center min-w-[90px] text-xs">
                    {role}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.process} className="hover:bg-muted/30">
                  <TableCell className="pl-4 font-medium text-sm">{row.process}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[row.category] ?? "bg-gray-100 text-gray-700"}`}>
                      {row.category}
                    </span>
                  </TableCell>
                  {ROLES.map((role) => {
                    const val: RaciValue = (row.roles[role] as RaciValue) ?? "-";
                    return (
                      <TableCell key={role} className="text-center">
                        {val !== "-" ? (
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs ${RACI_CELL_STYLE[val]}`}>
                            {val}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/30 text-xs">—</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bottom legend */}
      <Card className="mt-5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground mb-1.5">Qo'llanma</p>
              <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                {LEGEND.map((item) => (
                  <div key={item.code} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={`w-5 h-5 flex items-center justify-center rounded text-[11px] font-bold ${item.colorClass}`}>
                      {item.code}
                    </span>
                    <span>{item.label} — {item.nameUz}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ResponsiveContainer>
  );
}

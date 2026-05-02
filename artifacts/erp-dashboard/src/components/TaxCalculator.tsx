interface TaxCalculatorProps {
  grossSalary: number;
  className?: string;
}

const INCOME_TAX = 0.12;
const PENSION = 0.01;
const EMPLOYER_PENSION = 0.12;
const INPS = 0.05;

function fmt(n: number) {
  return n.toLocaleString("uz-UZ") + " so'm";
}

export function TaxCalculator({ grossSalary, className }: TaxCalculatorProps) {
  const incomeTax = Math.round(grossSalary * INCOME_TAX);
  const pension = Math.round(grossSalary * PENSION);
  const employerPension = Math.round(grossSalary * EMPLOYER_PENSION);
  const inps = Math.round(grossSalary * INPS);
  const net = grossSalary - incomeTax - pension;
  const totalEmployerCost = grossSalary + employerPension + inps;

  if (!grossSalary || grossSalary <= 0) return null;

  return (
    <div className={`rounded-lg border bg-muted/30 p-3 space-y-1.5 text-sm ${className ?? ""}`}>
      <div className="font-medium text-xs text-muted-foreground mb-2 uppercase tracking-wide">
        Soliq hisob-kitobi
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-muted-foreground">Yalpi maosh:</span>
        <span className="font-medium text-right">{fmt(grossSalary)}</span>

        <span className="text-muted-foreground">Daromad solig'i (12%):</span>
        <span className="text-red-600 text-right">−{fmt(incomeTax)}</span>

        <span className="text-muted-foreground">Pensiya fondi (1%):</span>
        <span className="text-red-600 text-right">−{fmt(pension)}</span>

        <div className="col-span-2 border-t my-1" />

        <span className="font-semibold">Sof maosh:</span>
        <span className="font-bold text-green-700 text-right">{fmt(net)}</span>

        <div className="col-span-2 border-t my-1" />

        <span className="text-xs text-muted-foreground">Ish beruvchi pensiya (12%):</span>
        <span className="text-xs text-right text-orange-600">{fmt(employerPension)}</span>

        <span className="text-xs text-muted-foreground">INPS (5%):</span>
        <span className="text-xs text-right text-orange-600">{fmt(inps)}</span>

        <span className="text-xs text-muted-foreground">Jami ish beruvchi xarajati:</span>
        <span className="text-xs font-medium text-right">{fmt(totalEmployerCost)}</span>
      </div>
    </div>
  );
}

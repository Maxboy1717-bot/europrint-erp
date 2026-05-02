interface IQLevel {
  label: string;
  labelUz: string;
  min: number;
  max: number | null;
  color: string;
  bgColor: string;
  description: string;
}

const IQ_LEVELS: IQLevel[] = [
  {
    label: "Genius",
    labelUz: "Daho",
    min: 135,
    max: null,
    color: "text-purple-400",
    bgColor: "bg-purple-500",
    description: "IQ 135+",
  },
  {
    label: "Very High",
    labelUz: "Juda Yuqori (~10%)",
    min: 110,
    max: 134,
    color: "text-blue-400",
    bgColor: "bg-blue-500",
    description: "IQ 110–134",
  },
  {
    label: "Above Average",
    labelUz: "O'rta-Yuqori",
    min: 100,
    max: 109,
    color: "text-green-400",
    bgColor: "bg-green-500",
    description: "IQ 100–109",
  },
  {
    label: "Average",
    labelUz: "O'rta",
    min: 90,
    max: 100,
    color: "text-amber-400",
    bgColor: "bg-amber-500",
    description: "IQ 90–100",
  },
  {
    label: "Below Average",
    labelUz: "Past",
    min: 0,
    max: 89,
    color: "text-red-400",
    bgColor: "bg-red-500",
    description: "IQ <90",
  },
];

function getIQLevel(iq: number): IQLevel {
  for (const level of IQ_LEVELS) {
    if (iq >= level.min && (level.max === null || iq <= level.max)) {
      return level;
    }
  }
  return IQ_LEVELS[IQ_LEVELS.length - 1];
}

interface IQScaleChartProps {
  iq: number | null | undefined;
  compact?: boolean;
}

export function IQScaleChart({ iq, compact = false }: IQScaleChartProps) {
  if (iq === null || iq === undefined) {
    return (
      <span className="text-xs text-muted-foreground italic">IQ ball kiritilmagan</span>
    );
  }

  const level = getIQLevel(iq);
  const clampedIQ = Math.max(60, Math.min(150, iq));
  const pct = ((clampedIQ - 60) / (150 - 60)) * 100;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className={`text-sm font-bold ${level.color}`}>IQ {iq}</span>
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${level.bgColor}/15 ${level.color} border border-current/20`}>
          {level.labelUz}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">IQ Ball</span>
        <div className="flex items-center gap-2">
          <span className={`text-xl font-bold ${level.color}`}>{iq}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${level.bgColor}/15 ${level.color} border border-current/20 font-medium`}>
            {level.labelUz}
          </span>
        </div>
      </div>

      {/* Scale bar */}
      <div className="relative">
        <div className="h-4 bg-gradient-to-r from-red-500/30 via-amber-500/30 via-green-500/30 via-blue-500/30 to-purple-500/30 rounded-full overflow-hidden">
          <div className="absolute inset-0 flex">
            {[...IQ_LEVELS].reverse().map((l, i) => (
              <div
                key={l.label}
                className={`flex-1 ${i > 0 ? "border-l border-white/10" : ""}`}
                title={`${l.labelUz}: ${l.description}`}
              />
            ))}
          </div>
          {/* Marker */}
          <div
            className="absolute top-0 h-full w-1 bg-white rounded-full shadow-lg transition-all"
            style={{ left: `calc(${pct}% - 2px)` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
          <span>60</span>
          <span>90</span>
          <span>100</span>
          <span>110</span>
          <span>135</span>
          <span>150+</span>
        </div>
      </div>

      {/* Level descriptions */}
      <div className="grid grid-cols-1 gap-1">
        {(Array.isArray(IQ_LEVELS) ? IQ_LEVELS : []).map((l) => {
          const isActive = iq >= l.min && (l.max === null || iq <= l.max);
          return (
            <div
              key={l.label}
              className={`flex items-center justify-between px-2 py-1 rounded text-xs transition-all ${
                isActive
                  ? `${l.bgColor}/10 border border-current/20 ${l.color} font-semibold`
                  : "text-muted-foreground"
              }`}
            >
              <span>{l.labelUz}</span>
              <span className="font-mono text-[10px]">{l.description}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type WorkerType = "FLAGMAN" | "PROTSESSNIK" | "TRABLDAYKER";

export interface WorkerTypeInput {
  motivation_level: number;
  tool_test_score?: number | null;
  tool_test_passed?: Record<string, boolean>;
  tool_test_results?: Record<string, number> | null;
  /** "inflow" = intrinsic motivation (Flagman signal), "outflow" = extrinsic only (risk signal) */
  flow_direction?: "inflow" | "outflow" | "";
  avg_score?: number;
}

export const WORKER_TYPE_META: Record<WorkerType, { label: string; emoji: string; color: string; bg: string; border: string; desc: string }> = {
  FLAGMAN: {
    label: "Flagman",
    emoji: "🏆",
    color: "text-green-400",
    bg: "bg-green-500/15",
    border: "border-green-500/40",
    desc: "5-17% — Yulduz xodim, 80% natija beradi",
  },
  PROTSESSNIK: {
    label: "Protsessnik",
    emoji: "⚙️",
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    border: "border-blue-500/40",
    desc: "Ko'pchilik — Ko'rsatma bo'yicha ishlaydi",
  },
  TRABLDAYKER: {
    label: "Trabldayker",
    emoji: "⚠️",
    color: "text-red-400",
    bg: "bg-red-500/15",
    border: "border-red-500/40",
    desc: "5% — Kompaniyaga zarar yetkazadi",
  },
};

function hasSyndrome10or11(tool_test_results?: Record<string, number> | null): boolean {
  if (!tool_test_results) return false;
  const i = tool_test_results["I"] ?? 0;
  const j = tool_test_results["J"] ?? 0;
  const g = tool_test_results["G"] ?? 0;
  const c = tool_test_results["C"] ?? 0;
  const syndrome10 = i < -30 && j < -30;
  const syndrome11 = g < -30 && c < -30;
  return syndrome10 || syndrome11;
}

function computeToolTestScore(tool_test_passed?: Record<string, boolean>): number {
  if (!tool_test_passed) return 0;
  const passed = Object.values(tool_test_passed).filter(Boolean).length;
  const total = Object.keys(tool_test_passed).length || 10;
  return Math.round((passed / total) * 100);
}

export function computeWorkerType(input: WorkerTypeInput): WorkerType {
  const {
    motivation_level,
    tool_test_score,
    tool_test_passed,
    tool_test_results,
    flow_direction,
    avg_score,
  } = input;

  if (hasSyndrome10or11(tool_test_results)) {
    return "TRABLDAYKER";
  }

  const toolScore =
    tool_test_score != null
      ? tool_test_score
      : computeToolTestScore(tool_test_passed);

  const toolPct = tool_test_results
    ? (() => {
        const vals = Object.values(tool_test_results);
        if (!vals.length) return 0;
        const avg = (Array.isArray(vals) ? vals : []).reduce((a, b) => a + b, 0) / vals.length;
        return (avg + 100) / 2;
      })()
    : toolScore;

  const hasInflowMotivation = flow_direction === "inflow";
  const hasOutflowOnly = flow_direction === "outflow";

  const isFlagmanMotivation = motivation_level === 3 || motivation_level === 4;
  const isHighTool = toolPct >= 50;
  const isHighAvg = (avg_score ?? 0) >= 7;

  if (isFlagmanMotivation && (hasInflowMotivation || isHighTool) && isHighAvg) {
    return "FLAGMAN";
  }

  if (isFlagmanMotivation && (isHighTool || isHighAvg)) {
    return "FLAGMAN";
  }

  const lowMotivation = motivation_level === 1;
  const lowTool = toolPct < 30;

  if (lowMotivation && lowTool) {
    return "TRABLDAYKER";
  }

  if (toolPct < 20 && (avg_score ?? 5) < 4) {
    return "TRABLDAYKER";
  }

  if (hasOutflowOnly && lowTool && (avg_score ?? 5) < 5) {
    return "TRABLDAYKER";
  }

  return "PROTSESSNIK";
}

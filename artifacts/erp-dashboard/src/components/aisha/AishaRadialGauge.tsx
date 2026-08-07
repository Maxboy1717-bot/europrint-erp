/**
 * @module AishaRadialGauge
 * @description SVG circular progress ring — the HUD-style dial used to show
 * a 0-100 metric (e.g. AIsha's provenance confidence) instead of plain text,
 * matching the reference JARVIS-style radial gauges while keeping the
 * existing cyan/teal palette (see aisha-immersive.css .aisha-gauge*).
 */

interface Props {
  /** 0-100 */
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  testId?: string;
}

export function AishaRadialGauge({ value, size = 64, strokeWidth = 5, label, testId }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;

  return (
    <div className="aisha-gauge" style={{ width: size, height: size }} data-testid={testId}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="aisha-gauge__track" cx={center} cy={center} r={radius} strokeWidth={strokeWidth} fill="none" />
        <circle
          className="aisha-gauge__value"
          cx={center} cy={center} r={radius} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <div className="aisha-gauge__label">
        <span className="aisha-gauge__value-text">{Math.round(clamped)}%</span>
        {label && <span className="aisha-gauge__caption">{label}</span>}
      </div>
    </div>
  );
}

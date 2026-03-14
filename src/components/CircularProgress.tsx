import { useState } from "react";

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  unit?: string;
}

export const CircularProgress = ({
  value,
  max,
  size = 200,
  strokeWidth = 14,
  label,
  unit,
}: CircularProgressProps) => {
  const [showTarget, setShowTarget] = useState(false);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const isOver = value > max;
  const progress = Math.min(value / max, 1);
  const strokeDashoffset = circumference * (1 - progress);

  // For surplus: show full black ring + pink overlay for the surplus portion
  const surplusProgress = isOver ? Math.min((value - max) / max, 1) : 0;
  const surplusDashoffset = circumference * (1 - surplusProgress);

  const displayValue = showTarget ? max : value;
  const formatted = displayValue.toLocaleString();
  const remaining = max - value;

  const displayLabel = label || "Net Cals";
  const isCalories = !label || label === "NET CALS";

  return (
    <div
      className="relative cursor-pointer select-none"
      style={{ width: size, height: size }}
      onClick={() => setShowTarget((prev) => !prev)}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round" />
        {/* Main progress (black) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out" />
        {/* Surplus overlay (pink) */}
        {isOver && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--chart-negative-dark))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={surplusDashoffset}
            className="transition-all duration-700 ease-out" />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showTarget ? (
          <>
            <span className="font-semibold text-muted-foreground uppercase tracking-[0.15em] text-xs">Daily Target</span>
            <span className="font-bold text-foreground tracking-tight text-5xl mt-1">{formatted}</span>
            <span className="font-semibold text-muted-foreground mt-1 text-sm">
              {remaining > 0 ? `${remaining} left` : "Target reached!"}
            </span>
          </>
        ) : (
          <>
            <span className={`font-bold tracking-tight ${isCalories ? "text-6xl" : "text-5xl"} ${isOver ? "text-[hsl(var(--chart-negative-dark))]" : "text-foreground"}`}>
              {formatted}{!isCalories && unit ? <span className="text-2xl font-semibold text-muted-foreground ml-0.5">{unit}</span> : null}
            </span>
            <span className="font-semibold text-muted-foreground uppercase tracking-[0.2em] mt-1 text-lg">{displayLabel}</span>
          </>
        )}
      </div>
    </div>
  );
};

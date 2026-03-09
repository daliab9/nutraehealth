import { useState } from "react";

interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
}

export const CircularProgress = ({
  value,
  max,
  size = 200,
  strokeWidth = 14
}: CircularProgressProps) => {
  const [showTarget, setShowTarget] = useState(false);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const strokeDashoffset = circumference * (1 - progress);

  const displayValue = showTarget ? max : value;
  const formatted = displayValue.toLocaleString();
  const remaining = max - value;

  return (
    <div
      className="relative cursor-pointer select-none"
      style={{ width: size, height: size }}
      onClick={() => setShowTarget((prev) => !prev)}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round" />
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
            <span className="font-bold text-foreground tracking-tight text-6xl">{formatted}</span>
            <span className="font-semibold text-muted-foreground uppercase tracking-[0.2em] mt-1 text-lg">Cals</span>
          </>
        )}
      </div>
    </div>
  );
};
interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  unit?: string;
}

function formatNum(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString();
  const rounded = Math.round(n * 10) / 10;
  return rounded.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

export const CircularProgress = ({
  value,
  max,
  size = 200,
  strokeWidth = 14,
  label,
  unit,
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const isOver = value > max;
  const progress = Math.min(value / max, 1);
  const strokeDashoffset = circumference * (1 - progress);

  const surplusProgress = isOver ? Math.min((value - max) / max, 1) : 0;
  const surplusDashoffset = circumference * (1 - surplusProgress);

  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  const displayLabel = label || "Net Cals";
  const isCalories = !label || label === "NET CALS";

  return (
    <div
      className="relative select-none"
      style={{ width: size, height: size }}
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
        <span className={`font-bold tracking-tight ${isCalories ? "text-5xl" : "text-4xl"} ${isOver ? "text-[hsl(var(--chart-negative-dark))]" : "text-foreground"}`}>
          {formatNum(value)}{!isCalories && unit ? <span className="text-xl font-semibold text-muted-foreground ml-0.5">{unit}</span> : null}
        </span>
        <span className="font-semibold text-muted-foreground uppercase tracking-[0.15em] mt-0.5 text-sm">{displayLabel}</span>
        <span className="text-xs text-muted-foreground mt-1">
          {percent}% of target ({formatNum(max)}{unit ? ` ${unit}` : ""})
        </span>
      </div>
    </div>
  );
};

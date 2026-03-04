import { cn } from "@/lib/utils";

interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  unit?: string;
  colorClass: string;
}

export const MacroBar = ({ label, current, goal, unit = "g", colorClass }: MacroBarProps) => {
  const percentage = Math.min((current / goal) * 100, 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">
          {current}{unit} / {goal}{unit}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

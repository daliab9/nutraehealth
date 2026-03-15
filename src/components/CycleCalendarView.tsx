import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from "date-fns";
import { cn } from "@/lib/utils";

interface CycleCalendarViewProps {
  cycleStartDate: string;
  periodDuration: number;
  currentMonth: Date;
}

type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal";

export function getPhaseForDay(cycleDay: number, periodDuration: number): CyclePhase {
  // Cycle is always 28 days. Menstrual = periodDuration days, then distribute remaining.
  const menstrualEnd = periodDuration;
  const follicularEnd = 13;
  const ovulatoryEnd = 16;
  
  if (cycleDay <= menstrualEnd) return "menstrual";
  if (cycleDay <= follicularEnd) return "follicular";
  if (cycleDay <= ovulatoryEnd) return "ovulatory";
  return "luteal";
}

const PHASE_COLORS: Record<CyclePhase, string> = {
  menstrual: "bg-[#FF8FAB]",           // pink
  follicular: "bg-[#FFD3A5]",          // light orange
  ovulatory: "bg-[hsl(var(--accent))]/40",  // light green
  luteal: "bg-[hsl(var(--action-button))]",  // light beige
};

export const PHASE_LABELS: { phase: CyclePhase; label: string; colorClass: string }[] = [
  { phase: "menstrual", label: "Menstrual", colorClass: "bg-[#FF8FAB]" },
  { phase: "follicular", label: "Follicular", colorClass: "bg-[#FFD3A5]" },
  { phase: "ovulatory", label: "Ovulation", colorClass: "bg-[hsl(var(--accent))]/40" },
  { phase: "luteal", label: "Luteal", colorClass: "bg-[hsl(var(--action-button))]" },
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const CycleCalendarView = ({ cycleStartDate, periodDuration, currentMonth }: CycleCalendarViewProps) => {
  const cycleStart = new Date(cycleStartDate);

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const result: Date[][] = [];
    let day = calStart;
    while (day <= calEnd) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(day);
        day = addDays(day, 1);
      }
      result.push(week);
    }
    return result;
  }, [currentMonth]);

  const getCycleDay = (date: Date): number | null => {
    const diff = Math.floor((date.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return null;
    return (diff % 28) + 1;
  };

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day) => {
              const inMonth = isSameMonth(day, currentMonth);
              const cycleDay = getCycleDay(day);
              const phase = cycleDay !== null ? getPhaseForDay(cycleDay, periodDuration) : null;
              const today = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "relative flex items-center justify-center h-9 w-full rounded-full text-xs font-medium transition-all",
                    !inMonth && "opacity-30",
                    phase && inMonth ? PHASE_COLORS[phase] : "",
                    today && "ring-1 ring-foreground",
                  )}
                >
                  <span className={cn(
                    "text-foreground",
                    !inMonth && "text-muted-foreground"
                  )}>
                    {format(day, "d")}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border">
        {PHASE_LABELS.map(({ phase, label, colorClass }) => (
          <div key={phase} className="flex items-center gap-1.5">
            <div className={cn("h-3 w-3 rounded-full", colorClass)} />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

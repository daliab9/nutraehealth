import { useMemo, useRef, useEffect } from "react";
import { format, addDays, startOfWeek, isToday, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const WEEKS_BACK = 12;
const WEEKS_FORWARD = 4;

export const CalendarStrip = ({ selectedDate, onDateSelect }: CalendarStripProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentWeekRef = useRef<HTMLDivElement>(null);

  // Generate weeks: WEEKS_BACK past weeks + current week + WEEKS_FORWARD future weeks
  const weeks = useMemo(() => {
    const today = new Date();
    const result: Date[][] = [];
    for (let w = -WEEKS_BACK; w <= WEEKS_FORWARD; w++) {
      const weekStart = startOfWeek(addDays(today, w * 7), { weekStartsOn: 1 });
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(addDays(weekStart, d));
      }
      result.push(week);
    }
    return result;
  }, []);

  // Scroll to current week on mount
  useEffect(() => {
    if (currentWeekRef.current && scrollRef.current) {
      currentWeekRef.current.scrollIntoView({ inline: "end", block: "nearest" });
    }
  }, []);

  return (
    <div
      ref={scrollRef}
      className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory py-2"
    >
      {weeks.map((week, wi) => {
        const isCurrentWeek = wi === WEEKS_BACK;
        const monthLabel = format(week[0], "MMM dd");
        return (
          <div
            key={wi}
            ref={isCurrentWeek ? currentWeekRef : undefined}
            className="flex-shrink-0 w-full snap-end flex flex-col"
          >
            <div className="flex items-center justify-between gap-1 px-1">
              {week.map((day) => {
                const selected = isSameDay(day, selectedDate);
                const today = isToday(day);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => onDateSelect(day)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-2xl px-3 py-2.5 transition-all min-w-[42px]",
                      selected
                        ? "bg-foreground"
                        : "hover:bg-secondary"
                    )}
                  >
                    <span
                      className={cn(
                        "font-semibold uppercase tracking-wider text-sm",
                        selected ? "text-primary-foreground" : "text-muted-foreground"
                      )}
                    >
                      {format(day, "EEE")}
                    </span>
                    {today && !selected && (
                      <div className="h-1 w-1 rounded-full bg-accent" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

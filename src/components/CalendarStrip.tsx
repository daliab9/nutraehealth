import { useMemo } from "react";
import { format, addDays, isToday, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export const CalendarStrip = ({ selectedDate, onDateSelect }: CalendarStripProps) => {
  const days = useMemo(() => {
    const result = [];
    for (let i = -3; i <= 3; i++) {
      result.push(addDays(new Date(), i));
    }
    return result;
  }, []);

  return (
    <div className="flex items-center justify-between gap-1 py-4">
      {days.map((day) => {
        const selected = isSameDay(day, selectedDate);
        const today = isToday(day);
        return (
          <button
            key={day.toISOString()}
            onClick={() => onDateSelect(day)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-2xl px-3 py-2.5 transition-all min-w-[46px]",
              selected ?
              "bg-foreground" :
              "hover:bg-secondary"
            )}>
            
            <span
              className={cn("font-semibold uppercase tracking-wider text-sm",

              selected ? "text-primary-foreground" : "text-muted-foreground"
              )}>
              
              {format(day, "EEE")}
            </span>
            {today && !selected &&
            <div className="h-1 w-1 rounded-full bg-accent" />
            }
          </button>);

      })}
    </div>);

};
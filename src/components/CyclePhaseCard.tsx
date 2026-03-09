import { useState } from "react";
import { getCycleInfo, MEAL_GUIDANCE, EXERCISE_GUIDANCE, type CyclePhase } from "@/utils/cyclePhase";
import { Utensils, Dumbbell } from "lucide-react";

interface CyclePhaseCardProps {
  cycleStartDate: string;
}

export const CyclePhaseCard = ({ cycleStartDate }: CyclePhaseCardProps) => {
  const info = getCycleInfo(cycleStartDate);
  const [tab, setTab] = useState<"meals" | "exercise">("meals");

  if (!info) return null;

  const tips = tab === "meals" ? MEAL_GUIDANCE[info.phase] : EXERCISE_GUIDANCE[info.phase];

  return (
    <div className="rounded-2xl bg-secondary/40 border border-border p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{PHASE_ICONS[info.phase]}</span>
        <h3 className="text-sm font-semibold text-foreground">Insights based on your cycle phase</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3 ml-7">{info.phase} · Day {info.cycleDay}</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setTab("meals")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            tab === "meals"
              ? "bg-foreground text-primary-foreground"
              : "bg-secondary text-foreground border border-border"
          }`}
        >
          <Utensils className="h-3 w-3" />
          Meals
        </button>
        <button
          onClick={() => setTab("exercise")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            tab === "exercise"
              ? "bg-foreground text-primary-foreground"
              : "bg-secondary text-foreground border border-border"
          }`}
        >
          <Dumbbell className="h-3 w-3" />
          Exercise
        </button>
      </div>

      <ul className="space-y-1.5">
        {tips.map((tip) => (
          <li key={tip} className="flex items-start gap-2 text-sm text-foreground">
            <span className="text-muted-foreground mt-0.5">·</span>
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
};

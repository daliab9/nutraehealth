import { getCycleInfo, PHYSICAL_GUIDANCE, type CyclePhase } from "@/utils/cyclePhase";
import { Activity } from "lucide-react";

interface CyclePhaseCardProps {
  cycleStartDate: string;
}

const PHASE_ICONS: Record<CyclePhase, string> = {
  Menstrual: "🌙",
  Follicular: "🌱",
  Ovulatory: "☀️",
  Luteal: "🍂",
};

export const CyclePhaseCard = ({ cycleStartDate }: CyclePhaseCardProps) => {
  const info = getCycleInfo(cycleStartDate);
  if (!info) return null;

  const tips = PHYSICAL_GUIDANCE[info.phase];

  return (
    <div className="rounded-2xl bg-secondary/40 border border-border p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{PHASE_ICONS[info.phase]}</span>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Your Cycle Phase</h3>
          <p className="text-xs text-muted-foreground">{info.phase} · Day {info.cycleDay}</p>
        </div>
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

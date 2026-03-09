import { getCycleInfo, MENTAL_GUIDANCE, type CyclePhase } from "@/utils/cyclePhase";
import { Button } from "@/components/ui/button";

interface CycleMentalBannerProps {
  cycleStartDate?: string;
  isFemale: boolean;
  onAddCycleDate: () => void;
}

export const CycleMentalBanner = ({ cycleStartDate, isFemale, onAddCycleDate }: CycleMentalBannerProps) => {
  if (!isFemale) return null;

  // Female with cycle date → show phase banner + guidance
  if (cycleStartDate) {
    const info = getCycleInfo(cycleStartDate);
    if (!info) return null;

    const tips = MENTAL_GUIDANCE[info.phase];

    return (
      <div className="space-y-3 mb-4">
        <div className="rounded-2xl bg-secondary/40 border border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">
            Cycle Phase: {info.phase} (Day {info.cycleDay})
          </p>
        </div>
        <div className="rounded-2xl bg-secondary/40 border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Things to note</p>
          <ul className="space-y-1">
            {tips.map((tip) => (
              <li key={tip} className="text-sm text-foreground flex items-start gap-2">
                <span className="text-muted-foreground mt-0.5">·</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Female without cycle date → show awareness card
  return (
    <div className="rounded-2xl bg-secondary/40 border border-border p-5 mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-2">Cycle Awareness</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Your mood and energy may naturally shift throughout your cycle. Add the first day of your period in Settings to receive personalized insights.
      </p>
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl text-xs"
        onClick={onAddCycleDate}
      >
        Add Cycle Start Date
      </Button>
    </div>
  );
};

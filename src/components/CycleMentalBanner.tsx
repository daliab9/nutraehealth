import { useState } from "react";
import { getCycleInfo, MEAL_GUIDANCE, EXERCISE_GUIDANCE, MENTAL_GUIDANCE, type CyclePhase } from "@/utils/cyclePhase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Info } from "lucide-react";

interface CycleMentalBannerProps {
  cycleStartDate?: string;
  isFemale: boolean;
  onAddCycleDate: () => void;
  onEditCycleDate?: () => void;
}

const Section = ({ title, tips }: { title: string; tips: string[] }) => (
  <div>
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{title}</p>
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

export const CycleMentalBanner = ({ cycleStartDate, isFemale, onAddCycleDate, onEditCycleDate }: CycleMentalBannerProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!isFemale) return null;

  if (cycleStartDate) {
    const info = getCycleInfo(cycleStartDate);
    if (!info) return null;

    return (
      <>
        <div className="rounded-2xl bg-secondary/40 border border-border px-4 py-3 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-base">♀</span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Insights based on your cycle phase</h3>
              <p className="text-xs text-muted-foreground">{info.phase} · Day {info.cycleDay}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setDialogOpen(true)}
              className="h-7 w-7 rounded-full bg-action-button hover:bg-action-button/80 flex items-center justify-center active:scale-95 transition-transform"
            >
              <Info className="h-3.5 w-3.5 text-foreground" />
            </button>
            {onEditCycleDate && (
              <button
                onClick={onEditCycleDate}
                className="h-7 w-7 rounded-full bg-action-button hover:bg-action-button/80 flex items-center justify-center active:scale-95 transition-transform"
              >
                <Pencil className="h-3.5 w-3.5 text-foreground" />
              </button>
            )}
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="rounded-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-base">♀</span>
                {info.phase} Phase · Day {info.cycleDay}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-2">
              <Section title="Meals" tips={MEAL_GUIDANCE[info.phase]} />
              <Section title="Exercise" tips={EXERCISE_GUIDANCE[info.phase]} />
              <Section title="Mood" tips={MENTAL_GUIDANCE[info.phase]} />
            </div>
          </DialogContent>
        </Dialog>
      </>
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

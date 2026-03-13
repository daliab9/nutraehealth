import { useState } from "react";
import { getCycleInfo, MENTAL_GUIDANCE, type CyclePhase, type PhaseGuidanceDetail } from "@/utils/cyclePhase";
import { getSubPhaseGuidance } from "@/utils/cycleGuidance";
import { Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CyclePhaseCardProps {
  cycleStartDate: string;
  context: "meals" | "exercise" | "mood";
}

export const CyclePhaseCard = ({ cycleStartDate, context }: CyclePhaseCardProps) => {
  const info = getCycleInfo(cycleStartDate);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!info) return null;

  const contextLabel = context === "meals" ? "Meals" : context === "exercise" ? "Exercise" : "Mood";

  // Mood uses whole-phase guidance; meals/exercise use sub-phase
  const guidance: PhaseGuidanceDetail =
    context === "mood"
      ? MENTAL_GUIDANCE[info.phase]
      : getSubPhaseGuidance(info.phase, info.subPhase, context);

  return (
    <>
      <div className="rounded-2xl bg-secondary/40 border border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">♀</span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Insights based on your cycle phase</h3>
            <p className="text-xs text-muted-foreground">{info.subPhaseLabel} · Day {info.cycleDay}</p>
          </div>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="h-7 w-7 rounded-full bg-action-button hover:bg-action-button/80 flex items-center justify-center active:scale-95 transition-transform"
        >
          <Info className="h-3.5 w-3.5 text-foreground" />
        </button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-base">♀</span>
              {info.subPhaseLabel} · Day {info.cycleDay}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{contextLabel}</p>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">What's happening</p>
              <p className="text-sm text-foreground">{guidance.whatsHappening}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">What this means</p>
              <p className="text-sm text-foreground">{guidance.whatThisMeans}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">What to focus on</p>
              <ul className="space-y-1.5">
                {guidance.tips.map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="text-muted-foreground mt-0.5">·</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

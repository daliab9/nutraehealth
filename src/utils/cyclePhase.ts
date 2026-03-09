export type CyclePhase = "Menstrual" | "Follicular" | "Ovulatory" | "Luteal";

export interface CycleInfo {
  cycleDay: number;
  phase: CyclePhase;
}

export function getCycleInfo(cycleStartDate: string): CycleInfo | null {
  if (!cycleStartDate) return null;
  const start = new Date(cycleStartDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  if (diffMs < 0) return null;
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const cycleDay = (totalDays % 28) + 1;

  let phase: CyclePhase;
  if (cycleDay <= 5) phase = "Menstrual";
  else if (cycleDay <= 13) phase = "Follicular";
  else if (cycleDay <= 16) phase = "Ovulatory";
  else phase = "Luteal";

  return { cycleDay, phase };
}

export const PHYSICAL_GUIDANCE: Record<CyclePhase, string[]> = {
  Menstrual: [
    "Energy may be lower",
    "Gentle movement recommended",
    "Cravings may increase",
  ],
  Follicular: [
    "Energy rising",
    "Good time for strength training",
    "Better carb tolerance",
  ],
  Ovulatory: [
    "Peak strength and confidence",
    "Strong performance window",
  ],
  Luteal: [
    "Slight increase in appetite",
    "Possible water retention",
    "Reduce intensity late phase",
    "Prioritize recovery",
  ],
};

export const MENTAL_GUIDANCE: Record<CyclePhase, string[]> = {
  Menstrual: [
    "More inward reflection",
    "Emotional sensitivity may increase",
    "Rest is productive",
  ],
  Follicular: [
    "Clear thinking",
    "Motivation high",
    "Social energy rising",
  ],
  Ovulatory: [
    "Confidence peak",
    "Expressive and communicative",
  ],
  Luteal: [
    "Mood sensitivity may increase",
    "Anxiety or irritability more common",
    "Practice self-compassion",
  ],
};

import { addDays, format } from "date-fns";

export type CyclePhase = "Menstrual" | "Follicular" | "Ovulatory" | "Luteal";

export interface CycleInfo {
  cycleDay: number;
  phase: CyclePhase;
  currentCycleStart: string; // the auto-calculated start of the current cycle
}

export interface PhaseDate {
  phase: CyclePhase;
  label: string;
  startDay: number;
  endDay: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

const PHASE_RANGES: { phase: CyclePhase; label: string; startDay: number; endDay: number }[] = [
  { phase: "Menstrual", label: "Menstruation", startDay: 1, endDay: 5 },
  { phase: "Follicular", label: "Follicular", startDay: 6, endDay: 13 },
  { phase: "Ovulatory", label: "Ovulation", startDay: 14, endDay: 16 },
  { phase: "Luteal", label: "Luteal", startDay: 17, endDay: 28 },
];

export function getCycleInfo(cycleStartDate: string): CycleInfo | null {
  if (!cycleStartDate) return null;
  const start = new Date(cycleStartDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  if (diffMs < 0) return null;
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const cycleDay = (totalDays % 28) + 1;
  // Calculate current cycle start date (auto-recalculate after each 28-day cycle)
  const completedCycles = Math.floor(totalDays / 28);
  const currentCycleStart = format(addDays(start, completedCycles * 28), "yyyy-MM-dd");

  let phase: CyclePhase;
  if (cycleDay <= 5) phase = "Menstrual";
  else if (cycleDay <= 13) phase = "Follicular";
  else if (cycleDay <= 16) phase = "Ovulatory";
  else phase = "Luteal";

  return { cycleDay, phase, currentCycleStart };
}

export function getPhaseDates(cycleStartDate: string): PhaseDate[] | null {
  const info = getCycleInfo(cycleStartDate);
  if (!info) return null;

  const cycleStart = new Date(info.currentCycleStart);

  return PHASE_RANGES.map(({ phase, label, startDay, endDay }) => ({
    phase,
    label,
    startDay,
    endDay,
    startDate: format(addDays(cycleStart, startDay - 1), "MMM d"),
    endDate: format(addDays(cycleStart, endDay - 1), "MMM d"),
    isCurrent: info.phase === phase,
  }));
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

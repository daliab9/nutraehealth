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
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let cycleDay: number;
  let currentCycleStart: string;

  if (totalDays >= 0) {
    // Start date is today or in the past
    cycleDay = (totalDays % 28) + 1;
    const completedCycles = Math.floor(totalDays / 28);
    currentCycleStart = format(addDays(start, completedCycles * 28), "yyyy-MM-dd");
  } else {
    // Start date is in the future — back-calculate from the previous cycle
    const daysUntilStart = Math.abs(totalDays);
    const remainder = daysUntilStart % 28;
    cycleDay = remainder === 0 ? 28 : 28 - remainder;
    // The previous cycle started (28 - remainder) days before today... or rather:
    // currentCycleStart = future start - 28
    const prevCycleStart = addDays(start, -28);
    currentCycleStart = format(prevCycleStart, "yyyy-MM-dd");
  }

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

export const MEAL_GUIDANCE: Record<CyclePhase, string[]> = {
  Menstrual: [
    "Cravings may increase — honor them mindfully",
    "Iron-rich foods (leafy greens, lentils) support recovery",
    "Warm, comforting meals can help with cramps",
  ],
  Follicular: [
    "Better carb tolerance — enjoy whole grains",
    "Light, fresh meals feel best as energy rises",
    "Great time to try new recipes and foods",
  ],
  Ovulatory: [
    "Lighter meals support peak energy levels",
    "Focus on anti-inflammatory foods",
    "Raw vegetables and salads are well tolerated",
  ],
  Luteal: [
    "Slight increase in appetite is normal",
    "Complex carbs help stabilize mood",
    "Magnesium-rich foods (dark chocolate, nuts) reduce cravings",
    "Stay hydrated to reduce water retention",
  ],
};

export const EXERCISE_GUIDANCE: Record<CyclePhase, string[]> = {
  Menstrual: [
    "Energy may be lower — listen to your body",
    "Gentle movement: yoga, walking, stretching",
    "Avoid high-intensity if fatigued",
  ],
  Follicular: [
    "Energy rising — great time for strength training",
    "Try new workout styles or increase intensity",
    "Endurance and stamina are improving",
  ],
  Ovulatory: [
    "Peak strength and confidence",
    "Strong performance window for HIIT or heavy lifts",
    "Take advantage of high energy for group workouts",
  ],
  Luteal: [
    "Reduce intensity in late phase",
    "Prioritize recovery and rest days",
    "Moderate cardio and Pilates work well",
    "Possible water retention — don't stress the scale",
  ],
};

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

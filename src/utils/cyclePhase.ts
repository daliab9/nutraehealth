import { addDays, format } from "date-fns";

export type CyclePhase = "Menstrual" | "Follicular" | "Ovulatory" | "Luteal";

export type SubPhase = "early" | "late";

export interface CycleInfo {
  cycleDay: number;
  phase: CyclePhase;
  subPhase: SubPhase;
  subPhaseLabel: string;
  currentCycleStart: string;
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
    cycleDay = (totalDays % 28) + 1;
    const completedCycles = Math.floor(totalDays / 28);
    currentCycleStart = format(addDays(start, completedCycles * 28), "yyyy-MM-dd");
  } else {
    const daysUntilStart = Math.abs(totalDays);
    const remainder = daysUntilStart % 28;
    cycleDay = remainder === 0 ? 28 : 28 - remainder;
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

export interface PhaseGuidanceDetail {
  whatsHappening: string;
  whatThisMeans: string;
  tips: string[];
}

export const MEAL_GUIDANCE: Record<CyclePhase, PhaseGuidanceDetail> = {
  Menstrual: {
    whatsHappening: "Estrogen and progesterone are low. Prostaglandins increase, driving uterine contractions and inflammation. Iron is lost through bleeding. Some women experience lower appetite; others experience carbohydrate cravings.",
    whatThisMeans: "You may feel fatigued, achy, or crampy. Blood sugar may feel less stable if sleep is disrupted. Digestive sensitivity can increase.",
    tips: [
      "Increase iron intake: lean red meat, lentils, chickpeas, spinach, tofu",
      "Pair iron with vitamin C foods (citrus, bell peppers) to improve absorption",
      "Include magnesium-rich foods for cramp support: pumpkin seeds, almonds, dark chocolate (70%+), leafy greens",
      "Eat warm, simple meals if bloated: oatmeal, rice, soups, stews",
      "Keep protein consistent (20–30g per meal) to support recovery",
    ],
  },
  Follicular: {
    whatsHappening: "Estrogen rises. Insulin sensitivity improves. Carbohydrates are stored and used more efficiently.",
    whatThisMeans: "Energy is typically more stable. Appetite is often easier to regulate. This is often the most metabolically flexible window.",
    tips: [
      "Use this phase for structured nutrition adherence",
      "Emphasize lean protein (chicken, Greek yogurt, eggs, tofu)",
      "Include complex carbohydrates (rice, potatoes, oats, fruit) confidently around training",
      "If pursuing fat loss, maintain a consistent calorie target here",
    ],
  },
  Ovulatory: {
    whatsHappening: "Estrogen peaks. Metabolic rate is stable.",
    whatThisMeans: "Energy and confidence may be higher. Appetite is usually steady.",
    tips: [
      "Fuel performance appropriately on high-output days",
      "Maintain balanced macro distribution",
      "Prioritize hydration, especially if training intensely",
    ],
  },
  Luteal: {
    whatsHappening: "Progesterone rises. Resting metabolic rate increases slightly (often 100–300 kcal/day). Core temperature increases. Insulin sensitivity declines slightly. Water retention increases.",
    whatThisMeans: "Hunger increases, especially in the final 5–7 days. Cravings for carbohydrates and calorie-dense foods are hormonally driven. Scale weight may increase due to fluid retention.",
    tips: [
      "Increase protein to 25–35g per meal to manage satiety",
      "Add high-fiber carbohydrates (sweet potatoes, oats, quinoa, beans) to stabilize blood sugar",
      "Include magnesium and B6 sources (salmon, bananas, chickpeas) to support PMS symptoms",
      "Consider adding ~100–200 kcal if hunger is consistently elevated rather than forcing restriction",
      "Avoid reacting to temporary scale increases by cutting calories aggressively",
    ],
  },
};

export const EXERCISE_GUIDANCE: Record<CyclePhase, PhaseGuidanceDetail> = {
  Menstrual: {
    whatsHappening: "Inflammation and fatigue may increase perceived effort. Pain tolerance may be lower.",
    whatThisMeans: "Max-effort sessions may feel disproportionately taxing.",
    tips: [
      "Reduce total training volume by ~10–20% if cramps are moderate to severe",
      "Favor controlled strength work over all-out HIIT",
      "Avoid testing 1RM lifts during heavy symptom days",
      "Keep movement in, but lower intensity rather than eliminating training completely",
    ],
  },
  Follicular: {
    whatsHappening: "Neuromuscular coordination and recovery capacity often improve.",
    whatThisMeans: "Higher intensity and progressive overload are better tolerated.",
    tips: [
      "Schedule strength progression here",
      "Increase load or reps strategically",
      "Incorporate high-intensity intervals if programmed",
      "Push performance goals during this window",
    ],
  },
  Ovulatory: {
    whatsHappening: "Power output and maximal strength may peak.",
    whatThisMeans: "This is often a high-performance window.",
    tips: [
      "Schedule demanding lifts or speed work here",
      "Perform explosive movements if programmed",
      "Warm up thoroughly to protect joints",
    ],
  },
  Luteal: {
    whatsHappening: "Perceived exertion increases. Recovery may feel slower late phase. Sleep may decline.",
    whatThisMeans: "Workouts may feel harder at the same intensity.",
    tips: [
      "Early luteal: maintain normal programming",
      "Late luteal: reduce training volume by 10–20% or extend rest periods",
      "Swap maximal interval work for steady-state conditioning if needed",
      "Prioritize sleep and recovery strategies",
    ],
  },
};

export const MENTAL_GUIDANCE: Record<CyclePhase, PhaseGuidanceDetail> = {
  Menstrual: {
    whatsHappening: "Hormone levels are at their lowest. The body is focused on shedding and renewal.",
    whatThisMeans: "You may feel more introspective and emotionally sensitive. Energy for social interaction may be lower.",
    tips: [
      "Honor the need for rest — it's productive, not lazy",
      "Journaling or quiet reflection suits this phase well",
      "Emotional sensitivity may increase — practice self-compassion",
      "Avoid making major decisions if feeling overwhelmed",
    ],
  },
  Follicular: {
    whatsHappening: "Rising estrogen supports neurotransmitter production, including serotonin and dopamine.",
    whatThisMeans: "Mental clarity improves. Motivation and optimism tend to increase. Social energy rises.",
    tips: [
      "Use this window for creative thinking and planning",
      "Motivation is high — set intentions and start new projects",
      "Social energy is rising — schedule meaningful connections",
      "Learning and problem-solving are at their best",
    ],
  },
  Ovulatory: {
    whatsHappening: "Estrogen peaks alongside a surge in luteinizing hormone. Verbal fluency and confidence often peak.",
    whatThisMeans: "This is typically when you feel most confident, communicative, and socially magnetic.",
    tips: [
      "Schedule important conversations or presentations here",
      "Confidence is at its peak — leverage it",
      "Express needs clearly in relationships",
    ],
  },
  Luteal: {
    whatsHappening: "Progesterone rises while estrogen drops. Serotonin levels may decline, especially in the late luteal phase.",
    whatThisMeans: "Mood sensitivity increases. Anxiety or irritability are more common. Inner critic may be louder.",
    tips: [
      "Mood dips are hormonally driven — they're not character flaws",
      "Practice grounding techniques: breathwork, walks, warm baths",
      "Reduce commitments if possible in the final week",
      "Prioritize sleep — it directly impacts mood regulation",
      "Limit stimulants and alcohol which can amplify anxiety",
    ],
  },
};

// Legacy simple string arrays for backward compatibility
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

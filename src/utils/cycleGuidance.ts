import type { CyclePhase, PhaseGuidanceDetail } from "./cyclePhase";

export type SubPhase = "early" | "late";

export interface SubPhaseGuidanceDetail {
  whatsHappening: string;
  whatThisMeans: string;
  mealTips: string[];
  exerciseTips: string[];
}

export const SUB_PHASE_GUIDANCE: Record<CyclePhase, Record<SubPhase, SubPhaseGuidanceDetail>> = {
  Menstrual: {
    early: {
      whatsHappening:
        "Hormones are at their lowest. Prostaglandins peak, driving stronger cramps and inflammation. Iron loss begins. Pain sensitivity may be highest.",
      whatThisMeans:
        "Fatigue and discomfort often peak here. Appetite may be suppressed in some women. High-intensity training feels disproportionately difficult.",
      mealTips: [
        "Prioritize iron-rich foods immediately (red meat, lentils, spinach)",
        "Add vitamin C sources to improve absorption",
        "Include magnesium-rich foods (pumpkin seeds, almonds, dark chocolate) for cramp support",
        "Favor warm, easy-to-digest meals (soups, oats, rice bowls)",
      ],
      exerciseTips: [
        "Reduce volume 15–25% if cramping is moderate/severe",
        "Avoid maximal lifts or high-impact intervals",
        "Favor controlled strength work and low-impact conditioning",
      ],
    },
    late: {
      whatsHappening:
        "Inflammation decreases. Estrogen begins rising again. Energy starts to return.",
      whatThisMeans:
        "Pain often improves. Appetite stabilizes. Performance begins to rebound.",
      mealTips: [
        "Maintain protein consistency (20–30g per meal)",
        "Reintroduce structured nutrition if appetite was erratic earlier",
      ],
      exerciseTips: [
        "Gradually restore normal volume",
        "Reintroduce moderate intensity work",
      ],
    },
  },
  Follicular: {
    early: {
      whatsHappening:
        "Estrogen rises steadily. Insulin sensitivity improves. Nervous system stability increases.",
      whatThisMeans:
        "Appetite is often lower and easier to regulate. Carbohydrate tolerance improves. Motivation increases.",
      mealTips: [
        "Strong window for calorie adherence",
        "Include complex carbs around training",
        "Keep protein high for muscle support",
      ],
      exerciseTips: [
        "Increase training intensity progressively",
        "Good time to add volume or progressive overload",
      ],
    },
    late: {
      whatsHappening:
        "Estrogen continues rising toward peak. Recovery capacity is high.",
      whatThisMeans:
        "Peak training adaptation window approaching. Energy and focus often highest.",
      mealTips: [
        "Fuel performance; do not under-eat on heavy training days",
        "Maintain carb intake to support high-output sessions",
      ],
      exerciseTips: [
        "Schedule demanding lifts",
        "Add higher intensity intervals if programmed",
      ],
    },
  },
  Ovulatory: {
    early: {
      whatsHappening: "Estrogen peaks. Testosterone rises slightly.",
      whatThisMeans:
        "Peak strength and power for many women. Confidence and risk-taking may increase.",
      mealTips: [
        "Maintain balanced macro distribution",
        "Prioritize hydration",
      ],
      exerciseTips: [
        "Ideal window for PR attempts or performance testing",
        "Warm up thoroughly to support joint stability",
      ],
    },
    late: {
      whatsHappening:
        "Progesterone begins rising. Core temperature starts increasing.",
      whatThisMeans:
        "Energy may still feel strong but begins shifting.",
      mealTips: [
        "Maintain protein and fiber intake",
      ],
      exerciseTips: [
        "Maintain intensity but monitor recovery",
      ],
    },
  },
  Luteal: {
    early: {
      whatsHappening:
        "Progesterone rises. Resting metabolic rate begins increasing. Core temperature increases.",
      whatThisMeans:
        "Hunger begins rising gradually. Recovery still relatively strong early in phase.",
      mealTips: [
        "Increase protein to 25–35g per meal",
        "Include fiber-rich carbohydrates (oats, sweet potatoes, beans)",
        "Add magnesium sources to preempt PMS",
      ],
      exerciseTips: [
        "Maintain training intensity",
        "Slightly increase rest intervals if needed",
      ],
    },
    late: {
      whatsHappening:
        "Progesterone remains high. Water retention increases. Serotonin fluctuations influence mood and cravings. Insulin sensitivity slightly declines.",
      whatThisMeans:
        "Hunger and cravings peak. Scale weight may increase 1–3 kg from fluid. Workouts feel harder at same intensity. Recovery may feel slower.",
      mealTips: [
        "Add ~100–200 kcal if hunger is persistently elevated",
        "Prioritize protein and high-fiber carbs",
        "Reduce refined sugar spikes to stabilize mood",
        "Increase potassium-rich foods (bananas, yogurt, potatoes) to counter fluid retention",
      ],
      exerciseTips: [
        "Reduce total volume by 10–20% if recovery feels impaired",
        "Swap maximal HIIT for steady-state cardio",
        "Avoid testing new 1RM lifts",
      ],
    },
  },
};

/** Helper to extract meal-only or exercise-only guidance in the original PhaseGuidanceDetail shape */
export function getSubPhaseGuidance(
  phase: CyclePhase,
  subPhase: SubPhase,
  context: "meals" | "exercise",
): PhaseGuidanceDetail {
  const g = SUB_PHASE_GUIDANCE[phase][subPhase];
  return {
    whatsHappening: g.whatsHappening,
    whatThisMeans: g.whatThisMeans,
    tips: context === "meals" ? g.mealTips : g.exerciseTips,
  };
}

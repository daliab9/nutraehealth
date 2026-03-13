// Centralized calorie calculation logic

export type ActivityLevel = "sedentary" | "lightly_active" | "active";
export type GoalTimeline = "slow" | "moderate" | "fast";

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.35,
  active: 1.5,
};

// Daily deficit in kcal
export const TIMELINE_DEFICITS: Record<GoalTimeline, number> = {
  slow: 275,    // ~0.25 kg/week
  moderate: 500, // ~0.5 kg/week
  fast: 750,    // ~0.75 kg/week
};

export const ACTIVITY_LABELS: Record<ActivityLevel, { label: string; description: string }> = {
  sedentary: { label: "Mostly seated", description: "Desk job, minimal walking" },
  lightly_active: { label: "Lightly active", description: "Regular walking, errands, light daily movement" },
  active: { label: "Active", description: "On your feet most of the day" },
};

export const TIMELINE_LABELS: Record<GoalTimeline, { label: string; description: string }> = {
  slow: { label: "3–4 months", description: "Steady & sustainable pace" },
  moderate: { label: "2–3 months", description: "Balanced pace" },
  fast: { label: "1–2 months", description: "Faster pace" },
};

export function getMainGoal(goals: string[]): string {
  if (goals.includes("lose_weight") || goals.includes("reduce_body_fat")) return "lose";
  if (goals.includes("gain_muscle")) return "gain";
  if (goals.includes("maintain_weight")) return "maintain";
  return "health";
}

export function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  const g = gender?.toLowerCase() || "";
  const genderOffset = g === "female" ? -161 : 5;
  return 10 * weight + 6.25 * height - 5 * (age || 30) + genderOffset;
}

export function calculateCalories(
  weight: number,
  targetWeight: number,
  age: number,
  height: number,
  gender: string,
  goals: string[],
  activityLevel: ActivityLevel = "sedentary",
  goalTimeline: GoalTimeline = "moderate",
): number {
  const bmr = calculateBMR(weight, height, age, gender);
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  const maintenance = bmr * multiplier;
  const goal = getMainGoal(goals);

  if (goal === "maintain" || goal === "health") {
    return Math.round(maintenance);
  }

  if (goal === "gain") {
    return Math.round(maintenance + 300);
  }

  // Losing weight — apply deficit
  let deficit = TIMELINE_DEFICITS[goalTimeline] || 500;

  // Cap deficit at 25% of maintenance
  const maxDeficit = maintenance * 0.25;
  if (deficit > maxDeficit) {
    deficit = maxDeficit;
  }

  const target = Math.round(maintenance - deficit);

  // Minimum calorie floor
  return Math.max(1200, target);
}

export function calculateGoalDate(
  currentWeight: number,
  targetWeight: number,
  goals: string[],
): string {
  const goal = getMainGoal(goals);
  const diff = Math.abs(currentWeight - targetWeight);
  if (diff === 0 || goal === "maintain" || goal === "health") {
    return "Ongoing";
  }
  const weeks = Math.round(diff / 0.5);
  const now = new Date();
  const date = new Date(now.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

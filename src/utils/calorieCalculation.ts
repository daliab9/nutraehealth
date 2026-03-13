// Centralized calorie calculation logic

export type ActivityLevel = "sedentary" | "lightly_active" | "active";
export type GoalTimeline = "1_2_months" | "3_4_months" | "5_6_months" | "7_plus_months";

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.35,
  active: 1.5,
};

// Average weeks for each timeline option
export const TIMELINE_WEEKS: Record<GoalTimeline, number> = {
  "1_2_months": 6,
  "3_4_months": 14,
  "5_6_months": 22,
  "7_plus_months": 32,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, { label: string; description: string }> = {
  sedentary: { label: "Mostly seated", description: "Desk job, minimal walking" },
  lightly_active: { label: "Lightly active", description: "Regular walking, errands, light daily movement" },
  active: { label: "Active", description: "On your feet most of the day" },
};

export const TIMELINE_LABELS: Record<GoalTimeline, { label: string; description: string }> = {
  "1_2_months": { label: "1–2 months", description: "Faster pace" },
  "3_4_months": { label: "3–4 months", description: "Balanced pace" },
  "5_6_months": { label: "5–6 months", description: "Steady & sustainable pace" },
  "7_plus_months": { label: "7+ months", description: "Gentle, long-term pace" },
};

export const TIMELINE_OPTIONS: GoalTimeline[] = ["1_2_months", "3_4_months", "5_6_months", "7_plus_months"];
export const ACTIVITY_OPTIONS: ActivityLevel[] = ["sedentary", "lightly_active", "active"];

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
  goalTimeline: GoalTimeline = "3_4_months",
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

  // Losing weight — dynamic deficit based on weight diff and timeline
  const totalToLose = Math.abs(weight - targetWeight);
  const weeks = TIMELINE_WEEKS[goalTimeline] || 14;
  const weeklyLoss = totalToLose / weeks;
  // 1 kg of fat ≈ 7700 kcal
  let deficit = (weeklyLoss * 7700) / 7;

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
  goalTimeline: GoalTimeline = "3_4_months",
  age: number = 30,
  height: number = 170,
  gender: string = "",
  activityLevel: ActivityLevel = "sedentary",
): string {
  const goal = getMainGoal(goals);
  const diff = Math.abs(currentWeight - targetWeight);
  if (diff === 0 || goal === "maintain" || goal === "health") {
    return "Ongoing";
  }

  // Check if the deficit gets capped — if so, extend the timeline
  const bmr = calculateBMR(currentWeight, height, age, gender);
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  const maintenance = bmr * multiplier;
  const weeks = TIMELINE_WEEKS[goalTimeline] || 14;
  const weeklyLoss = diff / weeks;
  let dailyDeficit = (weeklyLoss * 7700) / 7;
  const maxDeficit = maintenance * 0.25;

  let actualWeeks = weeks;
  if (dailyDeficit > maxDeficit) {
    // Deficit was capped, so actual time will be longer
    const actualWeeklyLoss = (maxDeficit * 7) / 7700;
    actualWeeks = Math.ceil(diff / actualWeeklyLoss);
  }

  const now = new Date();
  const date = new Date(now.getTime() + actualWeeks * 7 * 24 * 60 * 60 * 1000);
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

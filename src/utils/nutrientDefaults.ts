// Default nutrient targets and configuration

export interface NutrientConfig {
  key: string;
  label: string;
  unit: string;
  getTarget: (profile: { currentWeight: number; gender: string; age: number; dietaryPreferences?: string[] }) => number;
  alwaysOn?: boolean; // Cannot be disabled
  autoSuggest?: (profile: { gender: string; dietaryPreferences?: string[] }) => boolean;
  qualitative?: boolean; // If true, tracked as low/medium/high instead of numeric
}

export const AVAILABLE_NUTRIENTS: NutrientConfig[] = [
  {
    key: "calories",
    label: "NET CALS",
    unit: "kcal",
    getTarget: () => 0, // Uses dailyCalorieTarget from profile
  },
  {
    key: "protein",
    label: "PROTEIN",
    unit: "g",
    getTarget: ({ currentWeight }) => Math.round(currentWeight * 1.8),
  },
  {
    key: "fiber",
    label: "FIBER",
    unit: "g",
    getTarget: ({ gender }) => (gender?.toLowerCase() === "female" ? 25 : 30),
  },
  {
    key: "iron",
    label: "IRON",
    unit: "mg",
    getTarget: ({ gender, age }) => {
      if (gender?.toLowerCase() === "female" && age < 51) return 18;
      return 8;
    },
    autoSuggest: ({ gender }) => gender?.toLowerCase() === "female",
  },
  {
    key: "vitamin_d",
    label: "VITAMIN D",
    unit: "IU",
    getTarget: ({ age }) => (age > 70 ? 800 : 600),
  },
  {
    key: "magnesium",
    label: "MAGNESIUM",
    unit: "mg",
    getTarget: ({ gender }) => (gender?.toLowerCase() === "female" ? 310 : 400),
  },
  {
    key: "omega3",
    label: "OMEGA-3",
    unit: "g",
    getTarget: ({ gender }) => (gender?.toLowerCase() === "female" ? 1.1 : 1.6),
  },
  {
    key: "b12",
    label: "B12",
    unit: "mcg",
    getTarget: () => 2.4,
    autoSuggest: ({ dietaryPreferences }) =>
      (dietaryPreferences || []).some((p) =>
        ["Vegetarian", "Vegan"].includes(p)
      ),
  },
  {
    key: "cholesterol",
    label: "CHOLESTEROL",
    unit: "",
    getTarget: () => 0,
    qualitative: true,
  },
];

export const DEFAULT_TRACKED = ["calories", "protein", "fiber"];

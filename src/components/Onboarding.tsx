import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollPicker } from "@/components/ScrollPicker";
import { ChevronRight } from "lucide-react";

interface OnboardingProps {
  onComplete: (data: OnboardingData) => void;
}

export interface OnboardingData {
  goals: string[];
  gender: string;
  currentWeight: number;
  height: number;
  heightUnit: "cm" | "ft";
  targetWeight: number;
  dietaryPreferences: string[];
  dietaryRestrictions: string[];
  dietaryRestrictionsOther?: string;
  healthConcerns: string[];
  healthConcernsOther?: string;
}

const GOALS = [
  { value: "lose_weight", label: "Lose weight" },
  { value: "maintain_weight", label: "Maintain weight" },
  { value: "gain_muscle", label: "Gain muscle" },
  { value: "reduce_body_fat", label: "Reduce body fat" },
  { value: "improve_health", label: "Improve overall health" },
  { value: "increase_energy", label: "Increase energy" },
  { value: "build_habits", label: "Build healthier eating habits" },
  { value: "feel_confident", label: "Feel more confident" },
  { value: "improve_mood", label: "Improve my mood" },
  { value: "reduce_stress", label: "Reduce stress" },
];

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

const DIET_PREFS = ["Vegetarian", "Vegan", "Pescatarian", "Keto", "Low-carb", "Mediterranean", "None"];

const DIET_RESTRICTIONS = [
  "Gluten-free",
  "Dairy-free",
  "Lactose intolerance",
  "Nut allergy",
  "Shellfish allergy",
  "Soy allergy",
  "Egg allergy",
  "Halal",
  "Kosher",
  "Low sodium",
  "Low sugar",
  "Other",
  "None",
];

const HEALTH_CONCERNS = [
  "High cholesterol",
  "High blood pressure",
  "Diabetes",
  "Pre-diabetes",
  "Iron deficiency",
  "B12 deficiency",
  "Vitamin D deficiency",
  "Thyroid issues",
  "PCOS",
  "IBS",
  "Digestive issues",
  "Heart disease",
  "Obesity",
  "Anemia",
  "Other",
  "None",
];

const TOTAL_STEPS = 8;

const weights = Array.from({ length: 161 }, (_, i) => 30 + i);
const heights = Array.from({ length: 101 }, (_, i) => 120 + i);

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    goals: [],
    gender: "",
    currentWeight: 70,
    height: 170,
    heightUnit: "cm",
    targetWeight: 65,
    dietaryPreferences: [],
    dietaryRestrictions: [],
    dietaryRestrictionsOther: "",
    healthConcerns: [],
    healthConcernsOther: "",
  });

  const canProceed = () => {
    switch (step) {
      case 0:
        return data.goals.length > 0;
      case 1:
        return data.gender !== "";
      case 2:
      case 3:
      case 4:
        return true;
      case 5:
        return data.dietaryPreferences.length > 0;
      case 6:
        return (
          data.dietaryRestrictions.length > 0 &&
          (!data.dietaryRestrictions.includes("Other") || data.dietaryRestrictionsOther?.trim())
        );
      case 7:
        return (
          data.healthConcerns.length > 0 && (!data.healthConcerns.includes("Other") || data.healthConcernsOther?.trim())
        );
      default:
        return false;
    }
  };

  const next = () => {
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      onComplete(data);
    }
  };

  const toggleMulti = (field: "dietaryPreferences" | "dietaryRestrictions" | "healthConcerns", value: string) => {
    setData((prev) => {
      const arr = prev[field];
      if (value === "None") {
        return { ...prev, [field]: ["None"] };
      }
      const withoutNone = arr.filter((v) => v !== "None");
      if (withoutNone.includes(value)) {
        return { ...prev, [field]: withoutNone.filter((v) => v !== value) };
      }
      return { ...prev, [field]: [...withoutNone, value] };
    });
  };

  const toggleGoal = (value: string) => {
    setData((prev) => {
      if (prev.goals.includes(value)) {
        return { ...prev, goals: prev.goals.filter((g) => g !== value) };
      }
      return { ...prev, goals: [...prev.goals, value] };
    });
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">What are your goals?</h2>
            <p className="text-sm text-muted-foreground">Select all that apply</p>
            <div className="mt-6 space-y-3">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => toggleGoal(g.value)}
                  className={`w-full p-4 rounded-2xl border-2 text-left font-medium transition-all ${
                    data.goals.includes(g.value) ? "border-foreground bg-secondary" : "border-border bg-card"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">What's your gender?</h2>
            <div className="mt-8 space-y-3">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  onClick={() => setData((d) => ({ ...d, gender: g }))}
                  className={`w-full p-4 rounded-2xl border-2 text-left font-medium transition-all ${
                    data.gender === g ? "border-foreground bg-secondary" : "border-border bg-card"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Current weight</h2>
            <p className="text-sm text-muted-foreground">in kg</p>
            <div className="mt-8 flex justify-center">
              <ScrollPicker
                items={weights}
                value={data.currentWeight}
                onChange={(v) => setData((d) => ({ ...d, currentWeight: Number(v) }))}
                suffix="kg"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Height</h2>
            <p className="text-sm text-muted-foreground">in cm</p>
            <div className="mt-8 flex justify-center">
              <ScrollPicker
                items={heights}
                value={data.height}
                onChange={(v) => setData((d) => ({ ...d, height: Number(v) }))}
                suffix="cm"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Target weight</h2>
            <p className="text-sm text-muted-foreground">in kg</p>
            <div className="mt-8 flex justify-center">
              <ScrollPicker
                items={weights}
                value={data.targetWeight}
                onChange={(v) => setData((d) => ({ ...d, targetWeight: Number(v) }))}
                suffix="kg"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Dietary preferences</h2>
            <div className="mt-8 space-y-3">
              {DIET_PREFS.map((p) => (
                <button
                  key={p}
                  onClick={() => toggleMulti("dietaryPreferences", p)}
                  className={`w-full p-4 rounded-2xl border-2 text-left font-medium transition-all ${
                    data.dietaryPreferences.includes(p) ? "border-foreground bg-secondary" : "border-border bg-card"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Dietary restrictions</h2>
            <div className="mt-8 space-y-3">
              {DIET_RESTRICTIONS.map((r) => (
                <div key={r}>
                  <button
                    onClick={() => toggleMulti("dietaryRestrictions", r)}
                    className={`w-full p-4 rounded-2xl border-2 text-left font-medium transition-all ${
                      data.dietaryRestrictions.includes(r) ? "border-foreground bg-secondary" : "border-border bg-card"
                    }`}
                  >
                    {r}
                  </button>

                  {r === "Other" && data.dietaryRestrictions.includes("Other") && (
                    <input
                      type="text"
                      placeholder="Please specify"
                      value={data.dietaryRestrictionsOther}
                      onChange={(e) =>
                        setData((d) => ({
                          ...d,
                          dietaryRestrictionsOther: e.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-border bg-card p-3 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Health concerns</h2>
            <div className="mt-8 space-y-3">
              {HEALTH_CONCERNS.map((h) => (
                <div key={h}>
                  <button
                    onClick={() => toggleMulti("healthConcerns", h)}
                    className={`w-full p-4 rounded-2xl border-2 text-left font-medium transition-all ${
                      data.healthConcerns.includes(h) ? "border-foreground bg-secondary" : "border-border bg-card"
                    }`}
                  >
                    {h}
                  </button>

                  {h === "Other" && data.healthConcerns.includes("Other") && (
                    <input
                      type="text"
                      placeholder="Please specify"
                      value={data.healthConcernsOther}
                      onChange={(e) =>
                        setData((d) => ({
                          ...d,
                          healthConcernsOther: e.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-border bg-card p-3 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 pt-12 pb-8">
      <div className="flex-1">{renderStep()}</div>

      <div className="pt-6">
        <Button onClick={next} disabled={!canProceed()} className="w-full h-14 rounded-2xl text-base font-semibold">
          {step === TOTAL_STEPS - 1 ? "Get started" : "Continue"}
          <ChevronRight className="ml-1 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

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
  age: number;
  currentWeight: number;
  weightUnit: "kg" | "lbs";
  height: number;
  heightUnit: "cm" | "ft";
  targetWeight: number;
  activityLevel: "sedentary" | "lightly_active" | "active";
  goalTimeline: "slow" | "moderate" | "fast";
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
  "Gluten-free", "Dairy-free", "Lactose intolerance", "Nut allergy",
  "Shellfish allergy", "Soy allergy", "Egg allergy", "Halal",
  "Kosher", "Low sodium", "Low sugar", "Other", "None",
];

const HEALTH_CONCERNS = [
  "High cholesterol", "High blood pressure", "Diabetes", "Pre-diabetes",
  "Iron deficiency", "B12 deficiency", "Vitamin D deficiency", "Thyroid issues",
  "PCOS", "IBS", "Digestive issues", "Heart disease", "Obesity", "Anemia",
  "Other", "None",
];

const TOTAL_STEPS = 11;

const ages = Array.from({ length: 83 }, (_, i) => 18 + i);
const weightsKg = Array.from({ length: 161 }, (_, i) => 30 + i);
const weightsLbs = Array.from({ length: 351 }, (_, i) => 66 + i);
const heightsCm = Array.from({ length: 101 }, (_, i) => 120 + i);
// Heights in ft as decimal values displayed as ft'in"
const heightsFtValues = (() => {
  const vals: number[] = [];
  for (let ft = 4; ft <= 7; ft++) {
    for (let inch = 0; inch < 12; inch++) {
      vals.push(ft * 12 + inch); // store as total inches
    }
  }
  return vals;
})();

// Skippable steps: goals(0), dietary prefs(8), restrictions(9), health concerns(10)
const SKIPPABLE_STEPS = [0, 8, 9, 10];

const UnitToggle = ({ options, value, onChange }: { options: [string, string]; value: string; onChange: (v: string) => void }) => (
  <div className="flex justify-center mb-4">
    <div className="inline-flex rounded-full border border-border bg-card p-1">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all ${
            value === opt ? "bg-foreground text-background" : "text-muted-foreground"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

export const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    goals: [],
    gender: "",
    age: 25,
    currentWeight: 70,
    weightUnit: "kg",
    height: 170,
    heightUnit: "cm",
    targetWeight: 65,
    activityLevel: "sedentary",
    goalTimeline: "moderate",
    dietaryPreferences: [],
    dietaryRestrictions: [],
    dietaryRestrictionsOther: "",
    healthConcerns: [],
    healthConcernsOther: "",
  });

  const isMandatory = !SKIPPABLE_STEPS.includes(step);

  const canProceed = () => {
    switch (step) {
      case 0: return data.goals.length > 0;
      case 1: return data.gender !== "";
      case 2: case 3: case 4: case 5: case 6: case 7: return true;
      case 8: return data.dietaryPreferences.length > 0;
      case 9: return data.dietaryRestrictions.length > 0 &&
        (!data.dietaryRestrictions.includes("Other") || data.dietaryRestrictionsOther?.trim());
      case 10: return data.healthConcerns.length > 0 &&
        (!data.healthConcerns.includes("Other") || data.healthConcernsOther?.trim());
      default: return false;
    }
  };

  const next = () => {
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      // Normalize to kg/cm before completing
      const normalized = { ...data };
      if (data.weightUnit === "lbs") {
        normalized.currentWeight = Math.round(data.currentWeight * 0.453592);
        normalized.targetWeight = Math.round(data.targetWeight * 0.453592);
      }
      if (data.heightUnit === "ft") {
        normalized.height = Math.round(data.height * 2.54); // height stored as total inches
      }
      onComplete(normalized);
    }
  };

  const skip = () => {
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      // Skipping the last step — complete onboarding
      const normalized = { ...data };
      if (data.weightUnit === "lbs") {
        normalized.currentWeight = Math.round(data.currentWeight * 0.453592);
        normalized.targetWeight = Math.round(data.targetWeight * 0.453592);
      }
      if (data.heightUnit === "ft") {
        normalized.height = Math.round(data.height * 2.54);
      }
      onComplete(normalized);
    }
  };

  const toggleMulti = (field: "dietaryPreferences" | "dietaryRestrictions" | "healthConcerns", value: string) => {
    setData((prev) => {
      const arr = prev[field];
      if (value === "None") return { ...prev, [field]: ["None"] };
      const withoutNone = arr.filter((v) => v !== "None");
      if (withoutNone.includes(value)) return { ...prev, [field]: withoutNone.filter((v) => v !== value) };
      return { ...prev, [field]: [...withoutNone, value] };
    });
  };

  const toggleGoal = (value: string) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.includes(value) ? prev.goals.filter((g) => g !== value) : [...prev.goals, value],
    }));
  };

  const formatFtIn = (totalInches: number) => {
    const ft = Math.floor(totalInches / 12);
    const inch = totalInches % 12;
    return `${ft}'${inch}"`;
  };

  const currentWeightItems = data.weightUnit === "kg" ? weightsKg : weightsLbs;
  const targetWeightItems = data.weightUnit === "kg" ? weightsKg : weightsLbs;

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">What are your goals?</h2>
            <p className="text-sm text-muted-foreground">Select all that apply</p>
            <div className="mt-6 space-y-3">
              {GOALS.map((g) => (
                <button key={g.value} onClick={() => toggleGoal(g.value)}
                  className={`w-full p-4 rounded-2xl border-2 text-left font-medium transition-all ${
                    data.goals.includes(g.value) ? "border-foreground bg-secondary" : "border-border bg-card"
                  }`}>{g.label}</button>
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
                <button key={g} onClick={() => setData((d) => ({ ...d, gender: g }))}
                  className={`w-full p-4 rounded-2xl border-2 text-left font-medium transition-all ${
                    data.gender === g ? "border-foreground bg-secondary" : "border-border bg-card"
                  }`}>{g}</button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">How old are you?</h2>
            <div className="mt-8 flex justify-center">
              <ScrollPicker items={ages} value={data.age}
                onChange={(v) => setData((d) => ({ ...d, age: Number(v) }))} />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Current weight</h2>
            <UnitToggle options={["kg", "lbs"]} value={data.weightUnit}
              onChange={(v) => {
                const unit = v as "kg" | "lbs";
                const converted = unit === "lbs"
                  ? Math.round(data.currentWeight * 2.20462)
                  : Math.round(data.currentWeight / 2.20462);
                setData((d) => ({ ...d, weightUnit: unit, currentWeight: converted,
                  targetWeight: unit === "lbs" ? Math.round(d.targetWeight * 2.20462) : Math.round(d.targetWeight / 2.20462) }));
              }} />
            <div className="mt-4 flex justify-center">
              <ScrollPicker items={currentWeightItems} value={data.currentWeight}
                onChange={(v) => setData((d) => ({ ...d, currentWeight: Number(v) }))}
                suffix={` ${data.weightUnit}`} />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Height</h2>
            <UnitToggle options={["cm", "ft"]} value={data.heightUnit}
              onChange={(v) => {
                const unit = v as "cm" | "ft";
                const converted = unit === "ft"
                  ? Math.round(data.height / 2.54) // cm to inches
                  : Math.round(data.height * 2.54); // inches to cm
                setData((d) => ({ ...d, heightUnit: unit, height: converted }));
              }} />
            <div className="mt-4 flex justify-center">
              {data.heightUnit === "cm" ? (
                <ScrollPicker items={heightsCm} value={data.height}
                  onChange={(v) => setData((d) => ({ ...d, height: Number(v) }))}
                  suffix=" cm" />
              ) : (
                <ScrollPicker items={heightsFtValues} value={data.height}
                  onChange={(v) => setData((d) => ({ ...d, height: Number(v) }))}
                  formatItem={formatFtIn} />
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">How active are you outside of workouts?</h2>
            <p className="text-sm text-muted-foreground">This helps us estimate your baseline calorie needs.</p>
            <div className="mt-6 space-y-3">
              {(["sedentary", "lightly_active", "active"] as const).map((level) => {
                const labels: Record<string, { label: string; desc: string }> = {
                  sedentary: { label: "Mostly seated", desc: "Desk job, minimal walking" },
                  lightly_active: { label: "Lightly active", desc: "Regular walking, errands, light daily movement" },
                  active: { label: "Active", desc: "On your feet most of the day" },
                };
                const { label, desc } = labels[level];
                return (
                  <button key={level} onClick={() => setData((d) => ({ ...d, activityLevel: level }))}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                      data.activityLevel === level ? "border-foreground bg-secondary" : "border-border bg-card"
                    }`}>
                    <span className="font-medium text-foreground">{label}</span>
                    <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Target weight</h2>
            <div className="mt-4 flex justify-center">
              <ScrollPicker items={targetWeightItems} value={data.targetWeight}
                onChange={(v) => setData((d) => ({ ...d, targetWeight: Number(v) }))}
                suffix={` ${data.weightUnit}`} />
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">When would you like to reach your goal weight?</h2>
            <p className="text-sm text-muted-foreground">Choose a pace that feels realistic for you.</p>
            <div className="mt-6 space-y-3">
              {(["slow", "moderate", "fast"] as const).map((timeline) => {
                const labels: Record<string, { label: string; desc: string }> = {
                  slow: { label: "3–4 months", desc: "Steady & sustainable pace" },
                  moderate: { label: "2–3 months", desc: "Balanced pace" },
                  fast: { label: "1–2 months", desc: "Faster pace" },
                };
                const { label, desc } = labels[timeline];
                return (
                  <button key={timeline} onClick={() => setData((d) => ({ ...d, goalTimeline: timeline }))}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                      data.goalTimeline === timeline ? "border-foreground bg-secondary" : "border-border bg-card"
                    }`}>
                    <span className="font-medium text-foreground">{label}</span>
                    <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Dietary preferences</h2>
            <div className="mt-8 space-y-3">
              {DIET_PREFS.map((p) => (
                <button key={p} onClick={() => toggleMulti("dietaryPreferences", p)}
                  className={`w-full p-4 rounded-2xl border-2 text-left font-medium transition-all ${
                    data.dietaryPreferences.includes(p) ? "border-foreground bg-secondary" : "border-border bg-card"
                  }`}>{p}</button>
              ))}
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Dietary restrictions</h2>
            <div className="mt-8 space-y-3">
              {DIET_RESTRICTIONS.map((r) => (
                <div key={r}>
                  <button onClick={() => toggleMulti("dietaryRestrictions", r)}
                    className={`w-full p-4 rounded-2xl border-2 text-left font-medium transition-all ${
                      data.dietaryRestrictions.includes(r) ? "border-foreground bg-secondary" : "border-border bg-card"
                    }`}>{r}</button>
                  {r === "Other" && data.dietaryRestrictions.includes("Other") && (
                    <input type="text" placeholder="Please specify" value={data.dietaryRestrictionsOther}
                      onChange={(e) => setData((d) => ({ ...d, dietaryRestrictionsOther: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-border bg-card p-3 text-sm" />
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 10:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Health concerns</h2>
            <div className="mt-8 space-y-3">
              {HEALTH_CONCERNS.map((h) => (
                <div key={h}>
                  <button onClick={() => toggleMulti("healthConcerns", h)}
                    className={`w-full p-4 rounded-2xl border-2 text-left font-medium transition-all ${
                      data.healthConcerns.includes(h) ? "border-foreground bg-secondary" : "border-border bg-card"
                    }`}>{h}</button>
                  {h === "Other" && data.healthConcerns.includes("Other") && (
                    <input type="text" placeholder="Please specify" value={data.healthConcernsOther}
                      onChange={(e) => setData((d) => ({ ...d, healthConcernsOther: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-border bg-card p-3 text-sm" />
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
      <div className="flex-1 overflow-y-auto">{renderStep()}</div>

      <div className="pt-6 space-y-2">
        <Button onClick={next} disabled={isMandatory && !canProceed()} className="w-full h-14 rounded-2xl text-base font-semibold">
          {step === TOTAL_STEPS - 1 ? "Get started" : "Continue"}
          <ChevronRight className="ml-1 h-5 w-5" />
        </Button>
        {!isMandatory && (
          <button onClick={skip} className="w-full py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Skip
          </button>
        )}
      </div>
    </div>
  );
};

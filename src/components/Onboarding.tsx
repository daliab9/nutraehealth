import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollPicker } from "@/components/ScrollPicker";
import { ChevronRight } from "lucide-react";

interface OnboardingProps {
  onComplete: (data: OnboardingData) => void;
}

export interface OnboardingData {
  goal: string;
  currentWeight: number;
  height: number;
  heightUnit: "cm" | "ft";
  targetWeight: number;
  dietaryPreferences: string[];
  dietaryRestrictions: string[];
  healthConcerns: string[];
}

const GOALS = [
  { value: "lose", label: "Lose weight", emoji: "🔥" },
  { value: "maintain", label: "Maintain weight", emoji: "⚖️" },
  { value: "gain", label: "Gain muscle", emoji: "💪" },
  { value: "health", label: "Improve health", emoji: "🌿" },
];

const DIET_PREFS = ["Vegetarian", "Vegan", "Pescatarian", "None"];
const DIET_RESTRICTIONS = ["Gluten-free", "Dairy-free", "Nut allergy", "None"];
const HEALTH_CONCERNS = [
  "High cholesterol",
  "High blood pressure",
  "Diabetes",
  "Iron deficiency",
  "B12 deficiency",
  "None",
];

const TOTAL_STEPS = 7;

const weights = Array.from({ length: 161 }, (_, i) => 30 + i); // 30-190 kg
const heights = Array.from({ length: 101 }, (_, i) => 120 + i); // 120-220 cm

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
    goal: "",
    currentWeight: 70,
    height: 170,
    heightUnit: "cm",
    targetWeight: 65,
    dietaryPreferences: [],
    dietaryRestrictions: [],
    healthConcerns: [],
  });

  const canProceed = () => {
    switch (step) {
      case 0: return data.goal !== "";
      case 1: return true;
      case 2: return true;
      case 3: return true;
      case 4: return data.dietaryPreferences.length > 0;
      case 5: return data.dietaryRestrictions.length > 0;
      case 6: return data.healthConcerns.length > 0;
      default: return false;
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

  const toggleMulti = (
    field: "dietaryPreferences" | "dietaryRestrictions" | "healthConcerns",
    value: string
  ) => {
    setData((prev) => {
      const arr = prev[field];
      if (value === "None") return { ...prev, [field]: ["None"] };
      const without = arr.filter((v) => v !== "None");
      if (without.includes(value)) {
        return { ...prev, [field]: without.filter((v) => v !== value) };
      }
      return { ...prev, [field]: [...without, value] };
    });
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">What's your primary goal?</h2>
            <p className="text-muted-foreground text-sm">This helps us personalize your experience</p>
            <div className="mt-8 space-y-3">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setData((d) => ({ ...d, goal: g.value }))}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                    data.goal === g.value
                      ? "border-foreground bg-secondary"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  <span className="text-2xl">{g.emoji}</span>
                  <span className="text-base font-medium text-foreground">{g.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Current weight</h2>
            <p className="text-muted-foreground text-sm">You can change this anytime</p>
            <div className="mt-8">
              <ScrollPicker
                items={weights}
                value={data.currentWeight}
                onChange={(v) => setData((d) => ({ ...d, currentWeight: v as number }))}
                suffix=" kg"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Your height</h2>
            <p className="text-muted-foreground text-sm">Used to calculate your daily needs</p>
            <div className="mt-8">
              <ScrollPicker
                items={heights}
                value={data.height}
                onChange={(v) => setData((d) => ({ ...d, height: v as number }))}
                suffix=" cm"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Target weight</h2>
            <p className="text-muted-foreground text-sm">We'll help you get there</p>
            <div className="mt-8">
              <ScrollPicker
                items={weights}
                value={data.targetWeight}
                onChange={(v) => setData((d) => ({ ...d, targetWeight: v as number }))}
                suffix=" kg"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Dietary preferences</h2>
            <p className="text-muted-foreground text-sm">Select all that apply</p>
            <div className="mt-8 space-y-3">
              {DIET_PREFS.map((p) => (
                <button
                  key={p}
                  onClick={() => toggleMulti("dietaryPreferences", p)}
                  className={`w-full p-4 rounded-2xl border-2 text-left font-medium transition-all ${
                    data.dietaryPreferences.includes(p)
                      ? "border-foreground bg-secondary"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Dietary restrictions</h2>
            <p className="text-muted-foreground text-sm">Select all that apply</p>
            <div className="mt-8 space-y-3">
              {DIET_RESTRICTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => toggleMulti("dietaryRestrictions", r)}
                  className={`w-full p-4 rounded-2xl border-2 text-left font-medium transition-all ${
                    data.dietaryRestrictions.includes(r)
                      ? "border-foreground bg-secondary"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">Health concerns</h2>
            <p className="text-muted-foreground text-sm">Helps us provide better insights</p>
            <div className="mt-8 space-y-3">
              {HEALTH_CONCERNS.map((h) => (
                <button
                  key={h}
                  onClick={() => toggleMulti("healthConcerns", h)}
                  className={`w-full p-4 rounded-2xl border-2 text-left font-medium transition-all ${
                    data.healthConcerns.includes(h)
                      ? "border-foreground bg-secondary"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  {h}
                </button>
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
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium">
            {step + 1} of {TOTAL_STEPS}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-foreground"
            initial={false}
            animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Continue button */}
      <div className="pt-6">
        <Button
          onClick={next}
          disabled={!canProceed()}
          className="w-full h-14 rounded-2xl text-base font-semibold"
        >
          {step === TOTAL_STEPS - 1 ? "Get started" : "Continue"}
          <ChevronRight className="ml-1 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface OnboardingSummaryProps {
  dailyCalories: number;
  goalDate: Date;
  goals: string[];
  onStart: () => void;
}

export const OnboardingSummary = ({ dailyCalories, goalDate, goals, onStart }: OnboardingSummaryProps) => {
  const formattedDate = goalDate.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const primaryGoal = goals[0];

  const goalLabel =
    primaryGoal === "lose_weight"
      ? "reach your target weight"
      : primaryGoal === "gain_muscle"
        ? "build muscle"
        : primaryGoal === "maintain_weight"
          ? "maintain your weight"
          : primaryGoal === "reduce_body_fat"
            ? "reduce body fat"
            : "improve your health";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-foreground"
      >
        <Check className="h-10 w-10 text-primary-foreground" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-2 text-3xl font-bold text-foreground text-center"
      >
        You're all set!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-10 text-muted-foreground text-center"
      >
        Here's your personalized plan
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-sm space-y-4"
      >
        <div className="rounded-2xl bg-card border border-border p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Daily calorie target</p>
          <p className="text-4xl font-bold text-foreground">{dailyCalories}</p>
          <p className="text-sm text-muted-foreground">kcal / day</p>
        </div>

        <div className="rounded-2xl bg-card border border-border p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Estimated to {goalLabel}</p>
          <p className="text-2xl font-bold text-foreground">{formattedDate}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-10 w-full max-w-sm"
      >
        <Button onClick={onStart} className="w-full h-14 rounded-2xl text-base font-semibold">
          Start tracking
        </Button>
      </motion.div>
    </div>
  );
};

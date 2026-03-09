import { useState, useMemo, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollPicker } from "@/components/ScrollPicker";
import type { Exercise } from "@/stores/useUserStore";

// Calories burned per minute (moderate intensity, ~70kg person)
const EXERCISE_DATABASE: Record<string, number> = {
  "Running": 11.5,
  "Walking": 4.0,
  "Cycling": 8.5,
  "Swimming": 9.0,
  "Yoga": 3.5,
  "Pilates": 4.0,
  "Weight Training": 6.0,
  "HIIT": 12.0,
  "CrossFit": 11.0,
  "Boxing": 10.0,
  "Kickboxing": 10.5,
  "Jump Rope": 12.5,
  "Rowing": 8.0,
  "Elliptical": 7.5,
  "Stair Climbing": 9.0,
  "Dancing": 6.5,
  "Tennis": 8.0,
  "Basketball": 8.5,
  "Soccer": 9.0,
  "Football": 8.5,
  "Volleyball": 5.0,
  "Badminton": 6.0,
  "Table Tennis": 4.5,
  "Golf": 4.0,
  "Hiking": 6.5,
  "Rock Climbing": 9.5,
  "Martial Arts": 10.0,
  "Stretching": 2.5,
  "Calisthenics": 7.0,
  "Skiing": 8.0,
  "Snowboarding": 6.5,
  "Surfing": 5.0,
  "Skateboarding": 5.5,
  "Ice Skating": 7.0,
  "Spinning": 10.0,
  "Barre": 4.5,
  "Tai Chi": 3.0,
  "Zumba": 8.0,
  "Aerobics": 7.5,
};

// Secondary metrics for exercises that have them
interface SecondaryMetricConfig {
  unit: string;
  label: string;
  values: number[];
}

const SECONDARY_METRICS: Record<string, SecondaryMetricConfig> = {
  "Running": { unit: "km", label: "Distance", values: [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10, 12, 15, 18, 20, 25, 30, 35, 40, 42] },
  "Walking": { unit: "steps", label: "Steps", values: [500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 12000, 15000, 20000] },
  "Cycling": { unit: "km", label: "Distance", values: [1, 2, 3, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100] },
  "Swimming": { unit: "laps", label: "Laps", values: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 25, 30, 35, 40, 50, 60, 80, 100] },
  "Hiking": { unit: "km", label: "Distance", values: [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 18, 20, 25, 30] },
  "Rowing": { unit: "m", label: "Meters", values: [250, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000] },
  "Elliptical": { unit: "km", label: "Distance", values: [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 10] },
  "Stair Climbing": { unit: "floors", label: "Floors", values: [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 100] },
  "Jump Rope": { unit: "jumps", label: "Jumps", values: [50, 100, 150, 200, 250, 300, 400, 500, 600, 750, 1000, 1500, 2000] },
  "Skiing": { unit: "runs", label: "Runs", values: [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20] },
  "Snowboarding": { unit: "runs", label: "Runs", values: [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20] },
  "Skateboarding": { unit: "km", label: "Distance", values: [0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10] },
  "Ice Skating": { unit: "km", label: "Distance", values: [0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10] },
  "Spinning": { unit: "km", label: "Distance", values: [2, 4, 6, 8, 10, 12, 15, 18, 20, 25, 30] },
  "Surfing": { unit: "waves", label: "Waves", values: [2, 4, 6, 8, 10, 12, 15, 20, 25, 30] },
};

const EXERCISE_NAMES = Object.keys(EXERCISE_DATABASE);
const DURATION_VALUES = Array.from({ length: 24 }, (_, i) => (i + 1) * 5);

interface ExerciseEntryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (exercise: Exercise) => void;
}

export const ExerciseEntry = ({ open, onOpenChange, onAdd }: ExerciseEntryProps) => {
  const [step, setStep] = useState<"search" | "duration">("search");
  const [query, setQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [duration, setDuration] = useState<string | number>(30);
  const [secondaryValue, setSecondaryValue] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return EXERCISE_NAMES.slice(0, 8);
    const q = query.toLowerCase();
    return EXERCISE_NAMES.filter((name) => name.toLowerCase().includes(q));
  }, [query]);

  const calPerMin = EXERCISE_DATABASE[selectedExercise] || 6.0;
  const estimatedCals = Math.round(calPerMin * Number(duration));
  const secondaryMetric = SECONDARY_METRICS[selectedExercise] || null;

  useEffect(() => {
    if (open) {
      setStep("search");
      setQuery("");
      setSelectedExercise("");
      setDuration(30);
      setSecondaryValue(null);
    }
  }, [open]);

  useEffect(() => {
    if (open && step === "search") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, step]);

  const selectExercise = (name: string) => {
    setSelectedExercise(name);
    const metric = SECONDARY_METRICS[name];
    if (metric) {
      // Pick a reasonable default
      const midIndex = Math.floor(metric.values.length / 3);
      setSecondaryValue(metric.values[midIndex]);
    } else {
      setSecondaryValue(null);
    }
    setStep("duration");
  };

  const handleAdd = () => {
    const exercise: Exercise = {
      id: Date.now().toString(),
      name: selectedExercise || query,
      duration: Number(duration),
      caloriesBurned: estimatedCals,
    };
    if (secondaryMetric && secondaryValue !== null) {
      exercise.secondaryMetric = secondaryValue;
      exercise.secondaryUnit = secondaryMetric.unit;
    }
    onAdd(exercise);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {step === "search" ? "Add Exercise" : selectedExercise}
          </DialogTitle>
        </DialogHeader>

        {step === "search" && (
          <div className="space-y-3 pt-2">
            <Input
              ref={inputRef}
              placeholder="Search exercise..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="rounded-xl"
            />
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filtered.map((name) => (
                <button
                  key={name}
                  onClick={() => selectExercise(name)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  {name}
                  <span className="text-muted-foreground ml-2 text-xs">
                    ~{EXERCISE_DATABASE[name]} kcal/min
                  </span>
                </button>
              ))}
              {filtered.length === 0 && query.trim() && (
                <button
                  onClick={() => selectExercise(query.trim())}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-secondary transition-colors"
                >
                  Add "{query.trim()}" as custom exercise
                </button>
              )}
            </div>
          </div>
        )}

        {step === "duration" && (
          <div className="space-y-4 pt-2">
            <div className="flex items-start justify-center gap-3">
              {/* Duration picker */}
              <div className="flex-1 text-center">
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Duration</p>
                <ScrollPicker
                  items={DURATION_VALUES}
                  value={duration}
                  onChange={(v) => setDuration(v)}
                  suffix=" min"
                  visibleItems={3}
                  itemHeight={40}
                />
              </div>

              {/* Secondary metric picker */}
              {secondaryMetric && secondaryValue !== null && (
                <div className="flex-1 text-center">
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">{secondaryMetric.label}</p>
                  <ScrollPicker
                    items={secondaryMetric.values}
                    value={secondaryValue}
                    onChange={(v) => setSecondaryValue(Number(v))}
                    suffix={` ${secondaryMetric.unit}`}
                    visibleItems={3}
                    itemHeight={40}
                  />
                </div>
              )}
            </div>

            <div className="text-center py-2">
              <p className="text-2xl font-bold text-foreground">{estimatedCals}</p>
              <p className="text-xs text-muted-foreground">estimated calories burned</p>
            </div>
            <Button
              onClick={handleAdd}
              className="w-full rounded-xl h-12"
            >
              Add Exercise
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

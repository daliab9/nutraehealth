import { useState, useMemo, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollPicker } from "@/components/ScrollPicker";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Exercise } from "@/stores/useUserStore";

const EXERCISE_DATABASE: Record<string, number> = {
  "Running": 11.5, "Walking": 4.0, "Cycling": 8.5, "Swimming": 9.0,
  "Yoga": 3.5, "Pilates": 4.0, "Weight Training": 6.0, "HIIT": 12.0,
  "CrossFit": 11.0, "Boxing": 10.0, "Kickboxing": 10.5, "Jump Rope": 12.5,
  "Rowing": 8.0, "Elliptical": 7.5, "Stair Climbing": 9.0, "Dancing": 6.5,
  "Tennis": 8.0, "Basketball": 8.5, "Soccer": 9.0, "Football": 8.5,
  "Volleyball": 5.0, "Badminton": 6.0, "Table Tennis": 4.5, "Golf": 4.0,
  "Hiking": 6.5, "Rock Climbing": 9.5, "Martial Arts": 10.0,
  "Stretching": 2.5, "Calisthenics": 7.0, "Skiing": 8.0,
  "Snowboarding": 6.5, "Surfing": 5.0, "Skateboarding": 5.5,
  "Ice Skating": 7.0, "Spinning": 10.0, "Barre": 4.5, "Tai Chi": 3.0,
  "Zumba": 8.0, "Aerobics": 7.5,
};

// Metric options per exercise. "duration" is always available.
// Additional options: "distance", "laps", "steps", "floors", "jumps", "runs", "waves"
interface MetricOption {
  key: string;
  label: string;
  unit?: string; // if set, single scroller with this unit
  hasUnitPicker?: boolean; // if true, show unit picker + value scroller
  units?: string[];
  values: Record<string, number[]>; // keyed by unit (or "default")
}

const DURATION_VALUES = Array.from({ length: 24 }, (_, i) => (i + 1) * 5);

const DISTANCE_UNITS = ["m", "km", "miles"];
const DISTANCE_VALUES: Record<string, number[]> = {
  m: [100, 200, 300, 400, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000],
  km: [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 10, 12, 15, 18, 20, 25, 30, 35, 40, 42],
  miles: [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 10, 13, 15, 20, 26],
};

const EXERCISE_METRICS: Record<string, MetricOption[]> = {
  "Running": [
    { key: "distance", label: "Distance", hasUnitPicker: true, units: DISTANCE_UNITS, values: DISTANCE_VALUES },
    { key: "steps", label: "Steps", unit: "steps", values: { default: [500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7000, 8000, 10000, 12000, 15000, 20000] } },
  ],
  "Walking": [
    { key: "distance", label: "Distance", hasUnitPicker: true, units: DISTANCE_UNITS, values: DISTANCE_VALUES },
    { key: "steps", label: "Steps", unit: "steps", values: { default: [500, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 12000, 15000, 20000] } },
  ],
  "Cycling": [
    { key: "distance", label: "Distance", hasUnitPicker: true, units: DISTANCE_UNITS, values: DISTANCE_VALUES },
  ],
  "Swimming": [
    { key: "laps", label: "Laps", unit: "laps", values: { default: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 25, 30, 35, 40, 50, 60, 80, 100] } },
  ],
  "Hiking": [
    { key: "distance", label: "Distance", hasUnitPicker: true, units: DISTANCE_UNITS, values: DISTANCE_VALUES },
  ],
  "Rowing": [
    { key: "distance", label: "Distance", hasUnitPicker: true, units: DISTANCE_UNITS, values: DISTANCE_VALUES },
  ],
  "Elliptical": [
    { key: "distance", label: "Distance", hasUnitPicker: true, units: DISTANCE_UNITS, values: DISTANCE_VALUES },
  ],
  "Stair Climbing": [
    { key: "floors", label: "Floors", unit: "floors", values: { default: [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 100] } },
  ],
  "Jump Rope": [
    { key: "jumps", label: "Jumps", unit: "jumps", values: { default: [50, 100, 150, 200, 250, 300, 400, 500, 600, 750, 1000, 1500, 2000] } },
  ],
  "Skiing": [
    { key: "runs", label: "Runs", unit: "runs", values: { default: [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20] } },
  ],
  "Snowboarding": [
    { key: "runs", label: "Runs", unit: "runs", values: { default: [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20] } },
  ],
  "Skateboarding": [
    { key: "distance", label: "Distance", hasUnitPicker: true, units: DISTANCE_UNITS, values: DISTANCE_VALUES },
  ],
  "Ice Skating": [
    { key: "distance", label: "Distance", hasUnitPicker: true, units: DISTANCE_UNITS, values: DISTANCE_VALUES },
  ],
  "Spinning": [
    { key: "distance", label: "Distance", hasUnitPicker: true, units: DISTANCE_UNITS, values: DISTANCE_VALUES },
  ],
  "Surfing": [
    { key: "waves", label: "Waves", unit: "waves", values: { default: [2, 4, 6, 8, 10, 12, 15, 20, 25, 30] } },
  ],
};

const EXERCISE_NAMES = Object.keys(EXERCISE_DATABASE);

interface ExerciseEntryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (exercise: Exercise) => void;
  editExercise?: Exercise | null;
}

export const ExerciseEntry = ({ open, onOpenChange, onAdd, editExercise }: ExerciseEntryProps) => {
  const [step, setStep] = useState<"search" | "duration">("search");
  const [query, setQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [activeMetric, setActiveMetric] = useState<string>("duration");
  const [durationValue, setDurationValue] = useState<number>(30);
  const [metricValue, setMetricValue] = useState<number>(5);
  const [distanceUnit, setDistanceUnit] = useState<string>("km");
  const inputRef = useRef<HTMLInputElement>(null);

  const metrics = EXERCISE_METRICS[selectedExercise] || [];
  const toggleOptions = [
    { key: "duration", label: "Duration" },
    ...metrics.map((m) => ({ key: m.key, label: m.label })),
  ];

  const activeMetricConfig = metrics.find((m) => m.key === activeMetric);

  const calPerMin = EXERCISE_DATABASE[selectedExercise] || 6.0;
  const estimatedCals = Math.round(calPerMin * durationValue);

  const filtered = useMemo(() => {
    if (!query.trim()) return EXERCISE_NAMES.slice(0, 8);
    const q = query.toLowerCase();
    return EXERCISE_NAMES.filter((name) => name.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    if (!open) return;
    if (editExercise) {
      // Editing: go straight to duration step with existing values
      setSelectedExercise(editExercise.name);
      setStep("duration");
      setQuery("");
      if (editExercise.secondaryMetric && editExercise.secondaryUnit) {
        // Find which metric key matches
        const exMetrics = EXERCISE_METRICS[editExercise.name] || [];
        const matchedMetric = exMetrics.find((m) => {
          if (m.hasUnitPicker && m.units?.includes(editExercise.secondaryUnit!)) return true;
          if (m.unit === editExercise.secondaryUnit) return true;
          return false;
        });
        if (matchedMetric) {
          setActiveMetric(matchedMetric.key);
          setMetricValue(editExercise.secondaryMetric);
          if (matchedMetric.hasUnitPicker) {
            setDistanceUnit(editExercise.secondaryUnit!);
          }
        } else {
          setActiveMetric("duration");
          setDurationValue(editExercise.duration || 30);
        }
      } else {
        setActiveMetric("duration");
        setDurationValue(editExercise.duration || 30);
      }
    } else {
      setStep("search");
      setQuery("");
      setSelectedExercise("");
      setActiveMetric("duration");
      setDurationValue(30);
      setMetricValue(5);
      setDistanceUnit("km");
    }
  }, [open, editExercise]);

  useEffect(() => {
    if (open && step === "search") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, step]);

  const selectExercise = (name: string) => {
    setSelectedExercise(name);
    setActiveMetric("duration");
    setDurationValue(30);
    setDistanceUnit("km");
    // Set a sensible default for the first metric
    const m = EXERCISE_METRICS[name];
    if (m && m.length > 0) {
      const firstMetric = m[0];
      const unit = firstMetric.hasUnitPicker ? (firstMetric.units?.[1] || "km") : "default";
      const vals = firstMetric.values[unit] || firstMetric.values["default"] || [];
      setMetricValue(vals[Math.floor(vals.length / 3)] || 5);
    }
    setStep("duration");
  };

  const handleMetricToggle = (val: string) => {
    if (!val) return;
    setActiveMetric(val);
    if (val !== "duration") {
      const config = metrics.find((m) => m.key === val);
      if (config) {
        const unit = config.hasUnitPicker ? distanceUnit : "default";
        const vals = config.values[unit] || config.values["default"] || [];
        setMetricValue(vals[Math.floor(vals.length / 3)] || 5);
      }
    }
  };

  // Estimate calories from a non-duration metric
  const estimateCalsFromMetric = (): number => {
    if (!activeMetricConfig) return 0;
    const unit = activeMetricConfig.hasUnitPicker ? distanceUnit : (activeMetricConfig.unit || "");
    // Rough avg minutes per unit to convert to calorie estimate
    const minutesPerUnit: Record<string, number> = {
      km: 6, miles: 10, m: 0.005, steps: 0.012,
      laps: 1.5, floors: 0.5, jumps: 0.05, runs: 8, waves: 3,
    };
    const estMinutes = (minutesPerUnit[unit] || 1) * metricValue;
    return Math.round(calPerMin * estMinutes);
  };

  const handleAdd = () => {
    const isMetric = activeMetric !== "duration";
    const cals = isMetric ? estimateCalsFromMetric() : estimatedCals;

    const exercise: Exercise = {
      id: Date.now().toString(),
      name: selectedExercise || query,
      duration: isMetric ? 0 : durationValue,
      caloriesBurned: cals,
    };
    if (isMetric && activeMetricConfig) {
      exercise.secondaryMetric = metricValue;
      exercise.secondaryUnit = activeMetricConfig.hasUnitPicker ? distanceUnit : (activeMetricConfig.unit || activeMetric);
    }
    onAdd(exercise);
    onOpenChange(false);
  };

  // Get the values array for the active metric
  const getMetricValues = (): number[] => {
    if (!activeMetricConfig) return [];
    if (activeMetricConfig.hasUnitPicker) {
      return activeMetricConfig.values[distanceUnit] || [];
    }
    return activeMetricConfig.values["default"] || [];
  };

  const getMetricSuffix = (): string => {
    if (!activeMetricConfig) return "";
    if (activeMetricConfig.hasUnitPicker) return ` ${distanceUnit}`;
    return ` ${activeMetricConfig.unit || ""}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {step === "search" ? "Add Exercise" : (editExercise ? `Edit ${selectedExercise}` : selectedExercise)}
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
            {/* Metric toggle */}
            {toggleOptions.length > 1 && (
              <ToggleGroup
                type="single"
                value={activeMetric}
                onValueChange={handleMetricToggle}
                className="w-full bg-secondary/50 rounded-xl p-1"
              >
                {toggleOptions.map((opt) => (
                  <ToggleGroupItem
                    key={opt.key}
                    value={opt.key}
                    className="flex-1 rounded-lg text-xs data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm px-3 py-1.5"
                  >
                    {opt.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}

            {/* Duration scroller */}
            {activeMetric === "duration" && (
              <div className="text-center">
                <ScrollPicker
                  items={DURATION_VALUES}
                  value={durationValue}
                  onChange={(v) => setDurationValue(Number(v))}
                  suffix=" min"
                  visibleItems={3}
                  itemHeight={40}
                />
              </div>
            )}

            {/* Metric scroller(s) */}
            {activeMetric !== "duration" && activeMetricConfig && (
              <div className="flex items-start justify-center gap-3">
                {/* Unit picker (left) for distance */}
                {activeMetricConfig.hasUnitPicker && activeMetricConfig.units && (
                  <div className="flex-shrink-0 text-center" style={{ width: 72 }}>
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide">Unit</p>
                    <ScrollPicker
                      items={activeMetricConfig.units}
                      value={distanceUnit}
                      onChange={(v) => {
                        const newUnit = String(v);
                        setDistanceUnit(newUnit);
                        const vals = activeMetricConfig.values[newUnit] || [];
                        setMetricValue(vals[Math.floor(vals.length / 3)] || vals[0] || 1);
                      }}
                      visibleItems={3}
                      itemHeight={40}
                    />
                  </div>
                )}

                {/* Value scroller (right, or centered if no unit picker) */}
                <div className="flex-1 text-center">
                  {activeMetricConfig.hasUnitPicker && (
                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wide">Value</p>
                  )}
                  <ScrollPicker
                    key={activeMetric + (activeMetricConfig.hasUnitPicker ? distanceUnit : "")}
                    items={getMetricValues()}
                    value={metricValue}
                    onChange={(v) => setMetricValue(Number(v))}
                    suffix={activeMetricConfig.hasUnitPicker ? "" : getMetricSuffix()}
                    visibleItems={3}
                    itemHeight={40}
                  />
                </div>
              </div>
            )}

            <div className="text-center py-2">
              <p className="text-2xl font-bold text-foreground">
                {activeMetric === "duration" ? estimatedCals : estimateCalsFromMetric()}
              </p>
              <p className="text-xs text-muted-foreground">estimated calories burned</p>
            </div>

            <Button onClick={handleAdd} className="w-full rounded-xl h-12">
              {editExercise ? "Save" : "Add Exercise"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

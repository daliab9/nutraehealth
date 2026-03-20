import { useState, useEffect } from "react";
import { Star, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { FoodItem, DefaultMealFrequency, MealEntry } from "@/stores/useUserStore";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface SaveMealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: FoodItem[];
  mealType: string;
  groupName?: string;
  onSaveAsMeal: (name: string, items: FoodItem[]) => void;
  onSetAsDefault: (name: string, items: FoodItem[], mealType: MealEntry["type"], frequency: DefaultMealFrequency, specificDays?: number[]) => void;
}

type Step = "choose" | "name-save" | "name-default" | "schedule";

export const SaveMealModal = ({
  open,
  onOpenChange,
  items,
  mealType,
  groupName,
  onSaveAsMeal,
  onSetAsDefault,
}: SaveMealModalProps) => {
  const [step, setStep] = useState<Step>("choose");
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<DefaultMealFrequency>("everyday");
  const [specificDays, setSpecificDays] = useState<number[]>([]);

  // Auto-suggest name: use groupName or single item name
  const suggestedName = groupName || (items.length === 1 ? items[0].name : "");

  useEffect(() => {
    if (open) {
      setStep("choose");
      setName(suggestedName);
      setFrequency("everyday");
      setSpecificDays([]);
    }
  }, [open, suggestedName]);

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
  };

  const toggleDay = (day: number) => {
    setSpecificDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSaveAsMeal = () => {
    if (!name.trim()) return;
    onSaveAsMeal(name.trim(), items);
    handleOpenChange(false);
  };

  const handleSetAsDefault = () => {
    if (!name.trim()) return;
    onSetAsDefault(
      name.trim(),
      items,
      mealType as MealEntry["type"],
      frequency,
      frequency === "specific" ? specificDays : undefined
    );
    handleOpenChange(false);
  };

  const totalCals = items.reduce((s, i) => s + i.calories, 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl max-w-sm">
        {step === "choose" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-foreground" />
                Save Meal
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {items.length} items · {totalCals} kcal
            </p>
            <div className="space-y-3 pt-2">
              <Button
                variant="outline"
                className="w-full rounded-xl h-14 justify-start gap-3 text-left"
                onClick={() => setStep("name-save")}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">Save as Meal</span>
                  <span className="text-xs text-muted-foreground">Reusable from Profile → Saved</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-xl h-14 justify-start gap-3 text-left"
                onClick={() => setStep("name-default")}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Set as Default Meal
                  </span>
                  <span className="text-xs text-muted-foreground">Auto-logs on scheduled days</span>
                </div>
              </Button>
            </div>
          </>
        )}

        {step === "name-save" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <button onClick={() => setStep("choose")} className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-muted active:scale-95 transition-transform">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                Name your saved meal
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Input
                placeholder="e.g. Morning Oats"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl"
                autoFocus
              />
              <Button
                onClick={handleSaveAsMeal}
                className="w-full rounded-xl h-12"
                disabled={!name.trim()}
              >
                Save Meal
              </Button>
            </div>
          </>
        )}

        {step === "name-default" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <button onClick={() => setStep("choose")} className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-muted active:scale-95 transition-transform">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                Name your default meal
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Input
                placeholder="e.g. Weekday Breakfast"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl"
                autoFocus
              />
              <Button
                onClick={() => { if (name.trim()) setStep("schedule"); }}
                className="w-full rounded-xl h-12"
                disabled={!name.trim()}
              >
                Next — Set Schedule
              </Button>
            </div>
          </>
        )}

        {step === "schedule" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <button onClick={() => setStep("name-default")} className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-muted active:scale-95 transition-transform">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                How often should this appear?
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              {(["everyday", "weekdays", "weekends", "specific"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                    frequency === f
                      ? "border-foreground bg-secondary"
                      : "border-border bg-card"
                  }`}
                >
                  {f === "everyday" && "Every day"}
                  {f === "weekdays" && "Weekdays only"}
                  {f === "weekends" && "Weekends only"}
                  {f === "specific" && "Specific days"}
                </button>
              ))}

              {frequency === "specific" && (
                <div className="flex justify-between gap-1.5 pt-2">
                  {DAY_LABELS.map((label, i) => (
                    <button
                      key={i}
                      onClick={() => toggleDay(i)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                        specificDays.includes(i)
                          ? "border-foreground bg-secondary text-secondary-foreground"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <Button
                onClick={handleSetAsDefault}
                className="w-full rounded-xl h-12 mt-2"
                disabled={frequency === "specific" && specificDays.length === 0}
              >
                Save Default Meal
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

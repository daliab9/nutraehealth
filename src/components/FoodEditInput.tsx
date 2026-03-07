import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollPicker } from "@/components/ScrollPicker";
import type { FoodItem } from "@/stores/useUserStore";

const UNITS = ["g", "ml", "mg", "oz", "cup", "tbsp", "tsp", "serving", "piece", "slice"];

const unitToGrams: Record<string, number> = {
  g: 1, ml: 1, mg: 0.001, oz: 28.35, cup: 240, tbsp: 15, tsp: 5, serving: 100, piece: 100, slice: 30,
};

interface FoodEditInputProps {
  item: FoodItem;
  onSave: (item: FoodItem) => void;
  onCancel: () => void;
}

function parseQuantity(quantity: string): { amount: number; unit: string } {
  const match = quantity.match(/^(\d+(?:\.\d+)?)\s*(.+)$/);
  if (match) return { amount: Number(match[1]), unit: match[2].trim() };
  const numMatch = quantity.match(/^(\d+(?:\.\d+)?)/);
  if (numMatch) return { amount: Number(numMatch[1]), unit: "g" };
  return { amount: 100, unit: "g" };
}

const getAmountOptions = (unit: string): number[] => {
  if (unit === "g" || unit === "ml" || unit === "mg") {
    return [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100, 125, 150, 175, 200, 250, 300, 350, 400, 450, 500, 600, 700, 750, 800, 900, 1000];
  }
  return [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10, 12, 15, 20];
};

export const FoodEditInput = ({ item, onSave, onCancel }: FoodEditInputProps) => {
  const parsed = parseQuantity(item.quantity || "100g");
  const [portionAmount, setPortionAmount] = useState(parsed.amount);
  const [portionUnit, setPortionUnit] = useState(parsed.unit);

  const [baseNutrition] = useState({
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    amount: parsed.amount,
    unit: parsed.unit,
  });

  const amountOptions = useMemo(() => {
    const base = getAmountOptions(portionUnit);
    if (!base.includes(portionAmount)) {
      return [...base, portionAmount].sort((a, b) => a - b);
    }
    return base;
  }, [portionUnit, portionAmount]);

  const getGramsForAmount = (amount: number, unit: string) => {
    const factor = unitToGrams[unit] || 1;
    return amount * factor;
  };

  const baseGrams = getGramsForAmount(baseNutrition.amount, baseNutrition.unit);
  const currentGrams = getGramsForAmount(portionAmount, portionUnit);
  const ratio = baseGrams > 0 ? currentGrams / baseGrams : 1;

  const scaledCalories = Math.round(baseNutrition.calories * ratio);
  const scaledProtein = Math.round(baseNutrition.protein * ratio);
  const scaledCarbs = Math.round(baseNutrition.carbs * ratio);
  const scaledFat = Math.round(baseNutrition.fat * ratio);

  const handleSave = () => {
    onSave({
      ...item,
      calories: scaledCalories,
      protein: scaledProtein,
      carbs: scaledCarbs,
      fat: scaledFat,
      quantity: `${portionAmount}${portionUnit}`,
    });
  };

  return (
    <div className="space-y-3">
      <div className="text-center">
        <h3 className="text-base font-semibold text-foreground">{item.name}</h3>
      </div>

      {/* Portion scroll pickers */}
      <div className="flex items-center justify-center gap-2 py-2">
        <div className="flex-1 max-w-[140px]">
          <ScrollPicker
            items={amountOptions}
            value={portionAmount}
            onChange={(v) => setPortionAmount(Number(v))}
            itemHeight={40}
            visibleItems={3}
          />
        </div>
        <div className="flex-1 max-w-[100px]">
          <ScrollPicker
            items={UNITS}
            value={portionUnit}
            onChange={(v) => setPortionUnit(String(v))}
            itemHeight={40}
            visibleItems={3}
          />
        </div>
      </div>

      {/* Nutrition breakdown */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="rounded-xl bg-muted/50 p-2.5">
          <p className="text-lg font-bold text-foreground">{scaledCalories}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">kcal</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-2.5">
          <p className="text-lg font-bold text-foreground">{scaledProtein}g</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Protein</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-2.5">
          <p className="text-lg font-bold text-foreground">{scaledCarbs}g</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Carbs</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-2.5">
          <p className="text-lg font-bold text-foreground">{scaledFat}g</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Fat</p>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1 rounded-xl h-11" onClick={handleSave}>
          Save
        </Button>
      </div>
    </div>
  );
};

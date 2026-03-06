import { useState, useEffect, useRef } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FoodItem } from "@/stores/useUserStore";

const UNITS = ["g", "ml", "mg", "oz", "cup", "tbsp", "tsp", "slice", "piece"];

const unitToGrams: Record<string, number> = {
  g: 1, ml: 1, mg: 0.001, oz: 28.35, cup: 240, tbsp: 15, tsp: 5, slice: 30, piece: 100,
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

export const FoodEditInput = ({ item, onSave, onCancel }: FoodEditInputProps) => {
  const parsed = parseQuantity(item.quantity || "100g");
  const [portionAmount, setPortionAmount] = useState(parsed.amount);
  const [portionUnit, setPortionUnit] = useState(parsed.unit);
  const [editingAmount, setEditingAmount] = useState(false);
  const [editingUnit, setEditingUnit] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Store base nutrition per current portion for scaling
  const [baseNutrition] = useState({
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    amount: parsed.amount,
    unit: parsed.unit,
  });

  useEffect(() => {
    if (editingAmount) {
      amountInputRef.current?.focus();
      amountInputRef.current?.select();
    }
  }, [editingAmount]);

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

  const getStep = () => {
    if (portionUnit === "mg") return 50;
    if (portionUnit === "ml" || portionUnit === "g") return 10;
    return 1;
  };

  const handleAmountClick = () => {
    setAmountInput(String(portionAmount));
    setEditingAmount(true);
  };

  const commitAmount = () => {
    const val = Number(amountInput);
    if (val > 0) setPortionAmount(val);
    setEditingAmount(false);
  };

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

      {/* Portion adjuster */}
      <div className="flex items-center justify-center gap-4 py-2">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={() => setPortionAmount((p) => Math.max(1, p - getStep()))}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <div className="relative flex items-baseline gap-1 min-w-[100px] justify-center">
          {editingAmount ? (
            <input
              ref={amountInputRef}
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              onBlur={commitAmount}
              onKeyDown={(e) => { if (e.key === "Enter") commitAmount(); }}
              className="w-20 text-2xl font-bold text-foreground text-center bg-transparent border-b-2 border-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          ) : (
            <button
              onClick={handleAmountClick}
              className="text-2xl font-bold text-foreground hover:opacity-70 transition-opacity"
            >
              {portionAmount}
            </button>
          )}
          {editingUnit && (
            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl shadow-lg z-10 py-1 max-h-48 overflow-y-auto">
              {UNITS.map((u) => (
                <button
                  key={u}
                  onClick={() => { setPortionUnit(u); setEditingUnit(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                    u === portionUnit ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setEditingUnit(!editingUnit)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            {portionUnit}
          </button>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={() => setPortionAmount((p) => p + getStep())}
        >
          <Plus className="h-4 w-4" />
        </Button>
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

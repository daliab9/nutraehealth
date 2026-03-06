import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2, Minus, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { FoodItem } from "@/stores/useUserStore";

interface FoodSuggestion {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  default_portion_amount: number;
  default_portion_unit: string;
  // Legacy field for backward compat
  default_portion_g?: number;
  portion_label: string;
}

const UNITS = ["g", "ml", "mg", "oz", "cup", "tbsp", "tsp", "slice", "piece"];

// Rough conversion factors to grams for scaling nutrition
const unitToGrams: Record<string, number> = {
  g: 1,
  ml: 1,       // rough: 1ml ≈ 1g for most foods/liquids
  mg: 0.001,
  oz: 28.35,
  cup: 240,
  tbsp: 15,
  tsp: 5,
  slice: 30,
  piece: 100,
};

interface FoodSearchInputProps {
  onAddItem: (item: FoodItem) => void;
  onClose: () => void;
}

export const FoodSearchInput = ({ onAddItem, onClose }: FoodSearchInputProps) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FoodSuggestion | null>(null);
  const [portionAmount, setPortionAmount] = useState(100);
  const [portionUnit, setPortionUnit] = useState("g");
  const [editingAmount, setEditingAmount] = useState(false);
  const [editingUnit, setEditingUnit] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const amountInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  const searchFood = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-food", {
        body: { query: q },
      });
      if (error) throw error;
      setSuggestions(data?.results || []);
    } catch (e) {
      console.error("Food search error:", e);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selected) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchFood(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, selected, searchFood]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (editingAmount) {
      amountInputRef.current?.focus();
      amountInputRef.current?.select();
    }
  }, [editingAmount]);

  const selectFood = (food: FoodSuggestion) => {
    setSelected(food);
    const amount = food.default_portion_amount || food.default_portion_g || 100;
    const unit = food.default_portion_unit || "g";
    setPortionAmount(amount);
    setPortionUnit(unit);
    setQuery(food.name);
    setSuggestions([]);
  };

  // Scale nutrition: all base values are per 100g
  // Convert current portion to grams equivalent, then scale
  const getGramsEquivalent = () => {
    const factor = unitToGrams[portionUnit] || 1;
    return portionAmount * factor;
  };

  const scale = (val: number) => Math.round((val * getGramsEquivalent()) / 100);

  const handleConfirm = () => {
    if (!selected) return;
    onAddItem({
      id: Date.now().toString(),
      name: selected.name,
      calories: scale(selected.calories),
      protein: scale(selected.protein),
      carbs: scale(selected.carbs),
      fat: scale(selected.fat),
      quantity: `${portionAmount}${portionUnit}`,
    });
    onClose();
  };

  const adjustPortion = (delta: number) => {
    setPortionAmount((prev) => Math.max(1, prev + delta));
  };

  const getStep = () => {
    if (portionUnit === "mg") return 50;
    if (portionUnit === "ml" || portionUnit === "g") return 10;
    if (portionUnit === "oz") return 1;
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

  const cycleUnit = () => {
    setEditingUnit(true);
  };

  const selectUnit = (unit: string) => {
    setPortionUnit(unit);
    setEditingUnit(false);
  };

  return (
    <div className="space-y-3">
      {!selected ? (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search for a food..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
              className="pl-10 rounded-xl"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {suggestions.length > 0 && (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {suggestions.map((food, i) => {
                const amt = food.default_portion_amount || food.default_portion_g || 100;
                const unit = food.default_portion_unit || "g";
                const factor = unitToGrams[unit] || 1;
                const gramsEq = amt * factor;
                return (
                  <button
                    key={i}
                    onClick={() => selectFood(food)}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div>
                      <span className="text-sm font-medium text-foreground">{food.name}</span>
                      <span className="block text-xs text-muted-foreground">{food.portion_label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {Math.round((food.calories * gramsEq) / 100)} kcal
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && query.length >= 2 && suggestions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
          )}
        </>
      ) : (
        <>
          <div className="text-center">
            <h3 className="text-base font-semibold text-foreground">{selected.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{selected.portion_label}</p>
          </div>

          {/* Portion adjuster */}
          <div className="flex items-center justify-center gap-4 py-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => adjustPortion(-getStep())}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="flex items-baseline gap-1 min-w-[100px] justify-center">
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
              {editingUnit ? (
                <div className="absolute mt-8 bg-card border border-border rounded-xl shadow-lg z-10 py-1 max-h-48 overflow-y-auto">
                  {UNITS.map((u) => (
                    <button
                      key={u}
                      onClick={() => selectUnit(u)}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                        u === portionUnit ? "bg-secondary text-foreground font-semibold" : "text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              ) : null}
              <button
                onClick={cycleUnit}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {portionUnit}
              </button>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => adjustPortion(getStep())}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Nutrition breakdown */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded-xl bg-muted/50 p-2.5">
              <p className="text-lg font-bold text-foreground">{scale(selected.calories)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">kcal</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-2.5">
              <p className="text-lg font-bold text-foreground">{scale(selected.protein)}g</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Protein</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-2.5">
              <p className="text-lg font-bold text-foreground">{scale(selected.carbs)}g</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Carbs</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-2.5">
              <p className="text-lg font-bold text-foreground">{scale(selected.fat)}g</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Fat</p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1 rounded-xl h-11"
              onClick={() => { setSelected(null); setQuery(""); setEditingUnit(false); setEditingAmount(false); }}
            >
              Back
            </Button>
            <Button className="flex-1 rounded-xl h-11" onClick={handleConfirm}>
              Add
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

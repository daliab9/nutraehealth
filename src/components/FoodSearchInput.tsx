import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollPicker } from "@/components/ScrollPicker";
import { supabase } from "@/integrations/supabase/client";
import type { FoodItem } from "@/stores/useUserStore";

interface FoodSuggestion {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  iron?: number;
  vitamin_d?: number;
  magnesium?: number;
  omega3?: number;
  b12?: number;
  default_portion_amount: number;
  default_portion_unit: string;
  default_portion_g?: number;
  available_units?: string[];
  portion_label: string;
}

// Store per-food gram weight for "whole" unit
const wholeGramsMap = new Map<string, number>();

const UNITS = ["g", "ml", "mg", "oz", "cup", "tbsp", "tsp", "serving", "piece", "slice"];

const unitToGrams: Record<string, number> = {
  g: 1, ml: 1, mg: 0.001, oz: 28.35, cup: 240, tbsp: 15, tsp: 5, serving: 100, piece: 100, slice: 30, whole: 100,
};

const getAmountOptions = (unit: string): number[] => {
  if (unit === "whole") {
    return [0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20];
  }
  if (unit === "g" || unit === "ml" || unit === "mg") {
    return [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100, 125, 150, 175, 200, 250, 300, 350, 400, 450, 500, 600, 700, 750, 800, 900, 1000];
  }
  return [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10, 12, 15, 20];
};

interface FoodSearchInputProps {
  onAddItem: (item: FoodItem) => void;
  onClose: () => void;
  keepOpenOnAdd?: boolean;
}

export const FoodSearchInput = ({ onAddItem, onClose, keepOpenOnAdd }: FoodSearchInputProps) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FoodSuggestion | null>(null);
  const [portionAmount, setPortionAmount] = useState(100);
  const [portionUnit, setPortionUnit] = useState("g");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  const availableUnits = useMemo(() => {
    if (selected?.available_units && selected.available_units.length > 0) {
      return selected.available_units;
    }
    return UNITS;
  }, [selected]);

  const amountOptions = useMemo(() => {
    const base = getAmountOptions(portionUnit);
    if (!base.includes(portionAmount)) {
      return [...base, portionAmount].sort((a, b) => a - b);
    }
    return base;
  }, [portionUnit, portionAmount]);

  const searchFood = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-food", { body: { query: q } });
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

  useEffect(() => { inputRef.current?.focus(); }, []);

  const selectFood = (food: FoodSuggestion) => {
    setSelected(food);
    let amount = food.default_portion_amount || food.default_portion_g || 100;
    const unit = food.default_portion_unit || "g";
    // Clamp "whole" items to a sensible default (1) if the API returned an absurd amount
    if (unit === "whole" && amount > 10) {
      amount = 1;
    }
    // Store the whole-item gram weight for this food
    if (food.default_portion_g) {
      wholeGramsMap.set(food.name, food.default_portion_g);
    }
    setPortionAmount(amount);
    setPortionUnit(unit);
    setQuery(food.name);
    setSuggestions([]);
  };

  const getGramsEquivalent = () => {
    if (portionUnit === "whole" && selected) {
      const wholeG = wholeGramsMap.get(selected.name) || selected.default_portion_g || 100;
      return portionAmount * wholeG;
    }
    const factor = unitToGrams[portionUnit] || 1;
    return portionAmount * factor;
  };

  const scale = (val: number) => Math.round((val * getGramsEquivalent()) / 100);

  const handleConfirm = () => {
    if (!selected) return;
    const wholeGrams = wholeGramsMap.get(selected.name) || selected.default_portion_g || 100;
    onAddItem({
      id: crypto.randomUUID(),
      name: selected.name,
      calories: scale(selected.calories),
      protein: scale(selected.protein),
      carbs: scale(selected.carbs),
      fat: scale(selected.fat),
      fiber: selected.fiber != null ? Math.round(scale(selected.fiber) * 10) / 10 : 0,
      iron: selected.iron != null ? Math.round(scale(selected.iron) * 100) / 100 : 0,
      vitamin_d: selected.vitamin_d != null ? Math.round(scale(selected.vitamin_d) * 10) / 10 : 0,
      magnesium: selected.magnesium != null ? Math.round(scale(selected.magnesium) * 10) / 10 : 0,
      omega3: selected.omega3 != null ? Math.round(scale(selected.omega3) * 100) / 100 : 0,
      b12: selected.b12 != null ? Math.round(scale(selected.b12) * 100) / 100 : 0,
      quantity: `${portionAmount}${portionUnit === "whole" ? " whole" : portionUnit}`,
      availableUnits: selected.available_units || [portionUnit],
      wholeItemGrams: wholeGrams,
    });
    if (keepOpenOnAdd) {
      setSelected(null);
      setQuery("");
    } else {
      onClose();
    }
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
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          {suggestions.length > 0 && (
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {suggestions.map((food, i) => {
                const amt = food.default_portion_amount || food.default_portion_g || 100;
                const unit = food.default_portion_unit || "g";
                const factor = unitToGrams[unit] || 1;
                const gramsEq = amt * factor;
                return (
                  <button key={i} onClick={() => selectFood(food)} className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted/50 transition-colors text-left">
                    <div>
                      <span className="text-sm font-medium text-foreground">{food.name}</span>
                      <span className="block text-xs text-muted-foreground">{food.portion_label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{Math.round((food.calories * gramsEq) / 100)} kcal</span>
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
                items={availableUnits}
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
            <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => { setSelected(null); setQuery(""); }}>
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

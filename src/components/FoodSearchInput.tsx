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
  default_portion_g: number;
  portion_label: string;
}

interface FoodSearchInputProps {
  onAddItem: (item: FoodItem) => void;
  onClose: () => void;
}

export const FoodSearchInput = ({ onAddItem, onClose }: FoodSearchInputProps) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<FoodSuggestion | null>(null);
  const [portionG, setPortionG] = useState(100);
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

  const selectFood = (food: FoodSuggestion) => {
    setSelected(food);
    setPortionG(food.default_portion_g);
    setQuery(food.name);
    setSuggestions([]);
  };

  const scale = (val: number) => Math.round((val * portionG) / 100);

  const handleConfirm = () => {
    if (!selected) return;
    onAddItem({
      id: Date.now().toString(),
      name: selected.name,
      calories: scale(selected.calories),
      protein: scale(selected.protein),
      carbs: scale(selected.carbs),
      fat: scale(selected.fat),
      quantity: `${portionG}g`,
    });
    onClose();
  };

  const adjustPortion = (delta: number) => {
    setPortionG((prev) => Math.max(10, prev + delta));
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
              {suggestions.map((food, i) => (
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
                    {Math.round((food.calories * food.default_portion_g) / 100)} kcal
                  </span>
                </button>
              ))}
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
              onClick={() => adjustPortion(-10)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="text-center min-w-[80px]">
              <span className="text-2xl font-bold text-foreground">{portionG}</span>
              <span className="text-sm text-muted-foreground ml-1">g</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => adjustPortion(10)}
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
              onClick={() => { setSelected(null); setQuery(""); }}
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

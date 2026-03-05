import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AIScanDialog } from "@/components/AIScanDialog";
import type { FoodItem } from "@/stores/useUserStore";

interface MealSectionProps {
  title: string;
  emoji: string;
  items: FoodItem[];
  onAddItem: (item: FoodItem) => void;
  onAddItems?: (items: FoodItem[]) => void;
  pastItems?: FoodItem[];
}

type AddMode = null | "choose" | "manual" | "scan";

export const MealSection = ({ title, emoji, items, onAddItem, onAddItems, pastItems = [] }: MealSectionProps) => {
  const [mode, setMode] = useState<AddMode>(null);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const totalCals = items.reduce((sum, i) => sum + i.calories, 0);

  // Deduplicate past items by name, most recent first
  const uniquePast = pastItems.reduce<FoodItem[]>((acc, item) => {
    if (!acc.find((a) => a.name.toLowerCase() === item.name.toLowerCase())) {
      acc.push(item);
    }
    return acc;
  }, []).slice(0, 5);

  const handleAdd = () => {
    if (!name || !calories) return;
    onAddItem({
      id: Date.now().toString(),
      name,
      calories: Number(calories),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
    });
    resetForm();
  };

  const handleAddPastItem = (item: FoodItem) => {
    onAddItem({ ...item, id: Date.now().toString() });
    setMode(null);
  };

  const resetForm = () => {
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setMode(null);
  };

  return (
    <div className="flex flex-col">
      {/* Header row */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{emoji}</span>
          <span className="text-sm font-medium text-foreground">{title}</span>
          {totalCals > 0 && (
            <span className="text-xs text-muted-foreground">{totalCals} kcal</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => setMode("choose")}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Listed items */}
      {items.length > 0 && (
        <div className="space-y-1 pl-7 pb-1">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-1">
              <span className="text-sm text-foreground">{item.name}</span>
              <span className="text-xs text-muted-foreground">{item.calories} kcal</span>
            </div>
          ))}
        </div>
      )}

      {/* Choose dialog: Scan / Manual / Past items */}
      <Dialog open={mode === "choose"} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Add to {title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Button
              variant="outline"
              className="w-full rounded-xl h-12 justify-start gap-3"
              onClick={() => setMode("scan")}
            >
              📷 Scan with AI
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl h-12 justify-start gap-3"
              onClick={() => setMode("manual")}
            >
              ✏️ Add manually
            </Button>

            {uniquePast.length > 0 && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Recent items</p>
                <div className="space-y-1">
                  {uniquePast.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleAddPastItem(item)}
                      className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                    >
                      <span className="text-sm text-foreground">{item.name}</span>
                      <span className="text-xs text-muted-foreground">{item.calories} kcal</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual add dialog */}
      <Dialog open={mode === "manual"} onOpenChange={(o) => !o && resetForm()}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Add to {title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input placeholder="Food name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
            <Input placeholder="Calories (kcal)" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} className="rounded-xl" />
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Protein (g)" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} className="rounded-xl" />
              <Input placeholder="Carbs (g)" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} className="rounded-xl" />
              <Input placeholder="Fat (g)" type="number" value={fat} onChange={(e) => setFat(e.target.value)} className="rounded-xl" />
            </div>
            <Button onClick={handleAdd} className="w-full rounded-xl h-12" disabled={!name || !calories}>
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Scan dialog */}
      <AIScanDialog
        open={mode === "scan"}
        onOpenChange={(o) => !o && setMode(null)}
        mealTitle={title}
        onAddItems={(scannedItems) => {
          if (onAddItems) {
            onAddItems(scannedItems);
          } else {
            scannedItems.forEach((item) => onAddItem(item));
          }
          setMode(null);
        }}
      />
    </div>
  );
};

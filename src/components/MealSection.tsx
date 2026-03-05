import { useState } from "react";
import { Plus, Camera, Barcode, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { FoodItem } from "@/stores/useUserStore";

interface MealSectionProps {
  title: string;
  emoji: string;
  items: FoodItem[];
  onAddItem: (item: FoodItem) => void;
}

export const MealSection = ({ title, emoji, items, onAddItem }: MealSectionProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const totalCals = items.reduce((sum, i) => sum + i.calories, 0);

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
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setOpen(false);
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <h3 className="font-semibold text-foreground">{title}</h3>
          {totalCals > 0 && (
            <span className="text-sm text-muted-foreground">{totalCals} kcal</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-1.5 px-2 rounded-xl"
            >
              <span className="text-sm text-foreground">{item.name}</span>
              <span className="text-sm text-muted-foreground">{item.calories} kcal</span>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div className="flex items-center gap-3 py-2">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add food
          </button>
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Camera className="h-3.5 w-3.5" />
            Photo
          </button>
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Barcode className="h-3.5 w-3.5" />
            Scan
          </button>
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Mic className="h-3.5 w-3.5" />
            Voice
          </button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add to {title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input
              placeholder="Food name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
            />
            <Input
              placeholder="Calories (kcal)"
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="rounded-xl"
            />
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Protein (g)"
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="rounded-xl"
              />
              <Input
                placeholder="Carbs (g)"
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="rounded-xl"
              />
              <Input
                placeholder="Fat (g)"
                type="number"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <Button
              onClick={handleAdd}
              className="w-full rounded-xl h-12"
              disabled={!name || !calories}
            >
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

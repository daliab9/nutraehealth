import { useState } from "react";
import { Plus, X, Pencil, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AIScanDialog } from "@/components/AIScanDialog";
import { FoodSearchInput } from "@/components/FoodSearchInput";
import { FoodEditInput } from "@/components/FoodEditInput";
import type { FoodItem } from "@/stores/useUserStore";

interface MealSectionProps {
  title: string;
  icon: LucideIcon;
  items: FoodItem[];
  onAddItem: (item: FoodItem) => void;
  onRemoveItem?: (itemId: string) => void;
  onUpdateItem?: (item: FoodItem) => void;
  onAddItems?: (items: FoodItem[]) => void;
  pastItems?: FoodItem[];
}

type AddMode = null | "choose" | "search" | "scan";

export const MealSection = ({ title, icon: Icon, items, onAddItem, onRemoveItem, onUpdateItem, onAddItems, pastItems = [] }: MealSectionProps) => {
  const [mode, setMode] = useState<AddMode>(null);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);

  const totalCals = items.reduce((sum, i) => sum + i.calories, 0);

  const uniquePast = pastItems.reduce<FoodItem[]>((acc, item) => {
    if (!acc.find((a) => a.name.toLowerCase() === item.name.toLowerCase())) {
      acc.push(item);
    }
    return acc;
  }, []).slice(0, 5);

  const handleAddPastItem = (item: FoodItem) => {
    onAddItem({ ...item, id: Date.now().toString() });
    setMode(null);
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-foreground" />
          <span className="text-sm font-medium text-foreground">{title}</span>
          {totalCals > 0 && (
            <span className="text-xs text-muted-foreground">{totalCals} kcal</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-action-button hover:bg-action-button/80"
          onClick={() => setMode("choose")}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-6 pb-2">
          {items.map((item) => (
            <div key={item.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border">
              <span className="text-xs font-medium text-foreground">{item.name}</span>
              {item.quantity && (
                <span className="text-[10px] text-muted-foreground">({item.quantity})</span>
              )}
              <span className="text-[10px] text-muted-foreground">{item.calories} kcal</span>
              {onUpdateItem && (
                <button
                  onClick={() => setEditingItem(item)}
                  className="h-4 w-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="h-2.5 w-2.5" />
                </button>
              )}
              {onRemoveItem && (
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="h-4 w-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit food item dialog */}
      <Dialog open={!!editingItem} onOpenChange={(o) => !o && setEditingItem(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit {editingItem?.name}</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <FoodEditInput
              item={editingItem}
              onSave={(updated) => {
                onUpdateItem?.(updated);
                setEditingItem(null);
              }}
              onCancel={() => setEditingItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Choose dialog */}
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
              Scan with AI
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl h-12 justify-start gap-3"
              onClick={() => setMode("search")}
            >
              Search food
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

      {/* Search food dialog */}
      <Dialog open={mode === "search"} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Add to {title}</DialogTitle>
          </DialogHeader>
          <FoodSearchInput
            onAddItem={(item) => { onAddItem(item); setMode(null); }}
            onClose={() => setMode(null)}
          />
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

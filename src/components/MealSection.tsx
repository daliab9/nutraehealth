import { useState, useMemo } from "react";
import { Plus, X, Pencil, ChevronDown, ChevronRight, Heart, Bookmark, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AIScanDialog } from "@/components/AIScanDialog";
import { FoodSearchInput } from "@/components/FoodSearchInput";
import { FoodEditInput } from "@/components/FoodEditInput";
import type { FoodItem, SavedMeal } from "@/stores/useUserStore";
import { toast } from "sonner";

interface MealSectionProps {
  title: string;
  icon: LucideIcon;
  items: FoodItem[];
  onAddItem: (item: FoodItem) => void;
  onRemoveItem?: (itemId: string) => void;
  onUpdateItem?: (item: FoodItem) => void;
  onAddItems?: (items: FoodItem[]) => void;
  pastItems?: FoodItem[];
  savedMeals?: SavedMeal[];
  onSaveMeal?: (meal: SavedMeal) => void;
  onUnsaveMeal?: (mealName: string) => void;
}

type AddMode = null | "choose" | "search" | "scan" | "create-meal-name" | "create-meal-add";

export const MealSection = ({
  title,
  icon: Icon,
  items,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onAddItems,
  pastItems = [],
  savedMeals = [],
  onSaveMeal,
  onUnsaveMeal
}: MealSectionProps) => {
  const [mode, setMode] = useState<AddMode>(null);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [creatingMealName, setCreatingMealName] = useState("");
  const [creatingMealItems, setCreatingMealItems] = useState<FoodItem[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [addToMealItem, setAddToMealItem] = useState<FoodItem | null>(null);
  const [newMealName, setNewMealName] = useState("");

  const totalCals = items.reduce((sum, i) => sum + i.calories, 0);

  const { grouped, ungrouped } = useMemo(() => {
    const map = new Map<string, {name: string;items: FoodItem[];}>();
    const ung: FoodItem[] = [];
    items.forEach((item) => {
      if (item.groupId) {
        if (!map.has(item.groupId)) map.set(item.groupId, { name: item.groupName || "Meal", items: [] });
        map.get(item.groupId)!.items.push(item);
      } else {
        ung.push(item);
      }
    });
    return { grouped: Array.from(map.entries()), ungrouped: ung };
  }, [items]);

  const uniquePast = pastItems.
  reduce<FoodItem[]>((acc, item) => {
    if (!acc.find((a) => a.name.toLowerCase() === item.name.toLowerCase())) acc.push(item);
    return acc;
  }, []).
  slice(0, 5);

  const handleAddPastItem = (item: FoodItem) => {
    onAddItem({ ...item, id: Date.now().toString() });
    setMode(null);
  };

  const handleAddSavedMeal = (meal: SavedMeal) => {
    const groupId = Date.now().toString();
    const mealItems = meal.items.map((item) => ({
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      groupId,
      groupName: meal.name
    }));
    if (onAddItems) onAddItems(mealItems);else
    mealItems.forEach((i) => onAddItem(i));
    setMode(null);
  };

  const handleStartCreateMeal = () => {
    setCreatingMealName("");
    setCreatingMealItems([]);
    setMode("create-meal-name");
  };

  const handleFinishCreatingMeal = () => {
    if (creatingMealItems.length === 0) {
      setMode(null);
      return;
    }
    const groupId = Date.now().toString();
    const mealItems = creatingMealItems.map((item) => ({
      ...item,
      groupId,
      groupName: creatingMealName
    }));
    if (onAddItems) onAddItems(mealItems);else
    mealItems.forEach((i) => onAddItem(i));
    setMode(null);
  };

  const isMealSaved = (name: string) => {
    return savedMeals.some((m) => m.name.toLowerCase() === name.toLowerCase());
  };

  const handleToggleSaveGroup = (groupId: string, name: string, groupItems: FoodItem[]) => {
    if (isMealSaved(name)) {
      onUnsaveMeal?.(name);
      toast.success(`"${name}" removed from saved meals`);
    } else {
      onSaveMeal?.({
        id: Date.now().toString(),
        name,
        items: groupItems.map(({ groupId: _, groupName: __, ...rest }) => rest)
      });
      toast.success(`"${name}" saved to your meals`);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);else
      next.add(groupId);
      return next;
    });
  };

  const creatingMealCals = creatingMealItems.reduce((s, i) => s + i.calories, 0);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-foreground" />
          <span className="text-sm text-foreground font-bold">{title}</span>
          {totalCals > 0 && <span className="text-xs text-muted-foreground font-extrabold">{totalCals} kcal</span>}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-action-button hover:bg-action-button/80" onClick={() => setMode("choose")}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Display items */}
      {(grouped.length > 0 || ungrouped.length > 0) &&
      <div className="pl-6 pb-2 space-y-2">
          {/* Grouped meals */}
          {grouped.map(([groupId, group]) => {
          const isExpanded = expandedGroups.has(groupId);
          const groupCals = group.items.reduce((s, i) => s + i.calories, 0);
          return (
            <div key={groupId} className="rounded-xl border border-border bg-[#e4e7c6] overflow-hidden">
                <button onClick={() => toggleGroup(groupId)} className="w-full flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-foreground" />}
                    <span className="font-semibold text-foreground text-sm text-left">{group.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs font-bold">{groupCals} kcal</span>
                    {(onSaveMeal || onUnsaveMeal) &&
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSaveGroup(groupId, group.name, group.items);
                    }}
                    className="h-8 w-8 flex items-center justify-center text-foreground rounded-full active:scale-95 transition-transform">
                        <Heart className={`h-5 w-5 ${isMealSaved(group.name) ? "fill-foreground" : ""}`} />
                      </button>
                  }
                    {onRemoveItem &&
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      group.items.forEach((i) => onRemoveItem(i.id));
                    }}
                    className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-destructive rounded-full active:scale-95 transition-transform">
                        <X className="h-5 w-5" />
                      </button>
                  }
                  </div>
                </button>
                {isExpanded &&
              <div className="px-3 pb-2 space-y-1 border-t border-border/50">
                    {group.items.map((item) =>
                <div key={item.id} className="flex items-center justify-between py-1.5 pl-5 text-sm">
                        <div className="flex flex-col min-w-0 flex-1 mr-2">
                          <span className="text-foreground break-words">{item.name}</span>
                          {item.quantity && <span className="text-[10px] text-muted-foreground">{item.quantity}</span>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-muted-foreground text-xs">{item.calories} kcal</span>
                          {onUpdateItem &&
                    <button onClick={() => setEditingItem(item)} className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full active:scale-95 transition-transform">
                              <Pencil className="h-4 w-4" />
                            </button>
                    }
                          {onRemoveItem &&
                    <button onClick={() => onRemoveItem(item.id)} className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-destructive rounded-full active:scale-95 transition-transform">
                              <X className="h-4 w-4" />
                            </button>
                    }
                        </div>
                      </div>
                )}
                  </div>
              }
              </div>);

        })}

          {/* Ungrouped items */}
          <div className="space-y-1.5">
            {ungrouped.map((item) =>
          <div key={item.id} className="flex items-center justify-between px-3 py-2 rounded-xl border border-border bg-[#e4e7c6]">
                <div className="flex flex-col min-w-0 flex-1 mr-2">
                  <span className="font-medium text-foreground text-sm break-words">{item.name}</span>
                  {item.quantity && <span className="text-[10px] text-muted-foreground">{item.quantity}</span>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-muted-foreground text-xs font-bold">{item.calories} kcal</span>
                  {onUpdateItem &&
              <button onClick={() => setEditingItem(item)} className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95">
                      <Pencil className="h-4 w-4" />
                    </button>
              }
                  <button onClick={() => setAddToMealItem(item)} className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95">
                    <Bookmark className="h-4 w-4" />
                  </button>
                  {onRemoveItem &&
              <button onClick={() => onRemoveItem(item.id)} className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors active:scale-95">
                      <X className="h-4 w-4" />
                    </button>
              }
                </div>
              </div>
          )}
          </div>
      }

      {/* Edit food item dialog */}
      <Dialog open={!!editingItem} onOpenChange={(o) => !o && setEditingItem(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit {editingItem?.name}</DialogTitle>
          </DialogHeader>
          {editingItem &&
          <FoodEditInput
            item={editingItem}
            onSave={(updated) => {
              onUpdateItem?.(updated);
              setEditingItem(null);
            }}
            onCancel={() => setEditingItem(null)} />

          }
        </DialogContent>
      </Dialog>

      {/* Choose dialog */}
      <Dialog open={mode === "choose"} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Add to {title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Button variant="outline" className="w-full rounded-xl h-12 justify-start gap-3" onClick={() => setMode("scan")}>
              Scan with AI
            </Button>
            <Button variant="outline" className="w-full rounded-xl h-12 justify-start gap-3" onClick={() => setMode("search")}>
              Search food
            </Button>
            <Button variant="outline" className="w-full rounded-xl h-12 justify-start gap-3" onClick={handleStartCreateMeal}>
              Create a meal
            </Button>

            {savedMeals.length > 0 &&
            <div className="pt-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Saved meals</p>
                <div className="space-y-1">
                  {savedMeals.map((meal) =>
                <button
                  key={meal.id}
                  onClick={() => handleAddSavedMeal(meal)}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted/50 transition-colors text-left">
                  
                      <span className="text-sm text-foreground font-medium">{meal.name}</span>
                      <span className="text-xs text-muted-foreground">{meal.items.length} items</span>
                    </button>
                )}
                </div>
              </div>
            }

            {uniquePast.length > 0 &&
            <div className="pt-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Recent items</p>
                <div className="space-y-1">
                  {uniquePast.map((item, i) =>
                <button
                  key={i}
                  onClick={() => handleAddPastItem(item)}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted/50 transition-colors text-left">
                  
                      <span className="text-sm text-foreground">{item.name}</span>
                      <span className="text-xs text-muted-foreground">{item.calories} kcal</span>
                    </button>
                )}
                </div>
              </div>
            }
          </div>
        </DialogContent>
      </Dialog>

      {/* Create meal name dialog */}
      <Dialog open={mode === "create-meal-name"} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Name your meal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input
              placeholder="e.g. Greek Yogurt Bowl"
              value={creatingMealName}
              onChange={(e) => setCreatingMealName(e.target.value)}
              className="rounded-xl"
              autoFocus />
            
            <Button
              onClick={() => {
                if (creatingMealName.trim()) setMode("create-meal-add");
              }}
              className="w-full rounded-xl h-12"
              disabled={!creatingMealName.trim()}>
              
              Next — Add ingredients
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create meal - add items dialog */}
      <Dialog open={mode === "create-meal-add"} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent className="rounded-2xl max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{creatingMealName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {creatingMealItems.length > 0 &&
            <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {creatingMealItems.length} items · {creatingMealCals} kcal
                </p>
                {creatingMealItems.map((item, i) =>
              <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-secondary/50">
                    <span className="text-sm text-foreground">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{item.calories} kcal</span>
                      <button onClick={() => setCreatingMealItems((prev) => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
              )}
              </div>
            }

            <FoodSearchInput
              onAddItem={(item) => {
                setCreatingMealItems((prev) => [...prev, item]);
              }}
              onClose={() => {}}
              keepOpenOnAdd />
            

            <Button onClick={handleFinishCreatingMeal} className="w-full rounded-xl h-12" disabled={creatingMealItems.length === 0}>
              Done — Add {creatingMealItems.length} items
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search food dialog */}
      <Dialog open={mode === "search"} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Add to {title}</DialogTitle>
          </DialogHeader>
          <FoodSearchInput onAddItem={(item) => {onAddItem(item);setMode(null);}} onClose={() => setMode(null)} />
        </DialogContent>
      </Dialog>

      {/* AI Scan dialog */}
      <AIScanDialog
        open={mode === "scan"}
        onOpenChange={(o) => !o && setMode(null)}
        mealTitle={title}
        onAddItems={(scannedItems) => {
          if (onAddItems) onAddItems(scannedItems);else
          scannedItems.forEach((item) => onAddItem(item));
          setMode(null);
        }} />
      
      {/* Add to meal dialog */}
      <Dialog open={!!addToMealItem} onOpenChange={(o) => !o && setAddToMealItem(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Add "{addToMealItem?.name}" to a meal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {grouped.length > 0 &&
            <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Existing meals</p>
                {grouped.map(([groupId, group]) =>
              <button
                key={groupId}
                onClick={() => {
                  if (addToMealItem && onUpdateItem) {
                    onUpdateItem({ ...addToMealItem, groupId, groupName: group.name });
                    setAddToMealItem(null);
                  }
                }}
                className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted/50 transition-colors text-left">
                
                    <span className="text-sm text-foreground font-medium">{group.name}</span>
                    <span className="text-xs text-muted-foreground">{group.items.length} items</span>
                  </button>
              )}
              </div>
            }
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Create new meal</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Meal name"
                  value={newMealName}
                  onChange={(e) => setNewMealName(e.target.value)}
                  className="rounded-xl flex-1" />
                
                <Button
                  onClick={() => {
                    if (addToMealItem && newMealName.trim() && onUpdateItem) {
                      const gid = Date.now().toString();
                      onUpdateItem({ ...addToMealItem, groupId: gid, groupName: newMealName.trim() });
                      setAddToMealItem(null);
                      setNewMealName("");
                    }
                  }}
                  className="rounded-xl"
                  disabled={!newMealName.trim()}>
                  
                  Add
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

};
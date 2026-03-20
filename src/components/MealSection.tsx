import { useState, useMemo } from "react";
import { Plus, X, Pencil, ChevronDown, ChevronRight, Heart, Star, ArrowLeft, Copy, type LucideIcon } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AIScanDialog } from "@/components/AIScanDialog";
import { FoodSearchInput } from "@/components/FoodSearchInput";
import { FoodEditInput } from "@/components/FoodEditInput";
import { DraggableFoodItem } from "@/components/DraggableFoodItem";
import { SaveMealModal } from "@/components/SaveMealModal";
import { RemoveDefaultMealDialog } from "@/components/RemoveDefaultMealDialog";
import { QuickMultiplierPopover } from "@/components/QuickMultiplierPopover";
import type { FoodItem, SavedMeal, DefaultMeal, DefaultMealFrequency, MealEntry } from "@/stores/useUserStore";
import { toast } from "sonner";

interface MealSectionProps {
  title: string;
  icon: LucideIcon;
  items: FoodItem[];
  mealType: string;
  onAddItem: (item: FoodItem) => void;
  onRemoveItem?: (itemId: string) => void;
  onUpdateItem?: (item: FoodItem) => void;
  onAddItems?: (items: FoodItem[]) => void;
  pastItems?: FoodItem[];
  savedMeals?: SavedMeal[];
  defaultMeals?: DefaultMeal[];
  onSaveMeal?: (meal: SavedMeal) => void;
  onUnsaveMeal?: (mealName: string) => void;
  onAddToSavedMeal?: (mealId: string, item: FoodItem) => void;
  onAddToGroup?: (groupId: string, groupName: string, item: FoodItem) => void;
  onRemoveFromGroup?: (itemId: string) => void;
  onSaveAsDefault?: (name: string, items: FoodItem[], mealType: MealEntry["type"], frequency: DefaultMealFrequency, specificDays?: number[]) => void;
  onRemoveDefaultToday?: (defaultMealId: string) => void;
  onRemoveDefaultPermanently?: (defaultMealId: string) => void;
  defaultMealGroupIds?: Set<string>;
  defaultMealIdMap?: Map<string, string>;
}

type AddMode = null | "choose" | "search" | "scan" | "create-meal-name" | "create-meal-add";

// Droppable wrapper for group headers
const DroppableGroupHeader = ({ groupId, mealType, children }: { groupId: string; mealType: string; children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `group-${mealType}-${groupId}`,
    data: { type: "meal-group", mealType, groupId },
  });
  return (
    <div ref={setNodeRef} className={`transition-colors ${isOver ? "ring-2 ring-primary/50 rounded-xl" : ""}`}>
      {children}
    </div>
  );
};

export const MealSection = ({
  title,
  icon: Icon,
  items,
  mealType,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onAddItems,
  pastItems = [],
  savedMeals = [],
  defaultMeals = [],
  onSaveMeal,
  onUnsaveMeal,
  onAddToSavedMeal,
  onAddToGroup,
  onRemoveFromGroup,
  onSaveAsDefault,
  onRemoveDefaultToday,
  onRemoveDefaultPermanently,
  defaultMealGroupIds = new Set(),
  defaultMealIdMap = new Map(),
}: MealSectionProps) => {
  const [mode, setMode] = useState<AddMode>(null);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [creatingMealName, setCreatingMealName] = useState("");
  const [creatingMealItems, setCreatingMealItems] = useState<FoodItem[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [addToMealItem, setAddToMealItem] = useState<FoodItem | null>(null);
  const [newMealName, setNewMealName] = useState("");
  const [longPressItem, setLongPressItem] = useState<FoodItem | null>(null);
  const [newSavedMealName, setNewSavedMealName] = useState("");
  const [addToGroupId, setAddToGroupId] = useState<{ groupId: string; groupName: string } | null>(null);
  const [saveMealModalOpen, setSaveMealModalOpen] = useState(false);
  const [saveMealModalItems, setSaveMealModalItems] = useState<FoodItem[]>([]);
  const [saveMealModalName, setSaveMealModalName] = useState("");
  const [removeDefaultDialog, setRemoveDefaultDialog] = useState<{ groupId: string; name: string } | null>(null);

  // Droppable zone for the entire meal section (for moving items between sections)
  const { setNodeRef: setDropZoneRef, isOver: isOverZone } = useDroppable({
    id: `meal-zone-${mealType}`,
    data: { type: "meal-section", mealType },
  });

  const totalCals = items.reduce((sum, i) => sum + i.calories, 0);

  const { grouped, ungrouped } = useMemo(() => {
    const map = new Map<string, { name: string; items: FoodItem[] }>();
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

  const uniquePast = pastItems
    .reduce<FoodItem[]>((acc, item) => {
      if (!acc.find((a) => a.name.toLowerCase() === item.name.toLowerCase())) acc.push(item);
      return acc;
    }, [])
    .slice(0, 5);

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
      groupName: meal.name,
    }));
    if (onAddItems) onAddItems(mealItems);
    else mealItems.forEach((i) => onAddItem(i));
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
      groupName: creatingMealName,
    }));
    if (onAddItems) onAddItems(mealItems);
    else mealItems.forEach((i) => onAddItem(i));
    setMode(null);
  };

  const isItemSavedOrDefault = (name: string) => {
    const savedMatch = savedMeals.some((m) => m.name.toLowerCase() === name.toLowerCase());
    const defaultMatch = defaultMeals.some((m) => m.name.toLowerCase() === name.toLowerCase());
    return savedMatch || defaultMatch;
  };

  const isMealSaved = (name: string) => {
    return savedMeals.some((m) => m.name.toLowerCase() === name.toLowerCase());
  };

  const isGroupSavedOrDefault = (name: string, groupId: string) => {
    return isMealSaved(name) || defaultMealGroupIds.has(groupId);
  };

  const handleDuplicateItem = (item: FoodItem, multiplier: number) => {
    const newItem: FoodItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      calories: Math.round(item.calories * multiplier * 10) / 10,
      protein: Math.round(item.protein * multiplier * 10) / 10,
      carbs: Math.round(item.carbs * multiplier * 10) / 10,
      fat: Math.round(item.fat * multiplier * 10) / 10,
      fiber: item.fiber ? Math.round(item.fiber * multiplier * 10) / 10 : undefined,
      iron: item.iron ? Math.round(item.iron * multiplier * 10) / 10 : undefined,
      vitamin_d: item.vitamin_d ? Math.round(item.vitamin_d * multiplier * 10) / 10 : undefined,
      magnesium: item.magnesium ? Math.round(item.magnesium * multiplier * 10) / 10 : undefined,
      omega3: item.omega3 ? Math.round(item.omega3 * multiplier * 10) / 10 : undefined,
      b12: item.b12 ? Math.round(item.b12 * multiplier * 10) / 10 : undefined,
      quantity: item.quantity ? `${multiplier}× ${item.quantity}` : `${multiplier}×`,
    };
    onAddItem(newItem);
    toast.success(`Added ${multiplier}× ${item.name}`);
  };

  const handleToggleSaveGroup = (groupId: string, name: string, groupItems: FoodItem[]) => {
    if (isMealSaved(name)) {
      onUnsaveMeal?.(name);
      toast.success(`"${name}" removed from saved meals`);
    } else {
      onSaveMeal?.({
        id: Date.now().toString(),
        name,
        items: groupItems.map(({ groupId: _, groupName: __, ...rest }) => rest),
      });
      toast.success(`"${name}" saved to your meals`);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const handleLongPressAddToSaved = (meal: SavedMeal) => {
    if (longPressItem && onAddToSavedMeal) {
      onAddToSavedMeal(meal.id, longPressItem);
      setLongPressItem(null);
      toast.success(`Added to "${meal.name}"`);
    }
  };

  const handleLongPressCreateSaved = () => {
    if (longPressItem && newSavedMealName.trim() && onSaveMeal) {
      onSaveMeal({
        id: Date.now().toString(),
        name: newSavedMealName.trim(),
        items: [{ ...longPressItem, groupId: undefined, groupName: undefined }],
      });
      setLongPressItem(null);
      setNewSavedMealName("");
      toast.success(`Created saved meal "${newSavedMealName.trim()}"`);
    }
  };

  const handleAddItemToGroup = (item: FoodItem) => {
    if (!addToGroupId || !onAddToGroup) return;
    onAddToGroup(addToGroupId.groupId, addToGroupId.groupName, item);
  };

  const creatingMealCals = creatingMealItems.reduce((s, i) => s + i.calories, 0);

  return (
    <div
      ref={setDropZoneRef}
      className={`flex flex-col transition-colors ${isOverZone ? "bg-primary/5 rounded-xl" : ""}`}
    >
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
      {(grouped.length > 0 || ungrouped.length > 0) && (
        <div className="pl-6 pb-2 space-y-2">
          {/* Grouped meals */}
          {grouped.map(([groupId, group]) => {
            const isExpanded = expandedGroups.has(groupId);
            const groupCals = group.items.reduce((s, i) => s + i.calories, 0);
            return (
              <DroppableGroupHeader key={groupId} groupId={groupId} mealType={mealType}>
                <div className="rounded-xl border border-border bg-[#e4e7c6] overflow-hidden">
                  <button onClick={() => toggleGroup(groupId)} className="w-full flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-foreground" />}
                      <span className="font-semibold text-foreground text-sm text-left">{group.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground text-xs font-bold">{groupCals} kcal</span>
                      {onAddToGroup && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddToGroupId({ groupId, groupName: group.name });
                          }}
                          className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full active:scale-95 transition-transform"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                      {(onSaveMeal || onSaveAsDefault) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSaveMealModalItems(group.items.map(({ groupId: _, groupName: __, ...rest }) => rest));
                            setSaveMealModalName(group.name);
                            setSaveMealModalOpen(true);
                          }}
                          className="h-7 w-7 flex items-center justify-center text-foreground rounded-full active:scale-95 transition-transform"
                        >
                          <Star className={`h-4 w-4 ${isGroupSavedOrDefault(group.name, groupId) ? "fill-foreground" : ""}`} />
                        </button>
                      )}
                      {onRemoveItem && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (defaultMealGroupIds.has(groupId)) {
                              setRemoveDefaultDialog({ groupId, name: group.name });
                            } else {
                              group.items.forEach((i) => onRemoveItem(i.id));
                            }
                          }}
                          className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-destructive rounded-full active:scale-95 transition-transform"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-2 space-y-1 border-t border-border/50">
                      {group.items.map((item) => (
                        <DraggableFoodItem
                          key={item.id}
                          id={item.id}
                          mealType={mealType}
                          item={item}
                          onLongPress={() => setLongPressItem(item)}
                          className="py-1.5 pl-3 text-sm"
                        >
                          <div className="flex flex-col min-w-0 flex-1 mr-2">
                            <span className="text-foreground break-words">{item.name}</span>
                            {item.quantity && <span className="text-[10px] text-muted-foreground">{item.quantity}</span>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-muted-foreground text-xs">{item.calories} kcal</span>
                            {onUpdateItem && (
                              <button onClick={() => setEditingItem(item)} className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full active:scale-95 transition-transform">
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {onRemoveFromGroup && (
                              <button
                                onClick={() => onRemoveFromGroup(item.id)}
                                className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-full active:scale-95 transition-transform"
                                title="Remove from meal"
                              >
                                <Star className="h-4 w-4 fill-foreground" />
                              </button>
                            )}
                            {onRemoveItem && (
                              <button onClick={() => onRemoveItem(item.id)} className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-destructive rounded-full active:scale-95 transition-transform">
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </DraggableFoodItem>
                      ))}
                    </div>
                  )}
                </div>
              </DroppableGroupHeader>
            );
          })}

          {/* Ungrouped items */}
          <div className="space-y-1.5">
            {ungrouped.map((item) => (
              <DraggableFoodItem
                key={item.id}
                id={item.id}
                mealType={mealType}
                item={item}
                onLongPress={() => setLongPressItem(item)}
                className="px-3 py-2 rounded-xl border border-border bg-[#e4e7c6]"
              >
                <div className="flex flex-col min-w-0 flex-1 mr-2">
                  <span className="font-medium text-foreground text-sm break-words">{item.name}</span>
                  {item.quantity && <span className="text-[10px] text-muted-foreground">{item.quantity}</span>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-muted-foreground text-xs font-bold">{item.calories} kcal</span>
                  {onUpdateItem && (
                    <button onClick={() => setEditingItem(item)} className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95">
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => {
                    setSaveMealModalItems([item]);
                    setSaveMealModalName(item.name);
                    setSaveMealModalOpen(true);
                  }} className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95">
                    <Star className="h-4 w-4" />
                  </button>
                  {onRemoveItem && (
                    <button onClick={() => onRemoveItem(item.id)} className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors active:scale-95">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </DraggableFoodItem>
            ))}
          </div>
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

      {/* Long-press dialog: add to saved meal */}
      <Dialog open={!!longPressItem} onOpenChange={(o) => { if (!o) { setLongPressItem(null); setNewSavedMealName(""); } }}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Save "{longPressItem?.name}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {savedMeals.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Add to saved meal</p>
                {savedMeals.map((meal) => (
                  <button
                    key={meal.id}
                    onClick={() => handleLongPressAddToSaved(meal)}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    <span className="text-sm text-foreground font-medium">{meal.name}</span>
                    <span className="text-xs text-muted-foreground">{meal.items.length} items</span>
                  </button>
                ))}
              </div>
            )}
            <div className={savedMeals.length > 0 ? "pt-2 border-t border-border" : ""}>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Create new saved meal</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Meal name"
                  value={newSavedMealName}
                  onChange={(e) => setNewSavedMealName(e.target.value)}
                  className="rounded-xl flex-1"
                />
                <Button onClick={handleLongPressCreateSaved} className="rounded-xl" disabled={!newSavedMealName.trim()}>
                  Create
                </Button>
              </div>
            </div>
          </div>
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

            {savedMeals.length > 0 && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Saved meals</p>
                <div className="max-h-[132px] overflow-y-auto space-y-1">
                  {savedMeals.map((meal) => (
                    <button
                      key={meal.id}
                      onClick={() => handleAddSavedMeal(meal)}
                      className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                    >
                      <span className="text-sm text-foreground font-medium">{meal.name}</span>
                      <span className="text-xs text-muted-foreground">{meal.items.length} items</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {uniquePast.length > 0 && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Recent items</p>
                <div className="max-h-[132px] overflow-y-auto space-y-1">
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
              autoFocus
            />
            <Button
              onClick={() => { if (creatingMealName.trim()) setMode("create-meal-add"); }}
              className="w-full rounded-xl h-12"
              disabled={!creatingMealName.trim()}
            >
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
            {creatingMealItems.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {creatingMealItems.length} items · {creatingMealCals} kcal
                </p>
                {creatingMealItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-secondary/50">
                    <span className="text-sm text-foreground">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{item.calories} kcal</span>
                      <button onClick={() => setCreatingMealItems((prev) => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <FoodSearchInput
              onAddItem={(item) => { setCreatingMealItems((prev) => [...prev, item]); }}
              onClose={() => {}}
              keepOpenOnAdd
            />
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
          <FoodSearchInput onAddItem={(item) => { onAddItem(item); setMode(null); }} onClose={() => setMode(null)} />
        </DialogContent>
      </Dialog>

      {/* AI Scan dialog */}
      <AIScanDialog
        open={mode === "scan"}
        onOpenChange={(o) => !o && setMode(null)}
        mealTitle={title}
        onAddItems={(scannedItems) => {
          if (onAddItems) onAddItems(scannedItems);
          else scannedItems.forEach((item) => onAddItem(item));
          setMode(null);
        }}
      />

      {/* Add to meal group dialog */}
      <Dialog open={!!addToMealItem} onOpenChange={(o) => !o && setAddToMealItem(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Add "{addToMealItem?.name}" to a meal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {grouped.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Existing meals</p>
                {grouped.map(([groupId, group]) => (
                  <button
                    key={groupId}
                    onClick={() => {
                      if (addToMealItem && onUpdateItem) {
                        onUpdateItem({ ...addToMealItem, groupId, groupName: group.name });
                        setAddToMealItem(null);
                      }
                    }}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    <span className="text-sm text-foreground font-medium">{group.name}</span>
                    <span className="text-xs text-muted-foreground">{group.items.length} items</span>
                  </button>
                ))}
              </div>
            )}
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Create new meal</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Meal name"
                  value={newMealName}
                  onChange={(e) => setNewMealName(e.target.value)}
                  className="rounded-xl flex-1"
                />
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
                  disabled={!newMealName.trim()}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add ingredient to existing group dialog */}
      <Dialog open={!!addToGroupId} onOpenChange={(o) => { if (!o) setAddToGroupId(null); }}>
        <DialogContent className="rounded-2xl max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add to {addToGroupId?.groupName}</DialogTitle>
          </DialogHeader>
          <FoodSearchInput
            onAddItem={(item) => {
              handleAddItemToGroup(item);
            }}
            onClose={() => setAddToGroupId(null)}
            keepOpenOnAdd
          />
        </DialogContent>
      </Dialog>

      {/* Save Meal Modal (Star icon) */}
      <SaveMealModal
        open={saveMealModalOpen}
        onOpenChange={setSaveMealModalOpen}
        items={saveMealModalItems}
        mealType={mealType}
        groupName={saveMealModalName}
        onSaveAsMeal={(name, mealItems) => {
          onSaveMeal?.({
            id: Date.now().toString(),
            name,
            items: mealItems.map(({ groupId: _, groupName: __, ...rest }) => rest),
          });
          toast.success(`"${name}" saved to your meals`);
        }}
        onSetAsDefault={(name, mealItems, mt, frequency, specificDays) => {
          onSaveAsDefault?.(name, mealItems, mt, frequency, specificDays);
          toast.success(`"${name}" set as default meal`);
        }}
      />

      {/* Remove Default Meal Dialog */}
      <RemoveDefaultMealDialog
        open={!!removeDefaultDialog}
        onOpenChange={(o) => { if (!o) setRemoveDefaultDialog(null); }}
        mealName={removeDefaultDialog?.name || ""}
        onRemoveToday={() => {
          if (removeDefaultDialog) {
            const dmId = defaultMealIdMap.get(removeDefaultDialog.groupId);
            if (dmId) onRemoveDefaultToday?.(dmId);
          }
        }}
        onRemovePermanently={() => {
          if (removeDefaultDialog) {
            const dmId = defaultMealIdMap.get(removeDefaultDialog.groupId);
            if (dmId) onRemoveDefaultPermanently?.(dmId);
          }
        }}
      />
    </div>
  );
};

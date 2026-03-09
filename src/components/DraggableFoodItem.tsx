import React, { useCallback } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { useLongPress } from "@/hooks/useLongPress";
import { cn } from "@/lib/utils";
import type { FoodItem } from "@/stores/useUserStore";

interface DraggableFoodItemProps {
  id: string;
  mealType: string;
  item: FoodItem;
  onLongPress: () => void;
  children: React.ReactNode;
  className?: string;
}

export const DraggableFoodItem = React.forwardRef<HTMLDivElement, DraggableFoodItemProps>(
  ({ id, mealType, item, onLongPress, children, className }, _ref) => {
    const {
      attributes,
      listeners,
      setNodeRef: setDragRef,
      isDragging,
    } = useDraggable({
      id: `drag-${mealType}-${id}`,
      data: { type: "food-item", mealType, itemId: id, item },
    });

    const { setNodeRef: setDropRef, isOver } = useDroppable({
      id: `drop-${mealType}-${id}`,
      data: { type: "food-item", mealType, itemId: id, item },
    });

    const longPressHandlers = useLongPress(onLongPress, 500);

    const combinedRef = useCallback(
      (node: HTMLElement | null) => {
        setDragRef(node);
        setDropRef(node);
      },
      [setDragRef, setDropRef]
    );

    return (
      <div
        ref={combinedRef}
        className={cn(
          "flex items-center gap-1 transition-all",
          className,
          isOver && "ring-2 ring-primary/50",
          isDragging && "opacity-40"
        )}
      >
        <div
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing p-1 flex-shrink-0 self-center"
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-between" {...longPressHandlers}>
          {children}
        </div>
      </div>
    );
  }
);

DraggableFoodItem.displayName = "DraggableFoodItem";

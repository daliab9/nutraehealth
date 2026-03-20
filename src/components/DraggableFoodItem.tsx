import React, { useCallback } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
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
        {...attributes}
        {...listeners}
        {...longPressHandlers}
        className={cn(
          "flex items-center transition-all touch-none cursor-grab active:cursor-grabbing",
          className,
          isOver && "ring-2 ring-primary/50",
          isDragging && "opacity-40"
        )}
        style={{ touchAction: "none" }}
      >
        <div className="flex-1 min-w-0 flex items-center justify-between pointer-events-auto">
          {children}
        </div>
      </div>
    );
  }
);

DraggableFoodItem.displayName = "DraggableFoodItem";

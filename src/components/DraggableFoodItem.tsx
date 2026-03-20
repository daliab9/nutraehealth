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

    const handleTouchStart = useCallback(
      (event: React.TouchEvent<HTMLDivElement>) => {
        listeners.onTouchStart?.(event);
        longPressHandlers.onTouchStart?.(event);
      },
      [listeners, longPressHandlers]
    );

    const handleTouchEnd = useCallback(
      (event: React.TouchEvent<HTMLDivElement>) => {
        listeners.onTouchEnd?.(event);
        longPressHandlers.onTouchEnd?.(event);
      },
      [listeners, longPressHandlers]
    );

    const handleTouchMove = useCallback(
      (event: React.TouchEvent<HTMLDivElement>) => {
        listeners.onTouchMove?.(event);
        longPressHandlers.onTouchMove?.(event);
      },
      [listeners, longPressHandlers]
    );

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
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        className={cn(
          "flex w-full items-center transition-all touch-none cursor-grab active:cursor-grabbing",
          className,
          isOver && "ring-2 ring-primary/50",
          isDragging && "opacity-40"
        )}
        style={{ touchAction: "none" }}
      >
        <div className="flex-1 min-w-0 flex items-center justify-between">
          {children}
        </div>
      </div>
    );
  }
);

DraggableFoodItem.displayName = "DraggableFoodItem";

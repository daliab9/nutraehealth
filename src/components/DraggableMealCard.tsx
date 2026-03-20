import { useCallback } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DraggableMealCardProps {
  dragId: string;
  dropId: string;
  dragData: Record<string, unknown>;
  dropData: Record<string, unknown>;
  children: React.ReactNode;
  className?: string;
}

export function DraggableMealCard({
  dragId,
  dropId,
  dragData,
  dropData,
  children,
  className,
}: DraggableMealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: dragId,
    data: dragData,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: dropId,
    data: dropData,
  });

  const combinedRef = useCallback(
    (node: HTMLDivElement | null) => {
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
      className={cn(
        "w-full cursor-grab touch-none transition-all active:cursor-grabbing",
        isOver && "ring-2 ring-primary/50",
        isDragging && "opacity-50",
        className
      )}
      style={{ touchAction: "none" }}
    >
      {children}
    </div>
  );
}
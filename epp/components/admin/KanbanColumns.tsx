"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";

export type ColumnDragHandle = {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
};

export function KanbanColumns({
  ids,
  onReorder,
  children,
}: {
  ids: string[];
  onReorder: (activeId: string, overId: string) => void;
  children: ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => {
        const activeId = String(event.active.id);
        const overId = event.over ? String(event.over.id) : "";
        if (!overId || activeId === overId) return;
        onReorder(activeId, overId);
      }}
    >
      <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
        <div className="kanban-board">{children}</div>
      </SortableContext>
    </DndContext>
  );
}

export function SortableStageColumn({
  id,
  children,
}: {
  id: string;
  children: (handle: ColumnDragHandle) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`kanban-column${isDragging ? " is-dragging" : ""}`}
    >
      {children({ attributes, listeners })}
    </section>
  );
}

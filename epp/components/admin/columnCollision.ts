import type { CollisionDetection } from "@dnd-kit/core";

/**
 * Stage columns are a horizontal row with very different heights.
 * closestCenter measures the middle of each full column, so a short column
 * dragged onto a tall neighbor is still "closer" to itself and the drop is ignored.
 * Compare horizontal centers only. Keyboard moves use the same hit test.
 */
export const horizontalColumnCollision: CollisionDetection = ({
  collisionRect,
  droppableRects,
  droppableContainers,
}) => {
  const x = collisionRect.left + collisionRect.width / 2;
  const collisions = [];
  for (const container of droppableContainers) {
    const rect = droppableRects.get(container.id);
    if (!rect) continue;
    const center = rect.left + rect.width / 2;
    collisions.push({
      id: container.id,
      data: { droppableContainer: container, value: Math.abs(x - center) },
    });
  }
  collisions.sort((a, b) => a.data.value - b.data.value);
  return collisions;
};

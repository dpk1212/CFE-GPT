import assert from "node:assert/strict";
import test from "node:test";
import { horizontalColumnCollision } from "./columnCollision.ts";

function rect(left: number, top: number, width: number, height: number) {
  return { left, top, width, height, right: left + width, bottom: top + height };
}

test("a short column dropped on a tall neighbor lands on that neighbor", () => {
  const containers = [{ id: "Short" }, { id: "Tall" }];
  const droppableRects = new Map([
    ["Short", rect(0, 0, 280, 300)],
    ["Tall", rect(294, 0, 280, 2400)],
  ]);
  const hits = horizontalColumnCollision({
    collisionRect: rect(320, 0, 280, 300),
    droppableRects,
    droppableContainers: containers,
  } as never);
  assert.equal(String(hits[0]?.id), "Tall");
});

test("a drag that has not crossed the midpoint stays on the original column", () => {
  const containers = [{ id: "Short" }, { id: "Tall" }];
  const droppableRects = new Map([
    ["Short", rect(0, 0, 280, 300)],
    ["Tall", rect(294, 0, 280, 2400)],
  ]);
  const hits = horizontalColumnCollision({
    collisionRect: rect(40, 0, 280, 300),
    droppableRects,
    droppableContainers: containers,
  } as never);
  assert.equal(String(hits[0]?.id), "Short");
});

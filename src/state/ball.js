import { createActions, createReducer } from "./util";
import { Vector2 } from "./lib/Vector2";
import { direction, tileType } from "./gameUtil";

const initialState = {
  hit: false,
  direction: direction.right,
  position: new Vector2(0, 0),
  quality: 1,
  distance: 3,
};

export const actors = {
  move: (__, b) => {
    if (!b.distance) return null;
    b.position = b.position.clone().add(b.direction).clampScalar(0, 19);
    b.distance -= 1;
  },
  hit: (position, b) => {
    b.position = position;
    b.distance -= 1;
    b.hit = true;
  },
  throwBall: ({ position, direction, quality }) => ({
    hit: false,
    position: position.clone().add(direction).clampScalar(0, 19),
    direction,
    quality,
    distance: [1, 2, 4, 6, 8, 10, 12][quality],
  }),
};

export const actions = createActions(actors);

export default createReducer(actors, initialState);

export const getTile = (world, { x, y }) => world?.[y]?.[x];

export const isWalkable = (tile) => tile.type === tileType.snow;

import { createActions, createReducer } from "./util";
import { Vector2 } from "./lib/Vector2";
import { clamp, direction, tileType } from "#/state/gameUtil";

const depthClamp = (v) => clamp(-5, 2, v);

const initialState = {
  direction: direction.right,
  position: new Vector2(0, 0),
  quality: 1,
  distance: 3,
};

export const actors = {
  move: (__, b) => {
    if (!b.distance) return null;
    b.position = b.position.add(b.direction);
    b.distance -= 1;
  },

  throwBall: ({ position, direction, quality }) => ({
    position: position.add(direction),
    direction,
    quality,
    distance: [1, 3, 4, 6, 8, 10, 12][quality],
  }),
};

export const actions = createActions(actors);

export default createReducer(actors, initialState);

export const getTile = (world, { x, y }) => world?.[y]?.[x];

export const isWalkable = (tile) => tile.type === tileType.snow;

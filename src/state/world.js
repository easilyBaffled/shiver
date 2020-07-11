import { createActions, createReducer } from "./util";
import { Vector2 } from "./lib/Vector2";
import { clamp, tileType } from "#/state/gameUtil";

const depthClamp = (v) => clamp(-5, 2, v);

const initialState = {
  type: tileType.snow,
  depth: 0,
};

export const actors = {
  move: ({ running, path }, world) => {
    path.forEach((v) => {
      const tile = getTile(world, v);
      if (tile) tile.depth = depthClamp(tile.depth - (running ? 2 : 1));
    });
  },
  moveLeft: (payload, p) => {
    actors.move(payload, p);
  },
  moveRight: (payload, p) => {
    actors.move(payload, p);
  },
  moveUp: (payload, p) => {
    actors.move(payload, p);
  },
  moveDown: (payload, p) => {
    actors.move(payload, p);
  },
};

export const actions = createActions(actors);

export default createReducer(actors, initialState);

export const getTile = (world, { x, y }) => world?.[y]?.[x];

export const isWalkable = (tile) => tile.type === tileType.snow;

import _ from "lodash";
import { createActions, createReducer } from "./util";
import { Vector2 } from "./lib/Vector2";
import { clamp, move, tileType } from "#/state/gameUtil";
import { isFallen } from "#/state/player";
import { original } from "immer";

const depthClamp = (v) => clamp(-5, 2, v);

const initialState = {
  type: tileType.snow,
  depth: 0,
  position: new Vector2(0, 0),
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

export const getPath = (world, start, direction, travelDistance) => {
  const pos = start.clone();
  const path = [];
  for (let i = 0; i < travelDistance; i++) {
    const tile = getTile(world, pos.add(direction));

    if (tile) {
      path.push(pos.clone());
    }

    if (tile && !isWalkable(tile)) break; // we have found our spot, the snowball can hit the obstacle
  }

  return path;
};

export const getKidPath = (world, start, direction, travelDistance) => {
  const path = getPath(world, start, direction, travelDistance);
  const lastTile = getTile(world, _.last(path));
  if (!isWalkable(lastTile)) {
    path.pop();
  }

  return path;
};

export const actions = createActions(actors);

export default createReducer(actors, initialState);

export const getTile = (world, { x, y }) => world?.[y]?.[x];

export const isWalkable = (tile) => tile.type === tileType.snow;

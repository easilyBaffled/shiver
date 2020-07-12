import _ from "lodash";
import { createActions, createReducer } from "./util";
import { playerStates, direction, clamp } from "./gameUtil";
import { Vector2 } from "./lib/Vector2";
import { FALLING_WET_ACCUMULATOR } from "./constants";
import { original } from "immer";

export const wetnessClamp = (v) => clamp(0, 10, v);
export const coldnessClamp = (v) => clamp(0, 60, v);

export const initialState = {
  status: playerStates.up,
  facing: direction.up,
  position: new Vector2(0, 0),
  wetness: 0,
  coldness: 0,
  ball: null,
};

export const actors = {
  // ( payload, immerState )
  throwBall: (__, p) => {
    p.ball = null;
  },
  scoop: (quality, p) => {
    p.ball = { quality };
  },
  fallDown: (__, p) => {
    p.status = playerStates.fallen;
    p.wetness = wetnessClamp(p.wetness + FALLING_WET_ACCUMULATOR);
  },
  move: ({ running, path, didFall }, dir, player) => {
    player.status = {
      [true]: playerStates.up,
      [running && !isFallen(player)]: playerStates.running,
      [didFall]: playerStates.fallen,
    }[true];
    if (didFall)
      player.wetness = wetnessClamp(player.wetness + FALLING_WET_ACCUMULATOR);
    player.position = (_.last(path) || player.position).clampScalar(0, 19);
    player.facing = direction[dir];
  },
  moveLeft: (payload, p) => {
    actors.move(payload, "left", p);
  },
  moveRight: (payload, p) => {
    actors.move(payload, "right", p);
  },
  moveUp: (payload, p) => {
    actors.move(payload, "up", p);
  },
  moveDown: (payload, p) => {
    actors.move(payload, "down", p);
  },
};

export const actions = createActions(actors);

export default createReducer(actors, initialState);
export const isFallen = (p) => p.status === playerStates.fallen;
export const isRunning = (p) => p.status === playerStates.running;

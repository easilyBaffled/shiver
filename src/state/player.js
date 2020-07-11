import _ from "lodash";
import { createActions, createReducer } from "./util";
import { playerStates, direction, clamp } from "./gameUtil";
import { Vector2 } from "./lib/Vector2";
import { FALLING_WET_ACCUMULATOR } from "#/state/constants";

export const wetnessClamp = (v) => clamp(0, 10, v);
export const coldnessClamp = (v) => clamp(0, 10, v);

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
  move: ({ running, path }, dir, player) => {
    if (isFallen(player)) player.status = playerStates.up;
    player.position = _.last(path) || player.position;
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
  // create: ({ tags = [], ...baseData }) =>
  //     expandTask({
  //         ...initialState,
  //         ...baseData,
  //         tags: tags
  //             .map((t) => (typeof t === "string" ? createTag(t, true) : t))
  //             .concat(status.active),
  //     }),
  // removeTag: (tagId, draftTask) => {
  //     draftTask.tags = draftTask.tags.filter((tag) => tag.id !== tagId);
  // },
  // setActive: (__, draftTask) => {
  //     draftTask.tags = draftTask.tags
  //         .filter((tag) => !(tag.id in status))
  //         .concat(status.active);
  // },
  // setPending: (__, draftTask) => {
  //     draftTask.tags = draftTask.tags
  //         .filter((tag) => !(tag.id in status))
  //         .concat(status.pending);
  // },
  // setDone: (__, draftTask) => {
  //     draftTask.tags = draftTask.tags
  //         .filter((tag) => !(tag.id in status))
  //         .concat(status.done);
  // },
};

export const actions = createActions(actors);

export default createReducer(actors, initialState);
export const isFallen = (p) => p.status === playerStates.fallen;

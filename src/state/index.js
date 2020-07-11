import _ from "lodash";
import produce from "immer";
import { combineReducers } from "redux";
import { createActions, createReducer } from "./util";
import { collectionOf, actors as collectionActors } from "./collection";

import player, { initialState as playerInitialState } from "./player";
import world from "./world";
import ballCollection from "./ballCollection";
import { move } from "#/state/gameUtil";
import { getTile, isWalkable } from "#/state/world";
import { coldnessClamp, isFallen } from "#/state/player";
import { COLD_ACCUMULATOR, RUNNING_COLD_REDUCER } from "#/state/constants";

console.tap = (v, ...args) => (console.log(v, ...args), v);

export const initialState = {
  player: playerInitialState,
  world: [],
  balls: [],
  badKids: [],
};

const actors = {
  // clearError: collectionActors.remove,
};

export const actions = createActions(actors);

const reducers = combineReducers({
  // Existing reducers
  player,
  world,
  balls: ballCollection,
  badKids: () => [],
});

const validators = {};

const validationReducer = (state, { type, payload } = {}) => {
  const validation =
    type in validators ? validators[type](payload, state) : false;
  if (!validation) return false;
  return produce(state, (draft) => {
    draft.errors.push(validation);
  });
};

const directorReducer = (state, action) =>
  produce(state, (s) => {
    const isRunning = _.isObject(action.payload) && action.payload.running;

    s.balls.forEach((b, i) => {
      const ballTile = getTile(s.world, b.position);
      const hitTile = ballTile && !isWalkable(ballTile) ? ballTile : null;
      const hitKid = s.badKids.find((k) => k.position.equals(b.position));
      const hitTarget = hitKid || hitTile;

      if (hitTarget) {
        hitTarget.wetness = (hitTarget.wetness || 0) + b.quality;
        s.balls[i] = null;
      }
    });

    s.player.coldness = coldnessClamp(
      s.player.coldness +
        s.player.wetness +
        (isRunning ? RUNNING_COLD_REDUCER : COLD_ACCUMULATOR)
    );

    s.balls = s.balls.filter((v) => v);
  });

const gatherStateMapper = {
  throwBall: (__, s) => {
    const { position, facing, ball } = s.player;
    return { position, direction: facing, quality: ball.quality };
  },
  scoop: (__, s) => {
    const tileDepth = getTile(s.world, s.player.position).depth;
    return [1, 2, 3, 4, 5, 6][Math.abs(tileDepth)];
  },
  move: (direction, running, p) => {
    const walkPosition = move[direction](p.player.position.clone());
    const runPosition = move[direction](walkPosition.clone());
    const walkTile = getTile(p.world, walkPosition);

    if (isFallen(p.player)) {
      return { running, path: [] };
    }

    const canReachWalkPosition = walkTile && isWalkable(walkTile);

    if (running) {
      const runTile = getTile(p.world, runPosition);
      const canReachRunPosition =
        runTile && isWalkable(getTile(p.world, runPosition));
      if (canReachWalkPosition && canReachRunPosition) {
        return { running, path: [walkPosition, runPosition] };
      }
    }
    if (canReachWalkPosition) {
      return { running, path: [walkPosition] };
    } else {
      return { running, path: [] };
    }
  },
  moveLeft: (running, p) => gatherStateMapper.move("left", running, p),
  moveRight: (running, p) => gatherStateMapper.move("right", running, p),
  moveUp: (running, p) => gatherStateMapper.move("up", running, p),
  moveDown: (running, p) => gatherStateMapper.move("down", running, p),
};

const gatherPayload = (state, { type, payload }) => {
  return type in gatherStateMapper
    ? gatherStateMapper[type](payload, state)
    : payload;
};

/*
 * Standard reducers are isolated from one another. They cannot share values.
 * The Director is the only reducer with access to all of state.
 * This way it can validate and update values that have cross state dependencies
 *
 * @param {Object} state
 * @param {{payload: *, type: string}} action
 * @return {Object}
 */
const app = (state = initialState, action = {}) => {
  console.log(JSON.stringify(action, null, 4));
  // console.log(JSON.stringify({ state, action }, null, 4));
  action.payload = gatherPayload(state, action);
  //console.log(action.payload);
  const validationRes = validationReducer(state, action);
  if (validationRes) {
    // validationRes will be false if there were no errors
    return validationRes;
  }

  return directorReducer(reducers(state, action), action);
};
export default app;

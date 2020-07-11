import _ from "lodash";
import produce, { original } from "immer";
import { combineReducers } from "redux";
import { createActions } from "./util";

import player, { initialState as playerInitialState } from "./player";
import world, { getPath } from "./world";
import ballCollection from "./ballCollection";
import { actors as ballActors } from "./ball";
import { direction, move } from "#/state/gameUtil";
import { getKidPath, getTile, isWalkable } from "#/state/world";
import { coldnessClamp, isFallen, isRunning } from "#/state/player";
import { COLD_ACCUMULATOR, RUNNING_COLD_REDUCER } from "#/state/constants";
import { nextMove } from "#/tests/state/ai";

console.tap = (v, ...args) => {
  console.log(v, ...args);
  return v;
};

export const initialState = {
  player: playerInitialState,
  world: [],
  balls: [],
  badKids: [],
};

const actors = {
  tick: () => {},
  // clearError: collectionActors.remove,
};

export const actions = createActions(actors);

const reducers = combineReducers({
  // Existing reducers
  player: (state, action) =>
    "kidIndex" in action ? state : player(state, action),
  world,
  balls: ballCollection,
  badKids: (kids = [], action) =>
    kids.map((kid, i) => (i === action.kidIndex ? player(kid, action) : kid)),
});

// const validators = {};
//
// const validationReducer = (state, { type, payload } = {}) => {
//   const validation =
//     type in validators ? validators[type](payload, state) : false;
//   if (!validation) return false;
//   return produce(state, (draft) => {
//     draft.errors.push(validation);
//   });
// };

// move balls
// resolve ball collisions
// apply cold to kids
const directorReducer = (state, action) =>
  produce(state, (s) => {
    const kids = [s.player, ...s.badKids];

    s.balls.forEach((b, i) => {
      const path = getPath(s.world, b.position, b.direction, b.quality);

      let hitKid;
      let hitTile;

      for (let i = 0; i < path.length; i++) {
        hitKid = kids.find((k) => k.position.equals(path[i]));
        if (hitKid) break;
      }

      if (!hitKid) {
        const ballTile = getTile(s.world, _.last(path));
        hitTile = ballTile && !isWalkable(ballTile) ? ballTile : null;
      }

      if (hitKid || hitTile) {
        (hitKid || hitTile).wetness =
          ((hitKid || hitTile).wetness || 0) + b.quality;
        ballActors.hit((hitKid || hitTile).position, s.balls[i]);
      } else {
        if (s.balls[i].distance === 0) s.balls[i] = null;
        else ballActors.move(null, s.balls[i]);
      }
    });
    s.balls = s.balls.filter((v) => v);

    kids.forEach((kid) => {
      kid.coldness = coldnessClamp(
        kid.coldness +
          kid.wetness +
          (isRunning(kid) ? RUNNING_COLD_REDUCER : COLD_ACCUMULATOR)
      );
    });
  });

const gatherStateMapper = {
  throwBall: (__, s, kid) => {
    const { position, facing, ball } = kid;
    return { position, direction: facing, quality: ball.quality };
  },
  scoop: (__, s, kid) => {
    const tileDepth = getTile(s.world, kid.position).depth;
    return [1, 2, 3, 4, 5, 6][Math.abs(tileDepth)];
  },
  move: (dir, running, s, kid) => {
    const path = getKidPath(
      s.world,
      kid.position,
      direction[dir],
      {
        [true]: 1,
        [isFallen(kid)]: 0,
        [running]: 2,
      }[true]
    );

    return { running, path };
  },
  moveLeft: (running, p, k) => gatherStateMapper.move("left", running, p, k),
  moveRight: (running, p, k) => gatherStateMapper.move("right", running, p, k),
  moveUp: (running, p, k) => gatherStateMapper.move("up", running, p, k),
  moveDown: (running, p, k) => gatherStateMapper.move("down", running, p, k),
};

const gatherPayloadWith = (kid, state, { type, payload }) => {
  return type in gatherStateMapper
    ? gatherStateMapper[type](payload, state, kid)
    : payload;
};

const app = (state = initialState, action = {}) => {
  // gatherPayload with player
  // run `reducers`
  // for kid in badKids
  //  gatherPayload with kid
  //  run `reducers`
  // run director
  console.log(JSON.stringify(action, null, 4));
  const newState = [state.player, ...state.badKids].reduce((s, kid, i) => {
    let actionForKid;
    if (i === 0) {
      actionForKid = {
        type: action.type,
        payload: gatherPayloadWith(kid, state, action),
        kidIndex: -1,
      };
    } else {
      const nextAction = nextMove(kid, s);
      actionForKid = {
        type: nextAction.type,
        payload: gatherPayloadWith(kid, state, nextAction),
        kidIndex: i - 1,
      };
    }
    console.log(actionForKid);
    return reducers(s, actionForKid);
  }, state);

  // console.log(JSON.stringify({ state, action }, null, 4));
  // action.payload = gatherPayload(state, action);
  //console.log(action.payload);
  // const validationRes = validationReducer(state, action);
  // if (validationRes) {
  //   // validationRes will be false if there were no errors
  //   return validationRes;
  // }

  return directorReducer(newState, action);
};
export default app;

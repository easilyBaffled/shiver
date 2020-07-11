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
import { coldnessClamp, isFallen } from "#/state/player";
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
  player,
  world,
  balls: ballCollection,
  badKids: (kids = [], action) =>
    action.kidIndex === -1
      ? kids
      : produce(kids, (ks) => {
          ks[action.kidIndex] = player(kids[action.kidIndex], action);
        }),
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

const directorReducer = (state, action) =>
  produce(state, (s) => {
    const isRunning = _.isObject(action.payload) && action.payload.running;

    s.balls.forEach((b, i) => {
      const path = getPath(s.world, b.position, b.direction, b.quality);

      let hitKid;
      let hitTile;
      const playerPosition = s.player.position;

      for (let i = 0; i < path.length; i++) {
        hitKid = playerPosition.equals(path[i])
          ? s.player
          : s.badKids.find((k) => k.position.equals(path[i]));
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

    s.player.coldness = coldnessClamp(
      s.player.coldness +
        s.player.wetness +
        (isRunning ? RUNNING_COLD_REDUCER : COLD_ACCUMULATOR)
    );

    s.badKids.forEach((kid, i) => {
      const nextAction = nextMove(kid, s);

      nextAction.payload = {
        [true /*moving*/]: () => {
          const running = nextAction.payload;
          const path = getPath(
            s.world,
            kid.position,
            actionToDirection[nextAction.type],
            running ? 2 : 1
          );
          return { running, path };
        },
        [nextAction.type === "scoop"]: () => {
          const tileDepth = getTile(s.world, kid.position).depth;
          return [1, 2, 3, 4, 5, 6][Math.abs(tileDepth)];
        },
        [nextAction.type === "throwBall"]: () => {
          const { position, facing, ball } = kid;
          return { position, direction: facing, quality: ball.quality };
        },
      }[true]();

      const kidIsRunning =
        _.isObject(nextAction.payload) && nextAction.payload.running;
      console.log(nextAction.payload.path);
      s.badKids[i] = player(kid, nextAction);
      s.badKids[i].coldness = coldnessClamp(
        kid.coldness +
          kid.wetness +
          (kidIsRunning ? RUNNING_COLD_REDUCER : COLD_ACCUMULATOR)
      );
    });
  });

const actionToDirection = {
  moveLeft: direction.left,
  moveRight: direction.right,
  moveUp: direction.up,
  moveDown: direction.down,
};

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
      running ? 2 : 1
    );

    return { running, path };
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

const gatherPayloadWith = (kid, state, { type, payload }) => {
  return type in gatherStateMapper
    ? gatherStateMapper[type](payload, state, kid)
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
  // gatherPayload with player
  // run `reducers`
  // for kid in badKids
  //  gatherPayload with kid
  //  run `reducers`
  // run director
  console.log(JSON.stringify(action, null, 4));
  const newState = [state.player, ...state.badKids].reduce((s, kid, i) => {
    const actionForKid = {
      type: action.type,
      payload: gatherPayloadWith(kid, state, action),
      kidIndex: i - 1,
    };
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

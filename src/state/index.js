import _ from "lodash";
import produce from "immer";
import { combineReducers } from "redux";
import { createActions } from "./util";

import player, { initialState as playerInitialState } from "./player";
import world, { getPath } from "./world";
import ballCollection from "./ballCollection";
import { actors as ballActors } from "./ball";
import { direction } from "./gameUtil";
import { getKidPath, getTile, isWalkable } from "./world";
import { coldnessClamp, isFallen, isRunning } from "./player";
import { COLD_ACCUMULATOR, RUNNING_COLD_REDUCER } from "./constants";
import { nextMove } from "./ai";
import { Vector2 } from "./lib/Vector2";
import { tileType } from "./gameUtil";

function rand(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}

const largeWorld = Array.from({ length: 20 }, (___, y) =>
  Array.from({ length: 10 }, (__, x) => ({
    type: rand(0, 10) < 10 ? tileType.snow : tileType.tree,
    depth: 0,
    position: new Vector2(x, y),
  }))
);

[
  // badKid starting positions
  [1, 1],
  [2, 2],
  [4, 12],
  [5, 3],
  [1, 13],
].forEach(([x, y]) => {
  largeWorld[y][x].type = tileType.snow;
});

export const initialState = {
  player: playerInitialState,
  world: largeWorld,
  balls: [],
  badKids: [
    {
      name: 0,
      ...playerInitialState,
      position: new Vector2(2, 2),
      meek: rand(0, 10) < 7,
      discomfortRange: rand(3, 7),
    },
    // {
    //   name: 2,
    //   ...playerInitialState,
    //   position: new Vector2(6, 0),
    //   meek: rand(0, 10) < 5,
    //   discomfortRange: rand(0, 5),
    // },
    // {
    //   name: 3,
    //   ...playerInitialState,
    //   position: new Vector2(4, 12),
    //   meek: rand(0, 10) < 5,
    //   discomfortRange: rand(0, 5),
    // },
    // {
    //   name: 4,
    //   ...playerInitialState,
    //   position: new Vector2(5, 3),
    //   meek: rand(0, 10) < 5,
    //   discomfortRange: rand(0, 10),
    // },
    // {
    //   name: 5,
    //   ...playerInitialState,
    //   position: new Vector2(1, 13),
    //   meek: rand(0, 10) < 5,
    //   discomfortRange: rand(0, 10),
    // },
  ],
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

// move balls
// resolve ball collisions
// apply cold to kids
const directorReducer = (state, action) =>
  produce(state, (s) => {
    const kids = [s.player, ...s.badKids];

    s.balls.forEach((b, i) => {
      if (b.isNew) {
        s.balls[i].isNew = false;
      } else {
        const path = getPath(s.world, b.position, b.direction, b.quality);

        let hitKid;
        let hitTile;

        for (let i = 0; i < path.length; i++) {
          hitKid = kids.find((k) => k.position.equals(path[i]));
          if (hitKid) break;
        }

        if (!hitKid && path.length) {
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

const setFall = (path, world, isRunning) => {
  let fallChance = isRunning ? 10 : 0;
  let didFall = false;
  const fallPath = path
    .map((vec) => {
      if (didFall) return null;

      didFall = rand(0, 100) <= fallChance + getTile(world, vec).depth * -10;
      return vec;
    })
    .filter((v) => v);
  return { fallPath, didFall };
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
      {
        [true]: 1,
        [isFallen(kid)]: 0,
        [running]: 2,
      }[true]
    ).map((v) => v.clampScalar(0, 19));
    const { fallPath, didFall } = setFall(path, s.world);
    return { running, didFall, path: fallPath };
  },
  moveLeft: (running, p, k) => gatherStateMapper.move("left", running, p, k),
  moveRight: (running, p, k) => gatherStateMapper.move("right", running, p, k),
  moveUp: (running, p, k) => gatherStateMapper.move("up", running, p, k),
  moveDown: (running, p, k) => gatherStateMapper.move("down", running, p, k),
};

const gatherPayloadWith = (kid, state, { type, payload }) => {
  try {
    return type in gatherStateMapper
      ? gatherStateMapper[type](payload, state, kid)
      : payload;
  } catch (e) {
    console.error(kid, { type, payload }, state);
    throw e;
  }
};

const app = (state = initialState, action = {}) => {
  console.log(JSON.stringify(action, null, 4));
  const newState = [state.player, ...state.badKids].reduce((s, kid, i) => {
    let actionForKid;
    if (i === 0) {
      if (action.type === "scoop" && state.player.ball) {
        action.type = "throwBall";
      }
      actionForKid = {
        type: action.type,
        payload: gatherPayloadWith(kid, state, action),
      };
    } else {
      const nextAction = nextMove(kid, s);
      actionForKid = {
        type: nextAction.type,
        payload: gatherPayloadWith(kid, state, nextAction),
        kidIndex: i - 1,
      };
    }
    // console.log(actionForKid);
    return reducers(s, actionForKid);
  }, state);

  return directorReducer(newState, action);
};
export default app;

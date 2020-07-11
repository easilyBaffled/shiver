import {
  actions as playerActions,
  initialState as playerInit,
} from "#state/player";
// import { actions as tileActions } from "#state/tile";
// import { actions as worldAction } from "#state/world";
import app, { initialState } from "#state";
import { pos, num, playerStates, tileType, cappedSnow } from "#state/gameUtil";
import produce from "immer";
import { Vector2 } from "#/state/lib/Vector2";
import { COLD_ACCUMULATOR } from "#/state/constants";
import { direction } from "#/state/gameUtil";

console.tap = (v, ...args) => (console.log(v, ...args), v);
console.tap.label = (l, ...args) => (v) => (console.log(l, v, ...args), v);
console.tap.apply = (func, ...args) => (v) => (
  console.log(func(v), ...args), v
);

const flatWorld = [
  [
    { type: tileType.snow, depth: 0 },
    { type: tileType.snow, depth: 0 },
    { type: tileType.snow, depth: 0 },
    { type: tileType.snow, depth: 0 },
    { type: tileType.tree, depth: 0 },
  ],
];

describe("Player", () => {
  let i;
  describe("run", () => {
    beforeEach(() => {
      i = { ...initialState, world: flatWorld };
    });
    test("right", () => {
      const expected = app(i, playerActions.moveRight(true));

      const state = produce(i, (s) => {
        s.world[0][1].depth = -2;
        s.world[0][2].depth = -2;
        s.player.position = new Vector2(2, 0);
      });

      expect(expected).toEqual(state);
    });
    test("run into obstacle", () => {
      const state = produce(i, (s) => {
        s.world[0][2].type = tileType.tree;
      });
      const expected = app(state, playerActions.moveRight(true));
      const newState = produce(state, (s) => {
        s.world[0][1].depth = -2;
        s.player.position = new Vector2(1, 0);
      });

      expect(expected).toEqual(newState);
    });
  });
  describe("walk", () => {
    beforeEach(() => {
      i = { ...initialState, world: flatWorld };
    });
    test("right", () => {
      const expected = app(i, playerActions.moveRight());

      const state = produce(i, (s) => {
        s.world[0][1].depth = -1;
        s.player.position = new Vector2(1, 0);
        s.player.coldness += COLD_ACCUMULATOR;
      });

      expect(expected).toEqual(state);
    });
    test("walk into obstacle", () => {
      const state = produce(i, (s) => {
        s.world[0][1].type = tileType.tree;
      });

      const actual = app(state, playerActions.moveRight());
      const expected = produce(state, (s) => {
        s.player.position = new Vector2(0, 0);
        s.player.coldness += COLD_ACCUMULATOR;
      });

      expect(actual).toEqual(expected);
    });
    test("down", () => {
      const state = produce(i, (s) => {
        s.world.push([
          { type: tileType.snow, depth: 0 },
          { type: tileType.snow, depth: 0 },
          { type: tileType.snow, depth: 0 },
          { type: tileType.snow, depth: 0 },
          { type: tileType.tree, depth: 0 },
        ]);
      });

      const actual = app(state, playerActions.moveDown());

      const expected = produce(state, (s) => {
        s.world[1][0].depth = -1;
        s.player.position = new Vector2(0, 1);
        s.player.coldness = COLD_ACCUMULATOR;
      });

      expect(actual).toEqual(expected);
    });
  });
  describe("fall", () => {
    beforeEach(() => {
      i = { ...initialState, world: flatWorld };
    });
    test("will get wet when falls", () => {
      const actual = app(i, playerActions.fallDown());

      const expected = produce(i, (s) => {
        s.player.status = playerStates.fallen;
        s.player.wetness = 1;
        s.player.coldness = 2;
      });

      expect(actual).toEqual(expected);
    });
    test("will only up when moving from fallen", () => {
      const state = produce(i, (s) => {
        s.player.status = playerStates.fallen;
      });
      const actual = app(state, playerActions.moveRight());

      const expected = produce(state, (s) => {
        s.player.status = playerStates.up;
        s.player.coldness = 1;
      });

      expect(actual).toEqual(expected);
    });
    test("will gain cold from getting up", () => {
      const state = produce(i, (s) => {
        s.player.status = playerStates.fallen;
        s.player.wetness = 1;
        s.player.coldness = 1;
      });
      const actual = app(state, playerActions.moveRight());

      const expected = produce(state, (s) => {
        s.player.status = playerStates.up;
        s.player.coldness = 3;
      });

      expect(actual).toEqual(expected);
    });
  });
});
describe("Snowball", () => {
  let i;
  beforeEach(() => {
    i = { ...initialState, world: flatWorld };
  });
  describe("Scoop", () => {
    test("Tile Depth 0 -> Quality 1", () => {
      const state = produce(i, (s) => {});
      const expected = app(state, playerActions.scoop());
      const actual = produce(state, (s) => {
        s.player.ball = { quality: 1 };
        s.player.coldness += COLD_ACCUMULATOR;
      });

      expect(actual).toEqual(expected);
    });
    test("Tile Depth 1 -> Quality 2", () => {
      const state = produce(i, (s) => {
        s.world[0][0].depth = -1;
      });
      const expected = app(state, playerActions.scoop());
      const actual = produce(state, (s) => {
        s.player.ball = { quality: 2 };
        s.player.coldness += COLD_ACCUMULATOR;
      });

      expect(actual).toEqual(expected);
    });
    test("Tile Depth 2 -> Quality 3", () => {
      const state = produce(i, (s) => {
        s.world[0][0].depth = -2;
      });
      const expected = app(state, playerActions.scoop());
      const actual = produce(state, (s) => {
        s.player.ball = { quality: 3 };
        s.player.coldness += COLD_ACCUMULATOR;
      });

      expect(actual).toEqual(expected);
    });
    test("Tile Depth 3 -> Quality 4", () => {
      const state = produce(i, (s) => {
        s.world[0][0].depth = -3;
      });
      const expected = app(state, playerActions.scoop());
      const actual = produce(state, (s) => {
        s.player.ball = { quality: 4 };
        s.player.coldness += COLD_ACCUMULATOR;
      });

      expect(actual).toEqual(expected);
    });
    test("Tile Depth 4 -> Quality 5", () => {
      const state = produce(i, (s) => {
        s.world[0][0].depth = -4;
        s.player.coldness += COLD_ACCUMULATOR;
      });
      const expected = app(state, playerActions.scoop());
      const actual = produce(state, (s) => {
        s.player.ball = { quality: 5 };
        s.player.coldness += COLD_ACCUMULATOR;
      });

      expect(actual).toEqual(expected);
    });
    test("Tile Depth 5 -> Quality 6", () => {
      const state = produce(i, (s) => {
        s.world[0][0].depth = -5;
        s.player.coldness += COLD_ACCUMULATOR;
      });
      const expected = app(state, playerActions.scoop());
      const actual = produce(state, (s) => {
        s.player.ball = { quality: 6 };
        s.player.coldness += COLD_ACCUMULATOR;
      });

      expect(actual).toEqual(expected);
    });
    test("Will replace the current ball", () => {
      const state = produce(i, (s) => {
        s.world[0][0].depth = -1;
        s.player.ball = { quality: 5 };
        s.player.coldness += COLD_ACCUMULATOR;
      });
      const expected = app(state, playerActions.scoop());
      const actual = produce(state, (s) => {
        s.player.ball = { quality: 2 };
        s.player.coldness += COLD_ACCUMULATOR;
      });

      expect(actual).toEqual(expected);
    });
  });
  describe("Throw", () => {
    test("Throw will take the ball from the player inventory", () => {
      const state = produce(i, (s) => {
        s.player.ball = { quality: 1 };
        s.player.facing = direction.right;
      });
      const actual = app(state, playerActions.throwBall());
      const expected = produce(state, (s) => {
        s.player.coldness += COLD_ACCUMULATOR;
        s.player.ball = null;
        s.balls = [
          {
            direction: direction.right,
            position: new Vector2(1, 0),
            quality: 1,
            distance: 3,
          },
        ];
      });

      expect(actual).toEqual(expected);
    });
    test("ball will travel along its direction by its quality", () => {
      const state = produce(i, (s) => {
        s.balls = [
          {
            direction: direction.right,
            position: new Vector2(1, 0),
            quality: 1,
            distance: 3,
          },
        ];
      });
      const actual = app(state, playerActions.moveDown());
      const expected = produce(state, (s) => {
        s.player.facing = direction.down;
        s.player.coldness += COLD_ACCUMULATOR;
        s.balls = [
          {
            direction: direction.right,
            position: new Vector2(2, 0),
            quality: 1,
            distance: 2,
          },
        ];
      });

      expect(actual).toEqual(expected);
    });
    test("ball will fall if it runs out of distance", () => {
      const state = produce(i, (s) => {
        s.balls = [
          {
            direction: direction.right,
            position: new Vector2(1, 0),
            quality: 1,
            distance: 0,
          },
        ];
      });
      const actual = app(state, playerActions.moveDown());
      const expected = produce(state, (s) => {
        s.player.facing = direction.down;
        s.player.coldness += COLD_ACCUMULATOR;
        s.balls = [];
      });

      expect(actual).toEqual(expected);
    });
  });
  describe("Hit By", () => {
    test("ball will collide with the tree", () => {
      const state = produce(i, (s) => {
        s.balls = [
          {
            direction: direction.right,
            position: new Vector2(3, 0),
            quality: 2,
            distance: 2,
          },
        ];
      });
      const actual = app(state, playerActions.moveDown());
      const expected = produce(state, (s) => {
        s.player.facing = direction.down;
        s.player.coldness += COLD_ACCUMULATOR;
        s.world[0][4].wetness = 2;
        s.balls = [];
      });

      expect(actual).toEqual(expected);
    });
  });
});

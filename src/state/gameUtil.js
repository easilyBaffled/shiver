import { Vector2 } from "./lib/Vector2";

export const pos = (x, y) => ({ x, y });

export const clamp = (minVal, maxVal, val) =>
  Math.max(minVal, Math.min(maxVal, val));

export const direction = {
  up: new Vector2(0, -1),
  down: new Vector2(0, 1),
  left: new Vector2(-1, 0),
  right: new Vector2(1, 0),
};

export const move = {
  up: (v, speed = 1) => v.add(direction.up.multiplyScalar(speed)),
  down: (v, speed = 1) => v.add(direction.down.multiplyScalar(speed)),
  left: (v, speed = 1) => v.add(direction.left.multiplyScalar(speed)),
  right: (v, speed = 1) => v.add(direction.right.multiplyScalar(speed)),
};

export const playerStates = {
  up: "up",
  fallen: "fallen",
  running: "running",
};

export const tileType = {
  tree: "tree",
  snow: "snow",
};

export const dirFromVector = ({ x, y }) =>
  ({
    [true]: "Right",
    [x === 0 && y === 1]: "Down",
    [x === 0 && y === -1]: "Up",
    [x === -1 && y === 0]: "Left",
    [x === 1 && y === 0]: "Right",
  }[true]);

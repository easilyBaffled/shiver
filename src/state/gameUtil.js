import { immerable } from "immer";

import { Vector2 } from "./lib/Vector2";

export const pos = (x, y) => ({ x, y });
export class BoundNumber {
  min = 0;
  max = 0;
  _val = 0;
  get val() {
    return this._val;
  }
  set val(value) {
    this._val = value < this.min ? value : this.max < value ? this.max : value;
  }
  [immerable] = true;
  constructor(min, max, val) {
    this.min = min;
    this.max = max;
    this._val = val ?? min;
  }
  clone() {
    return new BoundNumber(this.min, this.max, this._val);
  }
}

export const clamp = (minVal, maxVal, val) =>
  Math.max(minVal, Math.min(maxVal, val));

export const direction = {
  up: new Vector2(0, -1),
  down: new Vector2(0, 1),
  left: new Vector2(-1, 1),
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

export const cappedSnow = new BoundNumber(-5, 0, 0);

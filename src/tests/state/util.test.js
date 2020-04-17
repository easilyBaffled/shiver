import { createReducer, match, createActions } from "../../state/util";

const actors = {
  add: (v, s) => v + s,
  subtract: (v, s) => v - s,
};

describe("createActions", () => {
  test("produces a mirror object", () => {
    const actual = Object.keys(createActions(actors));
    const expected = Object.keys(actors);
    expect(actual).toEqual(expected);
  });
  test("makes an action function for each actors function", () => {
    const actual = createActions(actors).add(1);
    const expected = { type: "add", payload: 1 };
    expect(actual).toEqual(expected);
  });
});

describe("createReducer", () => {
  test("produces a redux reducer function", () => {
    const reducer = createReducer(actors, 0);
    const actual = reducer(0, "init");
    const expected = 0;
    expect(actual).toEqual(expected);
  });
  test("produces a redux reducer function", () => {
    const { add } = createActions(actors);
    const actual = createReducer(actors, 0)(0, add(1));
    const expected = 1;
    expect(actual).toEqual(expected);
  });
});

describe("match", () => {
  test("takes an object of <bool, func>", () => {
    const actual = match({
      [true]: () => 1,
    });
    const expected = 1;
    expect(actual).toEqual(expected);
  });
  test("keys are only booleans", () => {
    const actual = match({
      [true]: () => 1,
      [!!"yes"]: () => 2,
      ["yes"]: () => 3,
      [1]: () => 4,
    });
    const expected = 2;
    expect(actual).toEqual(expected);
  });
  test("order matters", () => {
    const actual = match({
      [true]: () => 1,
      [true]: () => 2,
      [true]: () => 3,
    });
    const expected = 3;
    expect(actual).toEqual(expected);
  });
  test("will break if a value is not a function", () => {
    expect(() =>
      match({
        [true]: 1,
      })
    ).toThrow();
  });
});

import { actors as ballActors } from "./ball";

export default (state = [], { type, payload } = {}) => {
  let newState = state.filter((b) => b && !b.hit);
  if (type === "throwBall") {
    newState.push(ballActors.throwBall(payload));
  }
  return newState;
};

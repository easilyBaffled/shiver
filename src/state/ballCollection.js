import ballReducer, { actions, actors as ballActors } from "#/state/ball";

export default (state = [], { type, payload } = {}) => {
  let newState = state.map((ball) => ballReducer(ball, actions.move()));
  if (type === "throwBall") {
    newState.push(ballActors.throwBall(payload));
  }
  return newState;
};

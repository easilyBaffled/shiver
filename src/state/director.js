import _ from "lodash";
import { combineReducers } from "redux";
import { createActions } from "./util";
import { collectionOf, actors as collectionActors } from "./collection";
import body, { actions as bodyActions, actors as bodyActors } from "./body";

const actors = {
  changeTeam: (id, { teamA, teamB, ...s }) => {
    const [oldTeam, newTeam] = id in teamA ? [teamA, teamB] : [teamB, teamA];
    const [oldTeamName, newTeaName] =
      id in teamA ? ["teamA", "teamB"] : ["teamB", "teamA"];

    const payload = _.cloneDeep(oldTeam[id]);

    return {
      ...s,
      [oldTeamName]: collectionActors.remove({ id }, oldTeam),
      [newTeaName]: collectionActors.add({ id, payload }, newTeam),
    };
  },
};

export const actions = createActions(actors);

const initialState = {
  teamA: {
    player: { x: 250, y: 250, r: 10 },
    target: { x: 100, y: 100, r: 10 },
  },
  teamB: {},
  distance: 0,
};

const reducers = combineReducers({
  // Existing reducers
  teamA: collectionOf(body, bodyActors, initialState.teamA),
  teamB: collectionOf(body, bodyActors, initialState.teamB),
  // Values that only the director will control, these values are dependant on the above reducer's values
  distance: (v = {}) => v,
});

/**
 *
 * @param {string} type
 * @param {*} payload
 * @return {function(Object): Object}
 */
const standardReducerFunc = ({ type, payload }) => (state) =>
  type in actors ? actors[type](payload, state) : state;

/**
 * Distance would be better done as a selector, but this it to show a situation that would use isolated state
 * @param {string} type
 * @return {function(Object): Object}
 */
const updateDerivedValue = ({ type }) => (state) => {
  if (type in bodyActions) {
    const player = state.teamA.player || state.teamB.player;
    const target = state.teamA.target || state.teamB.target;

    const dx = player.x - target.x;
    const dy = player.y - target.y;
    return {
      ...state,
      distance: Math.hypot(dx, dy),
    };
  }
  return state;
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
const director = (state = initialState, action = {}) =>
  _.flow(
    standardReducerFunc(action),
    updateDerivedValue(action)
  )(reducers(state, action));

export default director;

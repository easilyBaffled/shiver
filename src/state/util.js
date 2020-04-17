import { useDispatch } from "react-redux";

/**
 * Flatten deep and complex if/ternary operations
 * @param {Object.<boolean, function>} obj
 * @return {*}
 */
export const match = (obj) => obj[true]();

const payloadUnpacker = (payload) =>
  match({
    true: () => payload,
    [payload.length === 0]: () => undefined,
    [payload.length === 1]: () => payload[0],
  });

/**
 * Convert Actors - state updating functions used by the reducer - into redux action functions
 * by using the actor name as the action `type`.
 * @param {Object.<string, function>} updaters
 * @return {Object.<string, function(...[*]=): {payload: ...[*]=, type: string}>}
 */
export const createActions = (updaters) =>
  Object.keys(updaters).reduce(
    (acc, type) => ({
      ...acc,
      [type]: (...payload) => ({
        type,
        payload: payloadUnpacker(payload),
      }),
    }),
    {}
  );

/**
 *
 * @param {Object.<string, function(...[*]=, T): T >} actors
 * @param {T} initialState
 * @return {function(T, { type: string, payload: ...[*]= }): T}
 */
export const createReducer = (actors, initialState) => (
  state = initialState,
  { type, payload } = {}
) => {
  try {
    return type in actors ? actors[type](payload, state) : state;
  } catch (e) {
    const data = {
      type,
      action: actors[type],
      payload,
    };
    e.message = `${JSON.stringify(data, null, 4)}
      ${e.message}
      `;
    throw new Error(e);
  }
};

export const useEntityDispatch = (entityId) => {
  const dispatch = useDispatch();
  return (action) => {
    dispatch({ id: entityId, ...action });
  };
};

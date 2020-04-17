import { createActions, createReducer, match } from "./util";
const initialState = {};

export const actors = {
  add: ({ id, payload }, collection) => ({
    ...collection,
    [id]: payload,
  }),
  remove: ({ id }, collection) =>
    Object.fromEntries(
      Object.entries(collection).filter(([entryId]) => entryId !== id)
    ),
};

/**
 * Create a reducer that will serve for a collection of a certain type.
 * The type's reducer and actors are passed in to be used when the collection needs to target a specific entry
 * The initialState describes the initial collection, not just the type
 * @param {function(T, { type: string, payload: ...[*]= }): T} entryReducer
 * @param {Object.<string, function(...[*]=, T): T >} entryActors
 * @param {Object.<string, T>} initialState
 * @return {function(Object.<string, T>, {type: *, id?: *, payload: ...[*]=}): Object.<string, T>}
 */
export const collectionOf = (entryReducer, entryActors, initialState = {}) => {
  let debugId = 0;
  const collectionLevelReducer = createReducer(actors, initialState);
  return (collection = initialState, { type, id = debugId++, payload }) => {
    const collectionLevelAction = type in actors && id in collection;
    const entryLevelAction = type in entryActors && id in collection;

    return match({
      true: () => collection,
      [collectionLevelAction]: () =>
        collectionLevelReducer(collection, { type, id, payload }),
      [entryLevelAction]: () => ({
        ...collection,
        [id]: entryReducer(collection[id], { type, id, payload }),
      }),
    });
  };
};

export const actions = createActions(actors);

export default createReducer(actors, initialState);

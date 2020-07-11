import { createActions, createReducer } from "./util";
import { num, pos, tileType } from './gameUtil';

const initialState = {
    status: tileType.snow,
    position: pos(0, 0),
    depth: num( -5, 0, 0 )
};

export const actors = {
    accumulateSnow: (__, draftPlayer) => {
        draftPlayer.position += isRunning(draftPlayer) ? 2 : 1
    }
    // create: ({ tags = [], ...baseData }) =>
    //     expandTask({
    //         ...initialState,
    //         ...baseData,
    //         tags: tags
    //             .map((t) => (typeof t === "string" ? createTag(t, true) : t))
    //             .concat(status.active),
    //     }),
    // removeTag: (tagId, draftTask) => {
    //     draftTask.tags = draftTask.tags.filter((tag) => tag.id !== tagId);
    // },
    // setActive: (__, draftTask) => {
    //     draftTask.tags = draftTask.tags
    //         .filter((tag) => !(tag.id in status))
    //         .concat(status.active);
    // },
    // setPending: (__, draftTask) => {
    //     draftTask.tags = draftTask.tags
    //         .filter((tag) => !(tag.id in status))
    //         .concat(status.pending);
    // },
    // setDone: (__, draftTask) => {
    //     draftTask.tags = draftTask.tags
    //         .filter((tag) => !(tag.id in status))
    //         .concat(status.done);
    // },
};

export const actions = createActions(actors);

export default createReducer(actors, initialState);

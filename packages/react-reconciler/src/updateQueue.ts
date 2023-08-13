import { Dispatch } from "react/src/currentDispatcher";
import { Action } from "shared/ReactTypes";
import { Lane } from "./fiberLanes";

export interface Update<State> {
    action: Action<State>;
    lane: Lane;
    next: Update<State> | null
}

export interface UpdateQueue<State> {
    shared: {
        pending: Update<State> | null;
    };
    dispatch: Dispatch<State> | null;
}

export const createUpdate = <State>(action: Action<State>, lane: Lane) => {
    return {
        action,
        lane,
        next: null
    };
};

export const createUpdateQueue = <State>(): UpdateQueue<State> => {
    return {
        shared: {
            pending: null,
        },
        dispatch: null,
    };
};

export const enqueueUpdate = <State>(
    updateQueue: UpdateQueue<State>,
    update: Update<State>
) => {
    // 为了批处理，也就是多次触发更新会创建多个update
    const pending = updateQueue.shared.pending
    if (pending === null) {
        update.next = update
        // 当前queue中还没有update
    } else {
        update.next = pending.next
        pending.next = update
    }
    updateQueue.shared.pending = update;
};

export const processUpdateQueue = <State>(
    baseState: State,
    pendingUpdate: Update<State> | null,
    renderLane: Lane
): { memorizedState: State } => {
    const result: ReturnType<typeof processUpdateQueue<State>> = {
        memorizedState: baseState,
    };
    if (pendingUpdate !== null) {

        // 第一个update
        let first = pendingUpdate.next
        let pending = pendingUpdate.next as Update<typeof baseState>

        do {
            const updateLane = pending.lane
            if (updateLane === renderLane) {
                // const action = pendingUpdate.action;
                const action = pending.action;
                if (action instanceof Function) {
                    // result.memorizedState = action(baseState);
                    baseState = action(baseState);
                } else {
                    // result.memorizedState = action;
                    baseState = action;
                }
            } else {
                if (__DEV__) {
                    console.error('不应该进入这个逻辑！')
                }
            }
            pending = pending.next as Update<typeof baseState>
        } while (pending !== first);

    }
    result.memorizedState = baseState
    return result;
};

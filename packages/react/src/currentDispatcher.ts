import { Action } from "shared/ReactTypes";

export interface Dispatcher {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useState: <T>(initialState: T | (() => T)) => [T, Dispatch<T>];
}

export type Dispatch<state> = (action: Action<state>) => void;

const currentDispatcher: {
    current: Dispatcher | null;
} = {
    current: null,
};

export const resolveDispatcher = (): Dispatcher => {
    const dispatch = currentDispatcher.current;

    if (dispatch === null) {
        throw new Error("hook只能在函数组件中执行");
    }

    return dispatch;
};

export default currentDispatcher;

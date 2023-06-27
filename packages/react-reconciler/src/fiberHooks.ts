import internals from "shared/internals";
import { FiberNode } from "./fiber";
import { Dispatch, Dispatcher } from "react/src/currentDispatcher";
import {
    UpdateQueue,
    createUpdate,
    createUpdateQueue,
    enqueueUpdate,
    processUpdateQueue,
} from "./updateQueue";
import { Action } from "shared/ReactTypes";
import { scheduleUpdateOnFiber } from "./workLoop";

let currentlyRenderingFiber: FiberNode | null = null;

// 正在处理的hooks
let workInProgressHook: Hook | null = null;
// 双缓存技术
let currentHook: Hook | null = null;

const { currentDispatcher } = internals;

interface Hook {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    memorizedState: any;
    updateQueue: unknown;
    next: Hook | null;
}

// 入口函数，在生成子fiber时调用
export function renderWithHooks(workInProgress: FiberNode) {
    currentlyRenderingFiber = workInProgress;
    workInProgress.memorizedState = null;

    // 取值
    const current = workInProgress.alternate;

    if (current !== null) {
        // update
        currentDispatcher.current = HooksDispatcherOnUpdate;
    } else {
        // 这里通过shared中转和react中的internal关联上
        currentDispatcher.current = HooksDispatcherOnMount;
    }

    const Component = workInProgress.type;
    const props = workInProgress.memorizedProps;

    const children = Component(props);

    // 重置操作
    currentlyRenderingFiber = null;
    currentHook = null;
    workInProgressHook = null;
    return children;
}

const HooksDispatcherOnMount: Dispatcher = {
    useState: mountState,
};

const HooksDispatcherOnUpdate: Dispatcher = {
    useState: updateState,
};

function mountState<State>(
    initialState: State | (() => State)
): [State, Dispatch<State>] {
    // 找到当前useState对应的hook数据
    const hook = mountWorkInProgressHook();
    let memorizedState;
    if (initialState instanceof Function) {
        memorizedState = initialState();
    } else {
        memorizedState = initialState;
    }

    const queue = createUpdateQueue<State>();

    // 这一步是做什么的呢？
    hook.updateQueue = queue;
    hook.memorizedState = memorizedState;

    // 第三个参数action由用户使用useState时传
    const dispatch = dispatchSetState.bind(
        null,
        currentlyRenderingFiber as FiberNode,
        queue as UpdateQueue<unknown>
    );

    // 这是updateQueue新增的dispatch属性
    queue.dispatch = dispatch;

    return [memorizedState, dispatch];
}

function updateState<State>(): [State, Dispatch<State>] {
    // 找到当前useState对应的hook数据
    const hook = updateWorkInProgressHook();

    // 计算新state的逻辑
    const queue = hook.updateQueue as UpdateQueue<State>;

    const pending = queue.shared.pending;

    if (pending !== null) {
        const { memorizedState } = processUpdateQueue(
            hook.memorizedState,
            pending
        );
        hook.memorizedState = memorizedState;
    }
    return [hook.memorizedState, queue.dispatch as Dispatch<State>];
}

// 和updateContainer类似
async function dispatchSetState<State>(
    fiber: FiberNode,
    updateQueue: UpdateQueue<State>,
    action: Action<State>
) {
    const update = createUpdate(action);
    // 把更新状态添加到更新队列
    enqueueUpdate(updateQueue, update);

    scheduleUpdateOnFiber(fiber);
}

function mountWorkInProgressHook(): Hook {
    const hook: Hook = {
        memorizedState: null,
        updateQueue: null,
        next: null,
    };
    if (workInProgressHook === null) {
        // MOUNT时且是第一个hook
        if (currentlyRenderingFiber === null) {
            // 没有在一个函数组件内调用hook
            throw new Error("请在函数组件内使用Hook");
        } else {
            workInProgressHook = hook;
            currentlyRenderingFiber.memorizedState = workInProgressHook;
        }
    } else {
        // mount时 后续的hook
        workInProgressHook.next = hook;
        workInProgressHook = hook;
    }
    return workInProgressHook;
}

function updateWorkInProgressHook(): Hook {
    // TODO render阶段触发的更新
    let nextCurrentHook: Hook | null = null;

    if (currentHook === null) {
        // 这是这个FC update时的第一个hook
        const current = currentlyRenderingFiber?.alternate;
        if (current !== null) {
            // update
            nextCurrentHook = current?.memorizedState;
        } else {
            // mount
            nextCurrentHook = null;
        }
    } else {
        // 这个FC update时 后续的hook（链表）
        nextCurrentHook = currentHook.next;
    }

    if (nextCurrentHook === null) {
        // mount/update u1 u2 u3
        // update       u1 u2 u3 u4
        throw new Error(
            `组件${currentlyRenderingFiber?.type}本次执行时比上一次执行多了一个hook`
        );
    }

    currentHook = nextCurrentHook as Hook;
    const newHook = {
        memorizedState: currentHook.memorizedState,
        updateQueue: currentHook.updateQueue,
        next: null,
    };

    if (workInProgressHook === null) {
        // MOUNT时且是第一个hook
        if (currentlyRenderingFiber === null) {
            // 没有在一个函数组件内调用hook
            throw new Error("请在函数组件内使用Hook");
        } else {
            workInProgressHook = newHook;
            currentlyRenderingFiber.memorizedState = workInProgressHook;
        }
    } else {
        // mount时 后续的hook
        workInProgressHook.next = newHook;
        workInProgressHook = newHook;
    }
    return workInProgressHook;
}

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
import { Lane, NoLane, requestUpdateLane } from "./fiberLanes";
import { Flags, PassiveEffect } from "./fiberFlags";
import { HookHasEffect, Passive } from "./hookEffectTag";

export interface Effect {
    tag: Flags;
    create: EffectCallback | void
    destory: EffectCallback | void
    deps: EffectDeps
    next: Effect | null
}

type EffectCallback = () => void
type EffectDeps = any[] | null

export interface FCUpateQueue<State> extends UpdateQueue<State> {
    lastEffect: Effect | null
}

let currentlyRenderingFiber: FiberNode | null = null;

// 正在处理的hooks
let workInProgressHook: Hook | null = null;
// 双缓存技术
let currentHook: Hook | null = null;
let renderLane: Lane = NoLane
const { currentDispatcher } = internals;

interface Hook {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    memorizedState: any;
    updateQueue: unknown;
    next: Hook | null;
}

// 入口函数，在生成子fiber时调用
export function renderWithHooks(workInProgress: FiberNode, lane: Lane) {
    // 
    currentlyRenderingFiber = workInProgress;
    // 重置hook链表
    workInProgress.memorizedState = null;
    // 重置effect链表
    workInProgress.updateQueue = null
    // 取值
    const current = workInProgress.alternate;
    renderLane = lane
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
    renderLane = NoLane
    workInProgressHook = null;
    return children;
}

const HooksDispatcherOnMount: Dispatcher = {
    useState: mountState,
    useEffect: mountEffect,
};

const HooksDispatcherOnUpdate: Dispatcher = {
    useState: updateState,
    useEffect: updateEffect,
};

function mountEffect(create: EffectCallback, deps: EffectDeps) {
    // 找到当前useState对应的hook数据
    const hook = mountWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    (currentlyRenderingFiber as FiberNode).flags |= PassiveEffect
    hook.memorizedState = pushEffect(Passive | HookHasEffect, create, undefined, nextDeps)
}

function updateEffect(create: EffectCallback, deps: EffectDeps) {
    // 找到当前useState对应的hook数据
    const hook = updateWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    let destory: EffectCallback
    if (currentHook !== null) {
        const preEffect = currentHook.memorizedState as Effect
        destory = preEffect.destory as EffectCallback

        if (nextDeps !== null) {
            const preDeps = preEffect.deps;
            // 浅比较
            if (areHookInputEqual(nextDeps, preDeps)) {
                // 不触发回调用
                hook.memorizedState = pushEffect(Passive, create, destory, nextDeps)
                return
            }
            // 不相等
            (currentlyRenderingFiber as FiberNode).flags |= PassiveEffect
            hook.memorizedState = pushEffect(Passive | HookHasEffect, create, destory, nextDeps)
        }
    }
}

function areHookInputEqual(nextDeps: EffectDeps, preEffect: EffectDeps) {
    try {
        if (preEffect === null || nextDeps === null) {
            return false
        }
        for (let index = 0; index < preEffect.length && index < nextDeps.length; index++) {
            if (Object.is(preEffect[index], nextDeps[index])) {
                continue
            }
            return false
        }
        return true
    } catch (error) {
        console.log(error)
        return true
    }
}

function pushEffect(hookFlag: Flags, create: EffectCallback, destory: EffectCallback | undefined, deps: EffectDeps | null): Effect {
    const effect: Effect = {
        tag: hookFlag,
        create,
        destory,
        deps,
        next: null
    }
    const fiber = currentlyRenderingFiber as FiberNode
    const UpdateQueue = fiber.updateQueue as FCUpateQueue<any>
    if (UpdateQueue === null) {
        const updateQueue = createFCUpateQueue<any>();
        fiber.updateQueue = updateQueue
        effect.next = effect
        updateQueue.lastEffect = effect
    } else {
        const lastEffect = UpdateQueue.lastEffect
        if (lastEffect === null) {
            effect.next = effect
            UpdateQueue.lastEffect = effect
        } else {
            const firstEffect = lastEffect.next
            lastEffect.next = effect
            effect.next = firstEffect
            UpdateQueue.lastEffect = effect
        }
    }
    return effect
}

function createFCUpateQueue<State>(): FCUpateQueue<State> {
    const updateQueue = createUpdateQueue<State>() as FCUpateQueue<State>;
    updateQueue.lastEffect = null
    return updateQueue
}

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
    // !!!bugfix,如果不把queue.shaed.pending,会导致下次批处理的时候，复用了之前的update
    // 当渲染到这个usestate的时候将queue.shared.pending清空
    queue.shared.pending = null

    if (pending !== null) {
        const { memorizedState } = processUpdateQueue(
            hook.memorizedState,
            pending,
            renderLane
        );
        hook.memorizedState = memorizedState;
    }
    return [hook.memorizedState, queue.dispatch as Dispatch<State>];
}

// 和updateContainer类似
function dispatchSetState<State>(
    fiber: FiberNode,
    updateQueue: UpdateQueue<State>,
    action: Action<State>
) {
    const lane = requestUpdateLane()
    const update = createUpdate(action, lane);
    // 把更新状态添加到更新队列
    enqueueUpdate(updateQueue, update);

    scheduleUpdateOnFiber(fiber, lane);
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

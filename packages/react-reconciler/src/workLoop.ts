import { scheduleMicroTask } from "hostConfig";
import { beginWork } from "./beginWork";
import { commitMutationEffects } from "./commitWork";
import { completeWork } from "./completeWork";
import { FiberNode, FiberRootNode, createWorkInProgress } from "./fiber";
import { MutationMask, NoFlags } from "./fiberFlags";
import { Lane, NoLane, SyncLane, getHighestPriorityLane, markRootFinished, mergeLanes } from "./fiberLanes";
import { HostRoot } from "./workTags";
import { flushSyncCallbacks, scheduleSyncCallback } from "./syncTaskQueue";

let WorkInProgress: FiberNode | null;

let workInProgressRootRenderLane: Lane = NoLane
/**
 * @description 该函数用于准备一个新的栈，将 WorkInProgress 赋值为传入的 fiber 节点。
 */
function prepareFreshStack(root: FiberRootNode, lane: Lane) {
    WorkInProgress = createWorkInProgress(root.current, {});
    workInProgressRootRenderLane = lane
}

/**
 * 在fibel中调度update
 */
export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane) {
    // 调度
    const root = markUpdateFromFiberToRoot(fiber);
    // 记录当前lane放在FiberRootNode中
    markUpateOnFiberToRoot(root, lane)

    // renderRoot(root);
    ensureRootIsScheduled(root)
}

// 调度阶段入口
function ensureRootIsScheduled(root: FiberRootNode) {
    const updateLane = getHighestPriorityLane(root.pendingLanes)

    if (updateLane === NoLane) {
        if (__DEV__) {
            console.warn('错误优先级：' + updateLane)
        }
        return
    }

    if (updateLane === SyncLane) {
        if (__DEV__) {
            console.warn('在微任务中调度，优先级：' + updateLane)
        }
        // 用微任务调度，构造一个数组
        scheduleSyncCallback(perfornmSyncWorkOnRoot.bind(null, root, updateLane))
        scheduleMicroTask(flushSyncCallbacks)
    } else {
        // react有很多优先级，用宏任务调度
    }
}

function markUpateOnFiberToRoot(root: FiberRootNode, lane: Lane) {
    root.pendingLanes = mergeLanes(root.pendingLanes, lane)
}

/**
 * 遍历到根节点
 */

function markUpdateFromFiberToRoot(fiber: FiberNode) {
    let node = fiber;
    let parent = node.return;
    while (parent !== null) {
        node = parent;
        parent = node.return;
    }
    if (node.tag === HostRoot) {
        return node.stateNode;
    }
    return null;
}

/**
 * @description 该函数是 Fiber 的入口函数，用于初始化并开始 Fiber 的工作循环。
 */
export function /*renderRoot*/ perfornmSyncWorkOnRoot(root: FiberRootNode, lane: Lane) {
    const nextLane = getHighestPriorityLane(root.pendingLanes)
    console.log(nextLane, 'nextlane');
    if (nextLane !== SyncLane) {


        // 其他比Synclane低优先级的任务
        ensureRootIsScheduled(root)
        return
    }

    if (__DEV__) {
        console.warn('render阶段开始了！！！')
    }

    // 初始化
    prepareFreshStack(root, lane);

    do {
        try {
            workLoop();
            break;
        } catch (error) {
            if (__DEV__) {
                console.warn("发生了错误");
            }
            WorkInProgress = null;
        }
        // eslint-disable-next-line no-constant-condition
    } while (true);

    const finishedWork = root.current.alternate;
    root.finishedWork = finishedWork;
    root.finishedLane = lane
    commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
    const finishedWork = root.finishedWork;
    if (finishedWork === null) {
        return;
    }

    if (__DEV__) {
        console.warn("commit阶段开始", finishedWork);
    }
    const lane = root.finishedLane

    if (lane === NoLane) {
        if (__DEV__) {
            console.error('commit阶段finishedLane不应该是NoLane')
        }
    }

    // 重置
    root.finishedWork = null;
    root.finishedLane = NoLane
    markRootFinished(root, lane)
    // 判断是否存在三个子阶段需要执行的操作

    const subtreeHasEffect =
        (finishedWork.subtreeFlags & MutationMask) != NoFlags;

    const rootHasEffect = (finishedWork.flags & MutationMask) != NoFlags;

    if (subtreeHasEffect || rootHasEffect) {
        // beforeMutation
        console.warn("beforeMutation");
        commitMutationEffects(finishedWork);

        // mutation
        console.warn("mutation");
        root.current = finishedWork;
        // layout
        console.warn("layout");
    } else {
        root.current = finishedWork;
    }
}

/**
 * @description 该函数是 Fiber 的工作循环，用于不断地执行任务，直到任务队列为空。
 */
function workLoop() {
    while (WorkInProgress !== null) {
        performUnitOfWork(WorkInProgress);
    }
}

/**
 * @description 该函数是执行单元任务，用于执行 beginWork 并将 next 赋值给 WorkInProgress，如果 next 为空，则执行 completeUnitOfWork。
 */
function performUnitOfWork(fiber: FiberNode) {
    const next = beginWork(fiber, workInProgressRootRenderLane);
    fiber.memorizedProps = fiber.pendingProps;
    // fiber.memorizedProps = next?.memorizedProps ?? fiber.pendingProps;

    if (next === null) {
        completeUnitOfWork(fiber);
    } else {
        WorkInProgress = next;
    }
}

/**
 * @description 该函数是执行完成任务，用于执行 completeWork，然后将 WorkInProgress 赋值为下一个 sibling，如果没有 sibling，则将返回值赋值给 node.return，最后将 WorkInProgress 赋值为 null。
 */
function completeUnitOfWork(fiber: FiberNode) {
    let node: FiberNode | null = fiber;
    do {
        completeWork(node);
        const sibling = node.sibling;
        if (sibling !== null) {
            WorkInProgress = sibling;
            return;
        } else {
            node = node.return;
            WorkInProgress = null;
        }
    } while (node !== null);
}

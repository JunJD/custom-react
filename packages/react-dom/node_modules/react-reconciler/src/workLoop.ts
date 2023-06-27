import { beginWork } from "./beginWork";
import { commitMutationEffects } from "./commitWork";
import { completeWork } from "./completeWork";
import { FiberNode, FiberRootNode, createWorkInProgress } from "./fiber";
import { MutationMask, NoFlags } from "./fiberFlags";
import { HostRoot } from "./workTags";

let WorkInProgress: FiberNode | null;

/**
 * @description 该函数用于准备一个新的栈，将 WorkInProgress 赋值为传入的 fiber 节点。
 */
function prepareFreshStack(root: FiberRootNode) {
    WorkInProgress = createWorkInProgress(root.current, {});
}

/**
 * 在fibel中调度update
 */
export function scheduleUpdateOnFiber(fiber: FiberNode) {
    // 调度
    const root = markUpdateFromFiberToRoot(fiber);
    renderRoot(root);
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
export function renderRoot(root: FiberRootNode) {
    // 初始化
    prepareFreshStack(root);

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

    // 重置
    root.finishedWork = null;

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
    const next = beginWork(fiber);
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

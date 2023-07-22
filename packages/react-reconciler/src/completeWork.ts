import {
    appendInitialChild,
    createInstance,
    createTestInstance,
} from "hostConfig";
import { FiberNode } from "./fiber";
import {
    Fragment,
    FunctionComponent,
    HostComponent,
    HostRoot,
    HostText,
} from "./workTags";
import { NoFlags, Update } from "./fiberFlags";
import { updateFiberProps } from "react-dom/src/SyntheticEvent";

function markUpdate(fiber: FiberNode) {
    fiber.flags |= Update;
}

/**
 * @description 在“归”阶段会调用completeWork处理Fiber节点。
 */
export const completeWork = (WorkInProgress: FiberNode) => {
    const current = WorkInProgress.alternate;
    const newProps = WorkInProgress.pendingProps;
    switch (WorkInProgress.tag) {
        case HostComponent:
            if (current !== null && WorkInProgress.stateNode) {
                // update
                /**
                 * 1. 判断props是否变化 { onClick: f } => { onDoubleClick: f }
                 * 2. 如果变就需要打flag （Update）
                 * 需要判断click/className/style属性....
                 * 判断过程比较简单，判断变了就调用，markUpdate函数 【to do】
                 */
                // 先放在updateQueue中，然后标记update，在commitWork中处理
                // workInProgress.updateQueue = [
                //     "className",
                //     "xx",
                //     "onClick",
                //     () => {},
                // ];
                // 变了的时候再去updateFiberProps，而不是直接updateFiberProps
                updateFiberProps(WorkInProgress.stateNode, newProps);
            } else {
                // mount时的 构建dom树
                const instance = createInstance(WorkInProgress.type, newProps);
                // 将Dom插入到树中
                appendAllChildren(instance, WorkInProgress);
                WorkInProgress.stateNode = instance;
            }
            bubbleProperties(WorkInProgress);
            break;
        case HostText:
            if (current !== null && WorkInProgress.stateNode) {
                // update
                const oldText = current.memorizedProps.content;
                const newText = newProps.content;
                if (oldText !== newText) {
                    markUpdate(WorkInProgress);
                }
            } else {
                // 构建dom树
                const instance = createTestInstance(newProps.content);
                WorkInProgress.stateNode = instance;
            }
            bubbleProperties(WorkInProgress);
            break;
        case HostRoot:
            bubbleProperties(WorkInProgress);
            break;
        case FunctionComponent:
            bubbleProperties(WorkInProgress);
            break;
        case Fragment:
            bubbleProperties(WorkInProgress);
            break;
        default:
            break;
    }
};

export function appendAllChildren(parent: Element, WorkInProgress: FiberNode) {
    //
    let node = WorkInProgress.child;

    while (node !== null) {
        if (node?.tag === HostComponent || node?.tag === HostText) {
            appendInitialChild(parent, node.stateNode);
        } else if (node?.child !== null) {
            node.child.return = node;
            node = node?.child;
            continue;
        }
        if (node === WorkInProgress) {
            return;
        }
        while (node.sibling === null) {
            if (node.return === null || node.return === WorkInProgress) {
                return;
            } else {
                node = node?.return;
            }
        }
        node.sibling.return = node.return;
        node = node.sibling;
    }
}

// 子fiber本身或者子fiber的子fiber有flag标记，则将此fiber的subtreeFlags标记为flag，
// 因为completeWork是从下往上的过程，所以在这个阶段去标记flag最合适
// 标记这个flag标记之后，commit阶段就可以根据flag和subtreeFlags决定是否向下变量这个fiber去创建真实dom
function bubbleProperties(WorkInProgress: FiberNode) {
    let subtreeFlags = NoFlags;
    let child = WorkInProgress.child;

    while (child !== null) {
        subtreeFlags |= child.subtreeFlags;
        subtreeFlags |= child.flags;

        child.return = WorkInProgress;
        child = child.sibling;
    }
    WorkInProgress.subtreeFlags |= subtreeFlags;
}

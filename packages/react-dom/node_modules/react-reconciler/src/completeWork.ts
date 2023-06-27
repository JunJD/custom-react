import {
    appendInitialChild,
    createInstance,
    createTestInstance,
} from "hostConfig";
import { FiberNode } from "./fiber";
import {
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
                 */
                // 这里应该时打flag（Update），而不是直接updateFiberProps---【todo】
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

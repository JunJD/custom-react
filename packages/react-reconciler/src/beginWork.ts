import { ReactElementType } from "shared/ReactTypes";
import { FiberNode } from "./fiber";
import { UpdateQueue, processUpdateQueue } from "./updateQueue";
import {
    Fragment,
    FunctionComponent,
    HostComponent,
    HostRoot,
    HostText,
} from "./workTags";
import { mountChildFibers, reconcileChildFibers } from "./childFibers";
import { renderWithHooks } from "./fiberHooks";
import { Lane } from "./fiberLanes";

/**
 * @description 该方法会根据传入的Fiber节点创建子Fiber节点，并将这两个Fiber节点连接起来
 */
export const beginWork = (WorkInProgress: FiberNode, renderLane: Lane) => {
    switch (WorkInProgress.tag) {
        case HostRoot:
            /**
             * @description 计算状态的最新值，创造子fiberNode
             */
            return updateHostRoot(WorkInProgress, renderLane);
        case HostComponent:
            /**
             * @description 创造子fiberNode
             */
            return updateHostComponent(WorkInProgress);
        case HostText:
            return null;
        case FunctionComponent:
            return updateFunctionComponent(WorkInProgress, renderLane);
        case Fragment:
            return updateFragment(WorkInProgress);
        default:
            if (__DEV__) {
                console.warn("未实现的tag");
            }
            return null;
            break;
    }
    return null;
};

function updateHostRoot(WorkInProgress: FiberNode, renderLane: Lane) {
    // 获取初始状态
    const baseState = WorkInProgress.memorizedState;
    // 获取更新队列
    const updateQueue = WorkInProgress.updateQueue as UpdateQueue<Element>;
    // 获取判定的状态？
    const pending = updateQueue.shared.pending;
    // 清空绑定的状态
    updateQueue.shared.pending = null;
    // 消费状态
    const { memorizedState } = processUpdateQueue(baseState, pending, renderLane);
    // 绑定新的状态
    WorkInProgress.memorizedState = memorizedState;
    // tag为hostRoot时 memorizedState就是子element
    const nextChildren = WorkInProgress.memorizedState;
    reconcileChildren(WorkInProgress, nextChildren);
    return WorkInProgress.child;
}

function updateHostComponent(workInProgress: FiberNode) {
    const nextProps = workInProgress.pendingProps;
    const nextChildren = nextProps.children;
    reconcileChildren(workInProgress, nextChildren);
    return workInProgress.child;
}

// function updateHostText(workInProgress: FiberNode) {
//     const nextProps = workInProgress.pendingProps;
//     const nextChildren = nextProps.children;
//     reconcileChildren(workInProgress, nextChildren);
//     return workInProgress.child;
// }

function updateFunctionComponent(workInProgress: FiberNode, renderLane: Lane) {
    const nextChildren = renderWithHooks(workInProgress, renderLane);
    reconcileChildren(workInProgress, nextChildren);
    return workInProgress.child;
}

function updateFragment(workInProgress: FiberNode) {
    const nextChildren = workInProgress.pendingProps;
    reconcileChildren(workInProgress, nextChildren);
    return workInProgress.child;
}

function reconcileChildren(
    WorkInProgress: FiberNode,
    children?: ReactElementType
) {

    const current = WorkInProgress.alternate;
    if (current !== null) {
    }

    if (current !== null) {
        // update
        WorkInProgress.child = reconcileChildFibers(
            WorkInProgress,
            current.child,
            children
        );
    } else {
        WorkInProgress.child = mountChildFibers(WorkInProgress, null, children);
    }
}

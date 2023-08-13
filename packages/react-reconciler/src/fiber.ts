import { Props, Key, Ref, ReactElementType } from "shared/ReactTypes";
import {
    Fragment,
    FunctionComponent,
    HostComponent,
    WorkTag,
} from "./workTags";
import { Flags, NoFlags } from "./fiberFlags";
import { Container } from "hostConfig";
import { Lane, Lanes, NoLane, NoLanes } from "./fiberLanes";
import { Effect } from "./fiberHooks";

export class FiberNode {
    tag: WorkTag;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stateNode: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: any;
    key: Key;
    ref: Ref;

    return: FiberNode | null;
    sibling: FiberNode | null;
    child: FiberNode | null;
    index: number;
    updateQueue: unknown;

    pendingProps: Props;
    memorizedProps: Props | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    memorizedState: any;
    // 双缓存机制下fiber节点指向的对应的另一个节点
    alternate: FiberNode | null;

    // 副作用
    flags: Flags;
    subtreeFlags: Flags;
    deletions: FiberNode[] | null;
    constructor(tag: WorkTag, pendingProps: Props, key: Key) {
        // 实例
        this.tag = tag;
        this.key = key;
        // HostComponent <div> ===> div Dom
        this.stateNode = null;
        // FunctionComponent ===> ()=>{}
        this.type = null;

        // 指向父fiberNode
        this.return = null;
        // 指向兄弟fiberNode
        this.sibling = null;
        // 指向子 fiberNode
        this.child = null;
        // 有多个同级的fiberNode index标识顺序
        this.index = 0;
        this.updateQueue = null;

        this.pendingProps = pendingProps;
        this.memorizedProps = null;
        this.memorizedState = null;

        // 与这个fiberNode相对应的fiberNode（双缓存机制）
        this.alternate = null;

        this.flags = NoFlags;
        this.subtreeFlags = NoFlags;
        this.deletions = null;
    }
}

export interface PendingPassiveEffect {
    unmount: Effect[];
    update: Effect[]
}

export class FiberRootNode {
    container: Container;
    // 指向第一个FiberNode节点
    current: FiberNode;
    // 指向更新完成以后的第一个fiberNode节点，...双缓存技术
    finishedWork: FiberNode | null;

    pendingLanes: Lanes;
    finishedLane: Lane;
    pendingPassiveEffects: PendingPassiveEffect;
    constructor(container: Container, hostRootFiber: FiberNode) {
        this.container = container;
        this.current = hostRootFiber;
        hostRootFiber.stateNode = this;
        this.finishedWork = null;
        this.pendingLanes = NoLanes;
        this.finishedLane = NoLane;
        this.pendingPassiveEffects = {
            unmount: [],
            update: []
        }
    }
}

export const createWorkInProgress = (
    current: FiberNode,
    pendingProps: Props
): FiberNode => {
    let workInProgress = current.alternate;

    if (workInProgress === null) {
        // mount
        workInProgress = new FiberNode(current.tag, pendingProps, current.key);
        workInProgress.type = current.type;
        workInProgress.stateNode = current.stateNode;

        workInProgress.alternate = current;
        current.alternate = workInProgress;
    } else {
        // update
        workInProgress.pendingProps = pendingProps;
        workInProgress.flags = NoFlags;
        workInProgress.subtreeFlags = NoFlags;
        workInProgress.deletions = null;
    }
    workInProgress.child = current.child;
    workInProgress.type = current.type;
    workInProgress.updateQueue = current.updateQueue;
    workInProgress.memorizedProps = current.memorizedProps;
    workInProgress.memorizedState = current.memorizedState;

    return workInProgress;
};

export function createFiberFormElement(element: ReactElementType) {
    const { type, key, props } = element;
    let fiberTag: WorkTag = FunctionComponent;
    if (typeof type === "string") {
        fiberTag = HostComponent;
    } else if (typeof type !== "function" && __DEV__) {
        console.warn("");
    }
    const fiber = new FiberNode(fiberTag, props, key);
    fiber.type = type;

    return fiber;
}

export function createFiberFormFragment(elements: any[], key: Key) {
    const fiber = new FiberNode(Fragment, elements, key);
    return fiber;
}

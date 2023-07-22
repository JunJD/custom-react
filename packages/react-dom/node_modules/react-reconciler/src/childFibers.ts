import { Props, ReactElementType } from "shared/ReactTypes";
import {
    FiberNode,
    createFiberFormElement,
    createWorkInProgress,
} from "./fiber";
import { REACT_ELEMNET_TYPE } from "shared/ReactSymbols";
import { HostText } from "./workTags";
import { ChildDeletion, Placement } from "./fiberFlags";

type ExiStingChildrenType = Map<string | number, FiberNode>;

function childReconciler(shouldTrackEffects: boolean) {
    function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
        if (!shouldTrackEffects) {
            return;
        } else {
            const deletions = returnFiber.deletions;
            if (deletions === null) {
                returnFiber.deletions = [childToDelete];
                returnFiber.flags |= ChildDeletion;
            } else {
                deletions?.push(childToDelete);
            }
        }
    }

    // 多节点=>单节点 diff时删除
    function deleteRemainingChildren(
        returnFiber: FiberNode,
        currentFirstChild: FiberNode | null
    ) {
        if (!shouldTrackEffects) {
            return;
        }
        let childToDelete = currentFirstChild;
        if (childToDelete !== null) {
            deleteChild(returnFiber, childToDelete);
            childToDelete = childToDelete.sibling;
        }
    }

    function reconcileSingleElement(
        returnFiber: FiberNode,
        currentFiber: FiberNode | null,
        element: ReactElementType
    ) {
        // update阶段

        work: while (currentFiber !== null) {
            const key = element.key;
            if (currentFiber.key === key) {
                if (element.$$typeof === REACT_ELEMNET_TYPE) {
                    if (currentFiber.type === element.type) {
                        // 可以复用
                        const existing = useFiber(currentFiber, element.props);
                        existing.return = returnFiber;
                        deleteRemainingChildren(
                            returnFiber,
                            currentFiber.sibling
                        );
                        return existing;
                    }
                    deleteRemainingChildren(returnFiber, currentFiber);
                    break work;
                } else {
                    if (__DEV__) {
                        throw new Error("还未实现的react类型");
                        break work;
                    }
                }
            } else {
                // 删除旧的
                deleteChild(returnFiber, currentFiber);
                currentFiber = currentFiber.sibling;
            }
        }

        // 根据这个element创建fiber
        const fiber = createFiberFormElement(element);
        fiber.return = returnFiber;
        return fiber;
    }

    function reconcileSingleTextNode(
        returnFiber: FiberNode,
        currentFiber: FiberNode | null,
        content?: string | number
    ) {
        while (currentFiber !== null) {
            if (currentFiber.tag === HostText) {
                // 类型没变可以复用
                const existing = useFiber(currentFiber, { content });
                existing.return = returnFiber;

                deleteRemainingChildren(returnFiber, currentFiber.sibling);
                return existing;
            }
            deleteChild(returnFiber, currentFiber);
            currentFiber = currentFiber.sibling;
        }
        const fiber = new FiberNode(HostText, { content }, null);
        fiber.return = returnFiber;

        return fiber;
    }

    function placeSingleChild(fiber: FiberNode) {
        if (shouldTrackEffects && fiber.alternate === null) {
            // 首屏渲染
            fiber.flags |= Placement;
            console.log("首屏渲染");
        }
        return fiber;
    }

    function reconcileChildrenArray(
        returnFiber: FiberNode,
        currentFirstFiberChild: FiberNode | null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        newChild: any[]
    ) {
        // 最后一个可复用fiber的current的index
        let lastPlacedIndex = 0;

        // 创建的最后一个fiber
        let lastNewFiber: FiberNode | null = null;

        // 创建的第一个fiber
        let firstNewFiber: FiberNode | null = null;

        // 1. 将current保存在map中
        const exiStingChildren: ExiStingChildrenType = new Map();
        let current = currentFirstFiberChild;
        while (current !== null) {
            const keyToUse = current.key !== null ? current.key : current.index;
            exiStingChildren.set(keyToUse, current);
            current = current.sibling;
        }

        // 2. 遍历newChild
        for (let i = 0; i < newChild.length; i++) {
            // 是否可复用
            // 根据key从Map中获取current fiber , 如果不存在current fiber，则没有复用的可能
            // 接下来分情况讨论：
            // element是HostTest，current fiber是吗？
            // element是ReactElement， current fiber是吗？
            const after = newChild[i];
            const newFiber = updateFormMap(
                returnFiber,
                exiStingChildren,
                i,
                after
            );

            // xxxxx false null
            if (newFiber === null) {
                continue;
            }
            //3. 标记移动还是插入
            /**
             * 移动的判断依据：*****************
             */

            newFiber.index = i;
            newFiber.return = returnFiber;

            if (lastNewFiber === null) {
                lastNewFiber = newFiber;
                firstNewFiber = newFiber;
            } else {
                lastNewFiber.sibling = newFiber;
                lastNewFiber = lastNewFiber.sibling;
            }

            if (!shouldTrackEffects) {
                continue;
            }

            const current = newFiber.alternate;

            if (current !== null) {
                const oldIndex = current.index;
                console.log(oldIndex, i, lastPlacedIndex, "oldIndex");
                if (oldIndex < lastPlacedIndex) {
                    console.log("移动==>", newFiber);
                    // 移动
                    newFiber.flags |= Placement;
                    continue;
                } else {
                    lastPlacedIndex = oldIndex;
                }
            } else {
                // mount
                newFiber.flags |= Placement;
            }
        }
        // 4. 删除Map中剩下的标记为删除
        exiStingChildren.forEach((fiber) => {
            deleteChild(returnFiber, fiber);
        });
        return firstNewFiber;
    }

    function updateFormMap(
        // 暂未使用
        _returnFiber: FiberNode,
        exiStingChildren: ExiStingChildrenType,
        index: number,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        element: any
    ): FiberNode | null {
        const keyToUse = element.key !== null ? element.key : index;
        const before = exiStingChildren.get(keyToUse);
        if (typeof element === "string" || typeof element === "number") {
            if (before) {
                if (before.tag === HostText) {
                    exiStingChildren.delete(keyToUse);
                    return useFiber(before, { content: element + "" });
                }
            }
            return new FiberNode(HostText, { content: element + "" }, null);
        }
        if (typeof element === "object" && element !== null) {
            switch (element.$$typeof) {
                case REACT_ELEMNET_TYPE:
                    if (before) {
                        // 相同的fiber类型就复用，后续再对比key和index进行diff
                        if (before.type === element.type) {
                            exiStingChildren.delete(keyToUse);
                            return useFiber(before, element.props);
                        }
                    }
                    return createFiberFormElement(element);
            }
            // todo
            if (Array.isArray(element) && __DEV__) {
                console.warn("还未实现数组类型的children");
            }
        }
        return null;
    }

    return function reconcileChildFibers(
        returnFiber: FiberNode,
        currentFiber: FiberNode | null,
        newChild?: ReactElementType
    ) {
        if (typeof newChild === "object" && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMNET_TYPE:
                    return placeSingleChild(
                        reconcileSingleElement(
                            returnFiber,
                            currentFiber,
                            newChild
                        )
                    );
                    break;

                default:
                    break;
            }
            // newChild是数组
            if (Array.isArray(newChild)) {
                return reconcileChildrenArray(
                    returnFiber,
                    currentFiber,
                    newChild
                );
            }
        }

        if (typeof newChild === "string" || typeof newChild === "number") {
            const child = placeSingleChild(
                reconcileSingleTextNode(returnFiber, currentFiber, newChild)
            );
            return child;
        }

        if (currentFiber !== null) {
            // 兜底删除
            deleteRemainingChildren(returnFiber, currentFiber);
        }

        if (__DEV__) {
            console.warn("no 实现的reconcile类型");
        }

        return null;
    };
}

function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
}

export const reconcileChildFibers = childReconciler(true);
export const mountChildFibers = childReconciler(false);

import { Props, ReactElementType } from "shared/ReactTypes";
import {
    FiberNode,
    createFiberFormElement,
    createWorkInProgress,
} from "./fiber";
import { REACT_ELEMNET_TYPE } from "shared/ReactSymbols";
import { HostText } from "./workTags";
import { ChildDeletion, Placement } from "./fiberFlags";

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

    function reconcileSingleElement(
        returnFiber: FiberNode,
        currentFiber: FiberNode | null,
        element: ReactElementType
    ) {
        // update阶段

        work: if (currentFiber !== null) {
            const key = element.key;
            if (currentFiber.key === key) {
                if (element.$$typeof === REACT_ELEMNET_TYPE) {
                    if (currentFiber.type === element.type) {
                        // 可以复用
                        const existing = useFiber(currentFiber, element.props);
                        existing.return = returnFiber;
                        return existing;
                    }
                    deleteChild(returnFiber, currentFiber);
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
        if (currentFiber !== null) {
            if (currentFiber.tag === HostText) {
                const existing = useFiber(currentFiber, { content });
                existing.return = returnFiber;

                return existing;
            }
            deleteChild(returnFiber, currentFiber);
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
        }

        if (typeof newChild === "string" || typeof newChild === "number") {
            const child = placeSingleChild(
                reconcileSingleTextNode(returnFiber, currentFiber, newChild)
            );
            return child;
        }

        if (currentFiber !== null) {
            deleteChild(returnFiber, currentFiber);
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

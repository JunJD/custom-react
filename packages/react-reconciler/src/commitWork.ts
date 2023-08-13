import {
    Container,
    Instance,
    TextInstance,
    appendChildToContainer,
    insertChildToContainer,
    removeChild,
} from "hostConfig";
import { FiberNode, FiberRootNode, PendingPassiveEffect } from "./fiber";
import {
    ChildDeletion,
    Flags,
    MutationMask,
    NoFlags,
    PassiveEffect,
    Placement,
    Update,
} from "./fiberFlags";
import {
    Fragment,
    FunctionComponent,
    HostComponent,
    HostRoot,
    HostText,
} from "./workTags";
import { updateFiberProps } from "react-dom/src/SyntheticEvent";
import { Effect, FCUpateQueue } from "./fiberHooks";
import { HookHasEffect } from "./hookEffectTag";

let nextEffect: FiberNode | null = null;

export const commitMutationEffects = (finishedWork: FiberNode, root: FiberRootNode) => {
    nextEffect = finishedWork;
    while (nextEffect !== null) {
        // 向下遍历
        const child: FiberNode | null = nextEffect.child;

        if (
            // (nextEffect.subtreeFlags & MutationMask) !== NoFlags &&
            (nextEffect.subtreeFlags & MutationMask | PassiveEffect) !== NoFlags &&
            child !== null
        ) {
            // 子节点有可能存在subtreeFlags
            nextEffect = child;
        } else {
            // 找到底了或者没有subtreeFlags
            // 向上遍历
            up: while (nextEffect !== null) {
                commitMutationEffectsOnFiber(nextEffect, root);
                const sibling: FiberNode | null = nextEffect.sibling;
                if (sibling !== null) {
                    nextEffect = sibling;
                    break up;
                }
                nextEffect = nextEffect.return;
            }
        }
    }
};

function commitMutationEffectsOnFiber(finishedWork: FiberNode, root: FiberRootNode) {
    const flags = finishedWork.flags;
    if ((flags & Placement) !== NoFlags) {
        // 存在Placement操作
        commitPlacement(finishedWork);
        finishedWork.flags &= ~Placement;
    }

    if ((flags & Update) !== NoFlags) {
        commitUpdate(finishedWork);
        finishedWork.flags &= ~Update;
    }
    if ((flags & ChildDeletion) !== NoFlags) {
        const deletions = finishedWork.deletions;
        if (deletions !== null) {
            for (const childToDelete of deletions) {
                commitDeletion(childToDelete, root);
            }
        }
        finishedWork.flags &= ~ChildDeletion;
    }
    if ((flags & PassiveEffect) !== NoFlags) {
        // 收集回掉
        commitPassiveEffect(finishedWork, root, 'update')
        finishedWork.flags &= ~flags
    }
}

function commitPassiveEffect(fiber: FiberNode, root: FiberRootNode, type: keyof PendingPassiveEffect) {
    if (fiber.tag !== FunctionComponent || (type === 'update' && (fiber.flags & PassiveEffect) === NoFlags)) {
        return
    }
    const updateQueue = fiber.updateQueue as FCUpateQueue<any>
    if (updateQueue !== null) {
        if (updateQueue.lastEffect === null && __DEV__) {
            console.error('当FC存在PassiveEffect flag时, 不应该不存在effect')
        }
        root.pendingPassiveEffects[type].push(updateQueue.lastEffect!)
    }

}

export function commitHookEffectList(flags: Flags, lastEffect: Effect, callback: (effect: Effect) => void) {
    let effect = lastEffect.next as Effect
    do {
        if ((effect.tag & flags) === flags) {
            callback(effect)
        }
        effect = effect.next as Effect
    } while (effect !== lastEffect.next);
}

export function commitHookEffectListUnmount(flags: Flags, lastEffect: Effect) {
    commitHookEffectList(flags, lastEffect, (effect) => {
        const destory = effect.destory
        if (typeof destory === 'function') {
            destory()
        }
        effect.tag &= ~HookHasEffect
    })
}

export function commitHookEffectListDestory(flags: Flags, lastEffect: Effect) {
    commitHookEffectList(flags, lastEffect, (effect) => {
        const destory = effect.destory
        if (typeof destory === 'function') {
            destory()
        }
    })
}

export function commitHookEffectListCreate(flags: Flags, lastEffect: Effect) {
    commitHookEffectList(flags, lastEffect, (effect) => {
        const create = effect.create
        if (typeof create === 'function') {

            effect.destory = create()
        }
    })
}


function commitPlacement(finishedWork: FiberNode) {
    // 需要知道父节点
    // 需要知道fiber对应的DOM节点
    if (__DEV__) {
        console.warn("执行placement操作");
    }

    // parent DOM
    const hostParent = getHostParent(finishedWork);

    /**
     * Placement同时对应
     * -- 移动
     * -- 插入
     * 对于插入操作，之前对应的DOM方法是parentNode.appendChild,
     * 现在为了实现移动操作，需要支持parentNode.insertBefore
     */

    // parentNode.insertBefore需要找到[目标兄弟Host节点]，要考虑2个因素
    // 1. 可能并不是目标fiber的直接兄弟节点
    // 2. 不是稳定的Host节点不能作为[目标兄弟Host节点]
    const sibling = getHostSibling(finishedWork);

    if (hostParent !== null) {
        // 找到finishedwork的dom append parent Dom中
        inertOrAppendPlacementNodeIntoContainer(
            finishedWork,
            hostParent,
            sibling
        );
    }
}

function getHostSibling(fiber: FiberNode) {
    let node: FiberNode = fiber;
    // eslint-disable-next-line no-constant-condition
    findSibling: while (true) {
        while (node.sibling === null) {
            const parent = node.return;
            if (
                parent === null ||
                parent.tag === HostComponent ||
                parent.tag === HostRoot
            ) {
                return null;
            }
            node = parent;
        }

        node.sibling.return = node.return;
        node = node.sibling;
        // 直接sibling不是目标sibling继续向下找
        while (node.tag !== HostText && node.tag !== HostComponent) {
            // 向下遍历，找子孙节点
            if ((node.flags & Placement) !== NoFlags) {
                // 节点是不稳定的
                continue findSibling;
            }
            if (node.child === null) {
                continue findSibling;
            } else {
                node.child.return = node;
                node = node.child;
            }
        }

        if ((node.flags & Placement) === NoFlags) {
            return node.stateNode;
        }
    }
}

function recordHostChildToDelete(
    childrenToDelete: FiberNode[],
    unmountFiber: FiberNode
) {
    // 1.找到第一个rootHost节点

    const lastOne = childrenToDelete[childrenToDelete.length - 1];

    if (!lastOne) {
        childrenToDelete.push(unmountFiber);
    } else {

        // 2.每找到一个Host节点，判断一下第一步找到的节点的兄弟节点(同级)
        let node = lastOne.sibling;
        while (node !== null) {
            if (unmountFiber === node) {
                childrenToDelete.push(unmountFiber);
            }
            node = node.sibling;
        }
    }
}

function commitDeletion(childToDelete: FiberNode, root: FiberRootNode) {
    const rootChildToDelete: FiberNode[] = [];
    // let rootHostNode: FiberNode | null = null;
    commitNestedComponent(childToDelete, (unmountFiber) => {
        switch (unmountFiber.tag) {
            case HostComponent:
                recordHostChildToDelete(rootChildToDelete, unmountFiber);
                // if (rootHostNode === null) {
                //     rootHostNode = unmountFiber;
                // }
                // Todo 解绑ref
                return;
            case HostText:
                recordHostChildToDelete(rootChildToDelete, unmountFiber);
                return;
            case Fragment:
                break;
            case FunctionComponent:
                // TODO useEffect unmount、解绑ref
                commitPassiveEffect(unmountFiber, root, 'unmount')
                break;
            default:
                if (__DEV__) {
                    console.warn("未处理的unmount类型");
                }
                return;
        }
    });

    if (rootChildToDelete.length !== 0) {
        const hostParent = getHostParent(childToDelete);
        if (hostParent !== null) {
            rootChildToDelete.forEach((node) => {
                removeChild(hostParent, node.stateNode);
            });
        }
    }
    childToDelete.return = null;
    childToDelete.child = null;
    // 递归子树
}

function commitNestedComponent(
    root: FiberNode,
    onCommitUnMount: (fiber: FiberNode) => void
) {
    // 深度优先遍历的过程
    let node = root;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        onCommitUnMount(node);
        // 向下遍历的过程
        if (node.child !== null) {
            node.child.return = node;
            node = node.child;
            continue;
        }
        if (node === root) {
            return;
        }
        while (node.sibling === null) {
            if (node.return === null || node.return === root) {
                return;
            }
            node = node.return;
        }
        node.sibling.return = node.return;
        node = node.sibling;
    }
}

function commitUpdate(finishedWork: FiberNode) {
    // 需要知道父节点
    // 需要知道fiber对应的DOM节点
    if (__DEV__) {
        console.warn("执行Update操作");
    }
    switch (finishedWork.tag) {
        case HostText:
            // eslint-disable-next-line no-case-declarations
            const text = finishedWork.memorizedProps.content;
            commitTextUpdate(finishedWork.stateNode, text);
            break;
        case HostComponent:
            updateFiberProps(finishedWork.stateNode, finishedWork.pendingProps);
            break;
        default:
            if (__DEV__) {
                console.warn("未实现的update类型");
            }
            break;
    }
    const hostParent = getHostParent(finishedWork);
    if (hostParent !== null) {
        // 找到finishedwork的dom append parent Dom中
        inertOrAppendPlacementNodeIntoContainer(finishedWork, hostParent);
    }
}

function commitTextUpdate(textInstance: TextInstance, content: string) {
    textInstance.textContent = content;
}

function getHostParent(fiber: FiberNode): Container | null {
    let parent = fiber.return;

    while (parent) {
        const parentTag = parent.tag;
        if (parentTag === HostComponent) {
            return parent.stateNode as Container;
        }
        if (parentTag === HostRoot) {
            return (parent.stateNode as FiberRootNode).container;
        }
        parent = parent.return;
    }
    if (__DEV__) {
        console.warn("未找到host parent");
    }
    return null;
}

function inertOrAppendPlacementNodeIntoContainer(
    finishedWork: FiberNode,
    hostParent: Container,
    before?: Instance
) {
    if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
        if (before) {
            insertChildToContainer(finishedWork.stateNode, hostParent, before);
        } else {
            appendChildToContainer(hostParent, finishedWork.stateNode);
        }

        return;
    }

    const child = finishedWork.child;
    if (child !== null) {
        inertOrAppendPlacementNodeIntoContainer(child, hostParent);
        let sibling = child.sibling;

        while (sibling !== null) {
            inertOrAppendPlacementNodeIntoContainer(sibling, hostParent);
            sibling = sibling.sibling;
        }
    }
}

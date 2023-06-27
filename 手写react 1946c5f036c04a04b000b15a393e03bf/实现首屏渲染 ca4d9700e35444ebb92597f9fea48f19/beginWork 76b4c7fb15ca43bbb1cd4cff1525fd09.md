# beginWork

### 下图是beginwork工作主函数

```tsx
/**
 * @description 该方法会根据传入的Fiber节点创建子Fiber节点，并将这两个Fiber节点连接起来
 */
export const beginWork = (WorkInProgress: FiberNode) => {
    switch (WorkInProgress.tag) {
        case HostRoot:
            /**
             * @description 计算状态的最新值，创造子fiberNode
             */
            return updateHostRoot(WorkInProgress);
        case HostComponent:
            /**
             * @description 创造子fiberNode
             */
            return updateHostComponent(WorkInProgress);
        case HostTest:
            return null;
        case FunctionComponent:
            return updateFunctionComponent(WorkInProgress);
        default:
            if (__DEV__) {
                console.warn("未实现的tag");
            }
            break;
    }
    return null;
};
```

### 会对不同得tag区分处理

<aside>
📌 tag是构造FiberNode必传的属性，主要用于区分FiberNode是根组件，原生标签，text字符、普通组件；

</aside>

1. 如下对于`根组件HostRoot`会先计算状态的最新值，再创造子fiberNode

```tsx
function updateHostRoot(WorkInProgress: FiberNode) {
    // 获取初始状态
    const baseState = WorkInProgress.memorizedState;
    // 获取更新队列
    const updateQueue = WorkInProgress.updateQueue as UpdateQueue<Element>;
    // 获取判定的状态？
    const pending = updateQueue.shared.pending;
    // 清空绑定的状态
    updateQueue.shared.pending = null;
    // 消费状态
    const { memorizedState } = processUpdateQueue(baseState, pending);
    // 绑定新的状态
    WorkInProgress.memorizedState = memorizedState;
    // tag为hostRoot时 memorizedState就是子element
    const nextChildren = WorkInProgress.memorizedState;
    reconcileChildren(WorkInProgress, nextChildren);
    return WorkInProgress.child;
}
```

计算状态的首先是取当前工作的fiberNode的memorizedState，也就是baseState，再获取当前fiberNode的更新队列

<aside>
📌 这一块的知识在hooks之前还无法深入，目前只能了解到是类发布订阅中心的作用

</aside>

并取更新队列中的pending状态

<aside>
📌 这里应该是程序员直接定义的一些改变状态变更的dispatch或者setstate以及初始化时的element

</aside>

最后会将初始状态baseState，和操作pending进行消费，得出最新的状态。

随后需要根据子元素和当前fiberNode计算出 子fiberNode，在`根组件HostRoot`中获取的最新状态其实就是根组件的子元素（ReactElementType类型，一般为<App />）

1. 而对于`原生标签HostComponent`会直接计算子fiberNode

从props中取出children，也就是子元素，同样和当前fiberNode一起计算出子fiberNode

```tsx
function updateHostComponent(workInProgress: FiberNode) {
    const nextProps = workInProgress.pendingProps;
    const nextChildren = nextProps.children;
    reconcileChildren(workInProgress, nextChildren);
    return workInProgress.child;
}
```

1. 对于普通函数组件也会计算出fiberNode组件

从当前fiberNode取出type，type是babel解析jsx生成的类型，比如函数组件type就是：

```
ƒ APP() {
return /*#**PURE***/(0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxDEV)("div", {
children: "1212"
}, void 0, false, {
fileName: _jsxFileName,
lineNumber: 6,
colu…
```

```tsx
function renderWithHooks(workInProgress: FiberNode) {
    const Component = workInProgress.type;
    const props = workInProgress.memorizedProps;
    return Component(props);
}

function updateFunctionComponent(workInProgress: FiberNode) {
    const nextChildren = renderWithHooks(workInProgress);
    reconcileChildren(workInProgress, nextChildren);
    return workInProgress.child;
}
```

当创建完子节点之后，整个操作将进入到归阶段，也就是completeWork
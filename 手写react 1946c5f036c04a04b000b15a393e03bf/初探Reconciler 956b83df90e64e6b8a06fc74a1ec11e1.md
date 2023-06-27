# 初探Reconciler

[fiberNode结构](%E5%88%9D%E6%8E%A2Reconciler%20956b83df90e64e6b8a06fc74a1ec11e1/fiberNode%E7%BB%93%E6%9E%84%20a648a76f27bb406c9f513918c349bec9.md)

### wookLoop

`wookLoop` 中有两个轮询执行的函数体，第一个循环目的是调用`beginWork` 去处理一些事情，此循环有一个全局状态：`workInProgress` ，类型是fiberNode，代表正在处理中的`workInProgress` 。

 `beginWork` 接受`workInProgress` 执行并返回一个fiberNode，并将全局状态标记`workInProgress` 指向这个返回的iberNode节点，往复循环，直到下一个fiberNode节点为null。

当下一个fiberNode节点为null时，开启第二个轮询执行，此次轮询执行也记录了一个全局状态`node` ，同样是fiberNode类型，调用`completeWork` 执行一些任务之后，会去找node的sibing节点，如果有的话，则跳出这个轮询进入外层的轮询，并且会把`workInProgress` 指向sibing，让`beginWork` 去处理sibing，如若没有sibing了，也就是没有兄弟节点了，则不会跳出第二个轮询，而是将`node` 指向`node` 的父节点然后去执行`completeWork` ，如果没有兄弟节点也没有父亲节点，则停止工作。 

### beginWork

beginWork是wookLoop中的一个重要步骤，它负责创建React元素树中的fiber节点，并将它们连接成一个树形结构。在这个过程中，beginWork会基于上一次渲染保存的fiber节点进行比较，以决定哪些节点需要更新，哪些节点可以复用，哪些节点需要被删除等等。

1. completeWork

completeWork是wookLoop中的最后一步，它负责完成fiber节点的更新和渲染。在这个过程中，completeWork会将新生成的React元素树与旧的React元素树进行比较，最终确定哪些节点需要更新，哪些节点可以复用，哪些节点需要被删除等等。完成之后，completeWork会将新的React元素树提交到渲染管道中，更新UI界面。
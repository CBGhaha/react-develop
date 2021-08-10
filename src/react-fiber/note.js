// react 的协调流程

/** 1
 *
 * react.render 会创建一个根Fiber rootFiber
 * 调用 scheduleRoot 开始协调rootFiber
 * */

/** 2
 * scheduleRoot 定义了 nextUnitOfWork --> 下一次更新的工作单元
 * requestIdleCallback函数一直在浏览器空余时间调用 workLoop
 * workLoop 会判断浏览器是否有剩余时间来执行 performUnitOfWork
*/

/** 3
 * performUnitOfWork 执行工作单元 执行对象是fiber
 * 调用 beginWork
 * */

/** 4
 * beginWork
 * 会根据fiber的tag（fiber的tag由虚拟节点type字段而来）
 * 调用不同节点类型的update函数
 * updateHostRoot // 根rootfiber
 * updateHostText  // 文本节点类型的fiber
 * updateHost      // 普通dom节点的fiber
 * updateClassComponent // class组件的fiber
 * updateFunctionComponent // 函数组件的fiber
 *
 * 这些update函数都会做两件事情
 * 1.创建fiber对应的dom实例或组件实例，放在fiber的stateNode属性上（除了根rootfiber和函数组件的fiber外，因为它们没有dom也无法new实例化）
 * 2.获取组件新的子虚拟节点 然后调用 reconcileChildren 协调子节点
 * */

/** 5
 * reconcileChildren
 * 在这里根据子节点的虚拟dom生成子节点的fiber fiber链表结构也在此形成
 * 可以知道这里的children都是来自此次新的props形成的 只要保证传入的props是新的 那么就会依次生成新的树
 * 至于这个props会是由那个fiber去update 不是那么重要，如果是currentFiber当然最好，
 * 但currentFiber已经和当前真实dom正确映射 不太好操作currentFiber 去diff
 *
 *
 *
 *
 * */


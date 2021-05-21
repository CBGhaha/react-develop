// 从根节点开始渲染 和调度
/**
 * 当有更新出现，React会生成一个工作中的Fiber树，并对工作中Fiber树上每一个Fiber节点进行计算和diff，完成计算工作（React称之为渲染步骤）之后，再更新DOM（提交步骤）。
 * 两个阶段
 * diff阶段 对比新旧的虚拟DOM进行增量更新或创建
 * 这个阶段比较花时间，可以对任务拆分，中断和继续
 * commit阶段，进行DOM更新创建阶段，不可中断
*/
import { TAG_ROOT, ELEMENT_TEXT, TAG_HOST, TAG_TEXT, TAG_CLASS, PLACEMENT, DELETION, UPDATE, TAG_FUNCTION_COMPONENT } from './constant';
import createDOM, { updateDom } from './dom';
import { Update, UpdateQueue } from './updateQueue';
let nextUnitOfWork = null; // 下个调度任务
let workInProgressRoot = null; // 此次更新后新的fiber树
let currentRoot = null; // 当前页面中真实dom对应的fiber树
let deletions = []; // 被删除的fiber
let workInProgressFiber = null; // 正在工作中的fiber
let hookIndex = 0; // hooks索引 源码中不是通过索引来获取当前正在执行的hooks的 而是fiber的hooks是一个单向链表结构 执行完一个hook后,将全局变量workInProgressHook指向hook

export default function scheduleRoot(rootFiber) {
  if (currentRoot && currentRoot.alternate) { // 第二次之后的更新
    workInProgressRoot = currentRoot.alternate;
    if (rootFiber) workInProgressRoot.props = rootFiber.props;
    workInProgressRoot.alternate = currentRoot;
  } else if (currentRoot) { // 第一次更新 （将新旧fiber树节点通过alternate一一对应关联起来）
    if (rootFiber) {
      rootFiber.alternate = currentRoot;
      workInProgressRoot = rootFiber;
    } else {
      workInProgressRoot = {
        ...currentRoot,
        alternate: currentRoot
      };
    }

  } else { // 第一次创建 （创建整个fiber）
    workInProgressRoot = rootFiber;
  }
  workInProgressRoot.firstEffect = null;
  workInProgressRoot.nextEffect = null;
  workInProgressRoot.lastEffect = null;
  nextUnitOfWork = workInProgressRoot;
}
// 循环执行工作
function workLoop(deadline) {
  let shouldYield = false; //是否让出控制权
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;// 如果时间不够了 则退出循环
  }
  // 如果任务没有完成 则在下一个时间片内继续执行
  if (!nextUnitOfWork && workInProgressRoot) {
    console.log('render阶段结束');
    commitRoot();
  }
  // 一致循环调度下去
  requestIdleCallback(workLoop, { timeout: 500 });
}
// react 告诉浏览器 在空闲时执行
// 有一个优先级的概念 expirationTime
requestIdleCallback(workLoop, { timeout: 500 });

function performUnitOfWork(currentFiber) {
  beginWork(currentFiber); // 每个fiber都需要走的流程
  if (currentFiber.child) {
    return currentFiber.child; // 返回当前fiber的子fiber作为下一个任务执行
  }
  // 如果没有子fiber 说明这个fiber已经遍历完成（其所有字节点已经创建完成）
  let $currentFiber = currentFiber;
  while ($currentFiber) {

    completeUnitOfWork($currentFiber);
    // 是否有兄弟fiber？
    if ($currentFiber.sibling) {
      return $currentFiber.sibling; // 返回当前fiber的兄弟fiber作为下一个任务执行
    }
    $currentFiber = $currentFiber.return;
  }
}

/**
* 1:创建真实dom元素
* 2:创建子fiber
*/
function beginWork(currentFiber) {
  console.log('beginWork:', currentFiber);
  if (currentFiber.tag === TAG_ROOT) {
    updateHostRoot(currentFiber);
  } else if (currentFiber.tag === TAG_TEXT) {
    updateHostText(currentFiber);
  } else if (currentFiber.tag === TAG_HOST) {
    updateHost(currentFiber);
  } else if (currentFiber.tag === TAG_CLASS) {
    updateClassComponent(currentFiber);
  } else if (currentFiber.tag === TAG_FUNCTION_COMPONENT) {
    updateFunctionComponent(currentFiber);
  }

}
function updateFunctionComponent(currentFiber) {
  workInProgressFiber = currentFiber;
  hookIndex = 0;
  workInProgressFiber.hooks = [];
  const newElement = currentFiber.type(currentFiber.props);
  const newChildren = [newElement];
  // 调度
  reconcileChildren(currentFiber, newChildren);
}

function updateClassComponent(currentFiber) {
  if (!currentFiber.stateNode) {
    const ComponentClass = currentFiber.type;
    currentFiber.stateNode = new ComponentClass(currentFiber.props); // stateNode指向组件的实例
    currentFiber.stateNode.internalFiber = currentFiber; // 组件实例的internalFiber指向fiber
    currentFiber.updateQueue = new UpdateQueue();
  }
  // 更新state
  currentFiber.stateNode.state = currentFiber.updateQueue.forceUpdates(currentFiber.stateNode.state);
  // 或许新的虚拟dom
  const newElement = currentFiber.stateNode.render();
  const newChildren = [newElement];
  // 调度
  reconcileChildren(currentFiber, newChildren);

}
function updateHostRoot(currentFiber) {
  let newChildren = currentFiber.props.children; // 子虚拟dom
  reconcileChildren(currentFiber, newChildren); // 创建子fiber
}
function updateHostText(currentFiber) {
  if (!currentFiber.stateNode) {
    currentFiber.stateNode = createDOM(currentFiber);
  }
}
function updateHost(currentFiber) {
  if (!currentFiber.stateNode) {
    currentFiber.stateNode = createDOM(currentFiber);
  }
  let newChildren = currentFiber.props.children; // 子虚拟dom
  reconcileChildren(currentFiber, newChildren);
}

// 根据 children的虚拟dom创建子fiber
function reconcileChildren(currentFiber, newChildren) {
  let newChildIndex = 0;
  let oldFiber = currentFiber.alternate && currentFiber.alternate.child; // 找到子虚拟dom对应的 currentfiber
  let prevSibling;
  while (newChildIndex < newChildren.length || oldFiber) {
    let newChild = newChildren[newChildIndex];
    let newFiber;
    const sameType = oldFiber && newChild.type === oldFiber.type; // 判断现在的fiber节点和更新的虚拟dum可惜是否一致
    if (sameType) {
      if (oldFiber.alternate) { // currentfiber的旧fiber
        newFiber = oldFiber.alternate;
        newFiber.props = newChild.props;
        newFiber.alternate = oldFiber;
        newFiber.effectTag = UPDATE;
        newFiber.nextEffect = null;
      } else {
        newFiber = {
          tag: oldFiber.tag,
          type: oldFiber.type,
          props: newChild.props,
          stateNode: oldFiber.stateNode,
          return: currentFiber,
          alternate: oldFiber,
          updateQueue: oldFiber.updateQueue || new UpdateQueue(),
          effectTag: UPDATE, // 更新
          nextEffect: null
        };
      }
    } else { // 创建新fiber
      if (newChild) {
        let tag;
        if (newChild.type === ELEMENT_TEXT) {
          tag = TAG_TEXT;
        } else if (typeof newChild.type === 'string') {
          tag = TAG_HOST;
        } else if (typeof newChild.type === 'function' && newChild.type.prototype.isReactComponent) {
          tag = TAG_CLASS;
        } else if (typeof newChild.type === 'function' && !newChild.type.prototype.isReactComponent) {
          tag = TAG_FUNCTION_COMPONENT;
        }
        newFiber = {
          tag, // fiber类型
          type: newChild.type, // 虚拟dom类型
          props: newChild.props,
          stateNode: null, // 真实dom
          return: currentFiber, // 父fiber
          effectTag: PLACEMENT, // 副作用
          nextEffect: null
        };
      }
      if (oldFiber) {
        oldFiber.effectTag = DELETION;
        deletions.push(oldFiber);
      }
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }
    if (newFiber) {
      if (newChildIndex === 0) {
        currentFiber.child = newFiber;
      } else {
        prevSibling.sibling = newFiber;
      }
      prevSibling = newFiber;
    }
    newChildIndex ++;
  }
}

/**
 *                         Fiber
 *          Fiber-1                  Fiber-2
 *  Fiber-1-1  Fiber-1-2             Fiber-2-1
 *
 *  1-1 => 1-2 => 1 => 2-1 => 2 => Fiber
 *  如何不通过递归来做到深度先序遍历 收集所有effect 并形成一个effect的单链表？
 *  fiber通过sibling和return 将各个fiber关联起来成为一个fiber树 做到树的遍历是可暂停可恢复的
 *  当前遍历到当前fiber节点的时（其所有子节点已遍历完成），此时将自己的子节点effect汇交给自己的父节点
 *  并将自己上交给父节点
 *
*/
// 用于所有的子fiber完成后收集effect
function completeUnitOfWork(currentFiber) {
  const returnFiber = currentFiber.return;
  if (returnFiber) {
    // 把自己的儿子挂在父亲上
    if (!returnFiber.firstEffect) {
      returnFiber.firstEffect = currentFiber.firstEffect;
    }

    if (currentFiber.lastEffect) {
      if (returnFiber.lastEffect && returnFiber.firstEffect) {
        returnFiber.lastEffect.nextEffect = currentFiber.firstEffect;
      }
      returnFiber.lastEffect = currentFiber.lastEffect;
      // returnFiber.lastEffect = currentFiber.lastEffect;
    }

    // 把自己挂在父亲上
    const effectTag = currentFiber.effectTag;
    if (effectTag) { // 自己有副作用
      if (returnFiber.lastEffect) { // 存在哥哥
        returnFiber.lastEffect.nextEffect = currentFiber; // 哥哥的nextEffetc指向弟弟
      } else if (!returnFiber.firstEffect) {
        returnFiber.firstEffect = currentFiber; // 自己是长子
      }
      returnFiber.lastEffect = currentFiber; // 当前最小的儿子指向自己

    }
  }
}


function commitRoot() {
  deletions.forEach(commitWork);
  let currentFiber = workInProgressRoot.firstEffect;
  while (currentFiber) {
    commitWork(currentFiber);
    currentFiber = currentFiber.nextEffect;
  }
  deletions = [];
  currentRoot = workInProgressRoot;
  workInProgressRoot = null;
}

function commitWork(currentFiber) {
  let returnFiber = currentFiber.return;
  while (returnFiber && ![TAG_HOST, TAG_ROOT].includes(returnFiber.tag)) {
    returnFiber = returnFiber.return;
  }

  let returnDom = returnFiber.stateNode;
  if (currentFiber.effectTag === PLACEMENT && [TAG_HOST, TAG_ROOT, TAG_TEXT].includes(currentFiber.tag)) { // 新增节点
    returnDom.appendChild(currentFiber.stateNode);
    console.log('dom-PLACEMENT:');
  } else if (currentFiber.effectTag === DELETION) {
    commitDeletion(currentFiber, returnDom);
    console.log('dom-DELETION:');
  } else if (currentFiber.effectTag === UPDATE) {
    console.log('dom-UPDATE:');
    if (currentFiber.tag === TAG_TEXT) {
      if (currentFiber.alternate.props.text !== currentFiber.props.text);
      currentFiber.stateNode.textContent = currentFiber.props.text;
    } else if (currentFiber.tag === TAG_ROOT || currentFiber.tag === TAG_HOST) {
      updateDom(currentFiber.stateNode, currentFiber.alternate.props, currentFiber.props);
    }


  }
  currentFiber.effectTag = null;
}

// 删除真实dom
function commitDeletion(currentFiber, returnDom) {
  if ([TAG_HOST, TAG_ROOT, TAG_TEXT].includes(currentFiber.tag)) {
    returnDom.removeChild(currentFiber.stateNode);
  } else {
    commitDeletion(currentFiber.child, returnDom);
  }
}
/**
    workInProgressFiber = currentFiber;
    hookIndex = 0;
    workInProgressFiber.hooks = [];
 *
 *
*/

export function useReducer(reducer, initialValue) {
  //
  let currentHook = workInProgressFiber && workInProgressFiber.alternate && workInProgressFiber.alternate.hooks && workInProgressFiber.alternate.hooks[hookIndex];
  // true => workInProgressFibe为新创建并第一次render，至少是第二次render，直接拿取第一次render创建的hooks
  if (currentHook) {
    // 每次render时执行更新链表
    currentHook.state = currentHook.updateQueue.forceUpdates(currentHook.state);
  // false => workInProgressFiber为新创建 为其创建新的hooks
  } else {
    currentHook = {
      state: initialValue,
      updateQueue: new UpdateQueue()
    };
  }
  // 调用dispatch时会向更新链表塞入一个更新
  const dispatch = action=>{
    let payload = reducer ? reducer(currentHook.state, action) : action;
    currentHook.updateQueue.enqueueUpdate(
      new Update(payload)
    );
    scheduleRoot();
  };
  workInProgressFiber.hooks[hookIndex] = currentHook;
  hookIndex++;
  return [currentHook.state, dispatch];

}

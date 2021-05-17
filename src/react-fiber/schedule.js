// 从根节点开始渲染 和调度
/**
 * 两个阶段
 * diff阶段 对比新旧的虚拟DOM进行增量更新或创建
 * 这个阶段比较花时间，可以对任务拆分，中断和继续
 * commit阶段，进行DOM更新创建阶段，不可中断
*/
import { TAG_ROOT, ELEMENT_TEXT, TAG_HOST, TAG_TEXT, PLACEMENT, DELETION, UPDATE } from './constant';
import createDOM, { updateDom } from './dom';
let nextUnitOfWork = null; // 下个调度任务
let workInProgressRoot = null; // 此次更新后新的fiber树
let currentRoot = null; // 当前页面中真实dom对应的fiber树
let deletions = []; // 被删除的fiber


export default function scheduleRoot(rootFiber) {
  if (currentRoot) { // 第一次更新 （将新旧fiber树节点通过alternate一一对应关联起来）
    rootFiber.alternate = currentRoot;
    workInProgressRoot = rootFiber;
  } else { // 第一次创建 （创建整个fiber）
    workInProgressRoot = rootFiber;
  }

  nextUnitOfWork = workInProgressRoot;
  console.log('nextUnitOfWork:', nextUnitOfWork);
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
  }

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
  let oldFiber = currentFiber.alternate && currentFiber.alternate.child;
  let prevSibling;
  while (newChildIndex < newChildren.length || oldFiber) {
    let newChild = newChildren[newChildIndex];
    let newFiber;
    const sameType = oldFiber && newChild.type === oldFiber.type; // 新老fiber收否一致
    if (sameType) {
      newFiber = {
        tag: oldFiber.tag,
        type: oldFiber.type,
        props: newChild.props,
        stateNode: oldFiber.stateNode,
        return: currentFiber,
        alternate: oldFiber,
        effectTag: UPDATE,
        nextEffect: null
      };
    } else {
      if (newChild) {
        let tag;
        if (newChild.type === ELEMENT_TEXT) {
          tag = TAG_TEXT;
        } else if (typeof newChild.type === 'string') {
          tag = TAG_HOST;
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
  console.log('commitWork:', currentFiber, currentFiber.effectTag);
  let returnFiber = currentFiber.return;
  let returnDom = returnFiber.stateNode;
  if (currentFiber.effectTag === PLACEMENT) { // 新增节点
    returnDom.appendChild(currentFiber.stateNode);
  } else if (currentFiber.effectTag === DELETION) {
    returnDom.removeChild(currentFiber.stateNode);
  } else if (currentFiber.effectTag === UPDATE) {
    if (currentFiber.tag === TAG_TEXT) {
      if (currentFiber.alternate.props.text !== currentFiber.props.text);
      currentFiber.stateNode.textContent = currentFiber.props.text;
    } else if (currentFiber.tag === TAG_ROOT) {
      updateDom(currentFiber.stateNode, currentFiber.alternate.props, currentFiber.props);
    }


  }
  currentFiber.effectTag = null;
}
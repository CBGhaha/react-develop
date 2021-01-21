import $ from 'jquery';
import { Element } from './createElement';
let diffQueue = [];
let updateDepth = 0;
let patchTypes = {
  MOVE: 'move',
  INSERT: 'insert',
  DELETE: 'delete'
};
class Unit {
  constructor(element) {
    this._currentElement = element;
  }
}
class ReactTextUnit extends Unit {
  getMarkUp(id) {
    this.id = id;
    return `<span react-id="${id}">${this._currentElement}</span>`;
  }
  update(nextRenderedElement) {
    this._currentElement = nextRenderedElement;
    $(`[react-id="${this.id}"]`).html(nextRenderedElement);
  }
}
class ReactNativeUnit extends Unit {
  getMarkUp(id) {
    this.id = id;
    const { type, props } = this._currentElement;
    let startLabelStr = `<${type} react-id="${id}"`;
    let contentStr = '';
    this._renderedChildrenUnits = [];
    for (let propsItem in props) {
      // 事件
      if (/on[A-Z]/.test(propsItem)) {
        const eventName = propsItem.slice(2).toLowerCase();
        $(document).delegate(`[react-id="${this.id}"]`, eventName, props[propsItem]);
      } else if (propsItem === 'className') {
        startLabelStr += ` class="${props[propsItem]}" `;
      // 普通属性
      } else if (propsItem === 'children') {
        const childrenElement = props[propsItem];
        childrenElement.forEach((ele, index)=>{
          const childUnit = createReactUnit(ele);
          this._renderedChildrenUnits.push(childUnit);
          childUnit._mountIndex = index;
          contentStr += childUnit.getMarkUp(`${id}-${index}`);
        });
      } else {
        startLabelStr += ` ${propsItem}="${props[propsItem]}" `;
      // 子组件
      }
    }
    const endLabelStr = `</${type}>`;
    return startLabelStr + '>' + contentStr + endLabelStr;
  }
  update(nextRenderedElement) {
    const preProps = this._currentElement.props;
    const nextProps = nextRenderedElement.props;
    this.updateDOMProperties(preProps, nextProps);
    if (nextProps.children) this.updateDOMChildren(nextProps.children);
  }
  updateDOMChildren(newChildrenElements) {
    updateDepth++;
    this.diff(diffQueue, newChildrenElements);
    updateDepth--;
    //
    if (updateDepth === 0) {
      console.info('diffQueue:', diffQueue);
      this.patch(diffQueue);
      diffQueue = [];
    }
  }
  patch(diffQueue) {
    let deleteChildren = [];
    let deleteMap = {};
    // 先删除所有需要delete和remove的节点
    for (let i = 0;i < diffQueue.length;i++) {
      const difference = diffQueue[i];
      const { type, fromIndex, parentNode } = difference;
      if (type === patchTypes.MOVE || type === patchTypes.DELETE) {
        let oldNode = $(parentNode.children().get(fromIndex));
        deleteMap[i] = oldNode;
        deleteChildren.push(oldNode);
      }
    }
    $.each(deleteChildren, (index, child)=>{$(child).remove();});
    // 开始插入需要插入的节点
    for (let i = 0;i < diffQueue.length;i++) {
      const difference = diffQueue[i];
      const { type, toIndex, parentNode, markUp } = difference;
      let oldNode;
      switch (type) {
        case patchTypes.INSERT:oldNode = $(markUp);break;
        case patchTypes.MOVE:oldNode = deleteMap[i];break;
        default:break;
      }
      if (oldNode) {
        this.insertChildAt(parentNode, toIndex, oldNode);
      }
    }
  }
  insertChildAt(parentNode, index, newNode) {
    let oldNode = parentNode.children().get(index);
    console.log('insertChildAt:', parentNode, oldNode, newNode);
    oldNode ? oldNode.insertBefore(newNode) : newNode.appendTo(parentNode);
  }
  diff(diffQueqe, newChildrenELements) {

    let oldChildrenUnitMap = this.getOldChildrenMap(this._renderedChildrenUnits);
    let [newChildrenUnitMap, newChildrenUnits] = this.getNewChildren(oldChildrenUnitMap, newChildrenELements);
    this._renderedChildrenUnits = newChildrenUnits;
    let pointerIndex = 0;
    for (let i = 0;i < newChildrenUnits.length;i++) {
      const newUnit = newChildrenUnits[i];
      const newkey = (newUnit._currentElement.props && newUnit._currentElement.props.key) || i;
      const oldUnit = oldChildrenUnitMap[newkey];
      if (oldUnit === newUnit) {
        // 需要做位移
        if (oldUnit._mountIndex < pointerIndex) {
          diffQueqe.push({
            parentId: this.id,
            parentNode: $(`[react-id="${this.id}"]`),
            type: patchTypes.MOVE,
            fromIndex: oldUnit._mountIndex,
            toIndex: i
          });
        }
        pointerIndex = Math.max(pointerIndex, oldUnit._mountIndex);
      } else {
        // 同key但未复用，也删除
        if (oldUnit) {
          diffQueqe.push({
            parentId: this.id,
            parentNode: $(`[react-id="${this.id}"]`),
            type: patchTypes.DELETE,
            fromIndex: oldUnit._mountIndex
          });
          // 取消事件委托
          $(document).undelegate(`[ react-id="${oldUnit.id}"]`);
        }
        diffQueqe.push({
          parentId: this.id,
          parentNode: $(`[react-id="${this.id}"]`),
          type: patchTypes.INSERT,
          toIndex: i,
          markUp: newUnit.getMarkUp(`${this.id}-${i}`)
        });
      }
      newUnit._mountIndex = i;
    }
    // render后不存在的旧key 删除
    for (let oldKey in oldChildrenUnitMap) {
      if (!newChildrenUnitMap.hasOwnProperty(oldKey)) {
        const oldUnit = oldChildrenUnitMap[oldKey];
        diffQueqe.push({
          parentId: this.id,
          parentNode: $(`[react-id="${this.id}"]`),
          type: patchTypes.DELETE,
          fromIndex: oldUnit._mountIndex
        });
        // 取消事件委托
        $(document).undelegate(`[ react-id="${oldUnit.id}"]`);
      }
    }
  }
  getNewChildren(oldChildrenUnitMap, newChildrenElements) {
    let newChildren = [];
    let newChildrenUnitMap = {};
    newChildrenElements.forEach((newElement, index)=>{
      let newKey = (newElement.props && newElement.props.key) || `${index}`;
      let oldUnit = oldChildrenUnitMap[newKey];
      let oldElement = oldUnit && oldUnit._currentElement;
      if (shouldDeepCompare(oldElement, newElement)) {
        oldUnit.update(newElement);
        newChildren.push(oldUnit);
        newChildrenUnitMap[newKey] = oldUnit;
      } else {
        const nextUnit = createReactUnit(newElement);
        newChildren.push(nextUnit);
        newChildrenUnitMap[newKey] = nextUnit;
      }
    });

    return [newChildrenUnitMap, newChildren];
  }
  getOldChildrenMap(renderedChildrenUnits = []) {
    let map = {};
    for (let i in renderedChildrenUnits) {
      const unit = renderedChildrenUnits[i];
      const key = (unit._currentElement.props && unit._currentElement.props.key) || `${i}`;
      map[key] = unit;
    }
    return map;
  }
  updateDOMProperties(preProps, nextProps) {
    for (let propsName in preProps) {
      if (!nextProps.hasOwnProperty(propsName)) {
        $(`[react-id="${this.id}"]`).removeAttr(propsName);
      }
      if (/on[A-Z]/.test(propsName)) {
        $(document).undelegate(`[ react-id="${this.id}"]`, eventName);
      }
    }
    for (let propsName in nextProps) {
      if (/on[A-Z]/.test(propsName)) {
        const eventName = propsName.slice(2).toLowerCase();
        $(document).delegate(`[react-id="${this.id}"]`, eventName, nextProps[propsName]);
      } else if (propsName === 'className') {
        $(`[react-id="${this.id}"]`)[0].className = nextProps[propsName];
      // 普通属性
      } else if (propsName = 'children') {
        //
      } else {
        $(`[react-id="${this.id}"]`).prop(propsName, nextProps[propsName]);
      }
    }
  }
}
class ReactCompositeUnit extends Unit {
  getMarkUp(id) {
    this.id = id;
    const { type: Component, props } = this._currentElement;

    /* ！！！————保存类组件的实例——————！ */
    const componentInstance = this._componentInstance = new Component(props);

    /* ！！！————给类组件实例暴露Unit 以使组件更新时调用（update）—————— ！*/
    this._componentInstance._currentUnit = this;


    // 执行willMoumet
    if (componentInstance.componentWillMount) componentInstance.componentWillMount();
    let renderRes = componentInstance.render();

    /* ！！！——— 保存render后element生成的Unit ——— ！*/
    const renderedUnitInstance = this._renderedUnitInstance = createReactUnit(renderRes);
    // componentDidMount函数加入到执行队列
    $(document).on('mount', ()=>{
      componentInstance.componentDidMount && componentInstance.componentDidMount();
    });
    return renderedUnitInstance.getMarkUp(id);
  }
  update(nextElement, partitialState) {
    /* ！！！————更新element—————— ！*/
    this._currentElement = nextElement || this._currentElement;
    const nextState = Object.assign(this._componentInstance.state, partitialState);
    const nextProps = this._currentElement.props;
    // componentShouldUpdate生命周期
    const shouldUpdate = this._componentInstance.componentShouldUpdate ? this._componentInstance.componentShouldUpdate(nextProps, nextState) : true;
    this._componentInstance.state = nextState;
    if (!shouldUpdate) return;
    // 上次render的react元素
    const preRenderedElement = this._renderedUnitInstance._currentElement ;
    // 本次render的react元素
    const nextRenderedElement = this._componentInstance.render();
    if (shouldDeepCompare(preRenderedElement, nextRenderedElement)) {
      this._renderedUnitInstance.update(nextRenderedElement);
      this._componentInstance.componentDidUpdade && this._componentInstance.componentDidUpdade();
    } else {
      this._renderedUnitInstance = createReactUnit(nextRenderedElement);
      const markUp = this._renderedUnitInstance.getMarkUp(this.id);
      $(`[react-id="${this.id}"]`).replaceWith(markUp);
    }

  }
}
function shouldDeepCompare(preRenderedElement, nextRenderedElement) {
  if (preRenderedElement && nextRenderedElement) {
    const preType = typeof preRenderedElement;
    const nextType = typeof nextRenderedElement;
    if ((preType === 'string' || preType === 'number') && (nextType === 'string' || nextType === 'number')) return true;
    if ((preRenderedElement instanceof Element && nextRenderedElement instanceof Element) && preRenderedElement.type === nextRenderedElement.type) {
      return true;
    }
  }
  return false;
}
export default function createReactUnit(element) {
  if (typeof element === 'string' || typeof element === 'number') {
    return new ReactTextUnit(element);
  }
  if (element instanceof Element && typeof element.type === 'string') {
    return new ReactNativeUnit(element);
  }
  if (element instanceof Element && typeof element.type === 'function') {
    return new ReactCompositeUnit(element);
  }
}
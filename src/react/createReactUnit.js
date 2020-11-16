import $ from 'jquery';
import { Element } from './createElement';

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
    for (let propsItem in props) {
      // 事件
      if (/on[A-Z]/.test(propsItem)) {
        const eventName = propsItem.slice(2).toLowerCase();
        $(document).delegate(`[ react-id="${this.id}"]`, eventName, props[propsItem]);
      // 普通属性
      } else if (propsItem !== 'children') {
        startLabelStr += `${propsItem}="${props[propsItem]}"`;
      // 子组件
      } else {
        const childrenElement = props[propsItem];
        childrenElement.forEach((ele, index)=>{
          contentStr += createReactUnit(ele).getMarkUp(`${id}-${index}`);
        });
      }
    }
    const endLabelStr = `</${type}>`;
    return startLabelStr + '>' + contentStr + endLabelStr;
  }
  update(nextRenderedElement) {
    const preProps = this._currentElement.props;
    const nextProps = nextRenderedElement.props;
    this.updateDOMProperties(preProps, nextProps);
  }
  updateDOMProperties(preProps, nextProps) {
    for (let propsName in preProps) {
      if (!nextProps.hasOwwProperty(propsName)) {
        $(`[ react-id="${this.id}"]`).removeAttr(propsName);
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
    if (shouleDeepCompare(preRenderedElement, nextRenderedElement)) {
      this._renderedUnitInstance.update(nextRenderedElement);
      this._componentInstance.componentDidUpdade && this._componentInstance.componentDidUpdade();
    } else {
      this._renderedUnitInstance = createReactUnit(nextRenderedElement);
      const markUp = this._renderedUnitInstance.getMarkUp(this.id);
      $(`[react-id="${this.id}"]`).replaceWith(markUp);
    }

  }
}
function shouleDeepCompare(preRenderedElement, nextRenderedElement) {
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
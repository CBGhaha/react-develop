import { TAG_HOST, TAG_TEXT } from './constant';


// 根据fiber创建真实dom
export default function createDOM(currentFiber) {
  if (currentFiber.tag === TAG_TEXT) {
    return document.createTextNode(currentFiber.props.text);
  } else if (currentFiber.tag === TAG_HOST) {
    let stateNode = document.createElement(currentFiber.type);
    updateDom(stateNode, {}, currentFiber.props);
    return stateNode;
  }
}
export function updateDom(stateNode, preProps, newProps) {
  setProps(stateNode, preProps, newProps);
}

export function setProps(dom, preProps, newProps) {
  for (let key in preProps) {
    if (key !== 'children') {
      if (!newProps.hasOwnProperty(key)) {
        dom.removeAttribute(key);
      }
    }
  }
  for (let key in newProps) {
    if (key !== 'children') {
      setProp(dom, key, newProps[key]);
    }
  }
}

function setProp(dom, key, value) {
  if (/^on/.test(key)) { //事件
    dom[key.toLowerCase()] = value;
  } else if (key === 'style') {
    if (value) {
      for (let styleName in value) {
        dom.style[styleName] = value[styleName];
      }
    }
  } else {
    dom.setAttribute(key, value);
  }
}
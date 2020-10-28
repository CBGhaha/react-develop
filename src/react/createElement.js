export class Element {
  constructor(type, props, children) {
    let $props = props || {};
    $props.children = children;
    this.type = type;
    this.props = $props;
  }
}

export default function createElement(type, props, ...children) {
  return new Element(type, props, children);
}
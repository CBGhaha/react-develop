
import { TAG_ROOT } from './constant';
import scheduleRoot from './scheduler';
// render是吧一个元素渲染到容器内部
export function render(element, container) {
  let rootFiber = {
    tag: TAG_ROOT, //  每个fiber会有一个tag标识类型
    stateNode: container, // 一般情况下如果这个元素是一个原生节点的化，stateNode指向真实dom元素
    props: {
      children: [
        element
      ]
    }
  };
  scheduleRoot(rootFiber);
}
const ReactDom = {
  render
};
export default ReactDom;
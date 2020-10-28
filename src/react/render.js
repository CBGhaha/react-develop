import $ from 'jquery';
import createReactUnit from './createReactUnit.js';

export default function render(element, container) {
  const reactUnitInstance = createReactUnit(element);
  const markUp = reactUnitInstance.getMarkUp(0);
  $(container).html(markUp);
  // 执行符合组件组成的componentDidMount队列
  $(document).trigger('mount');
}
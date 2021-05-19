import createElement from './createElement';
import { Update } from './updateQueue';
import scheduleRoot from './scheduler';
class Component {
  constructor(props) {
    this.props = props;


  }
  setState(payload) {
    let update = new Update(payload);
    this.internalFiber.updateQueue.enqueueUpdate(update);
    scheduleRoot();
  }
}
Component.prototype.isReactComponent = true;
export default {
  createElement,
  Component
};
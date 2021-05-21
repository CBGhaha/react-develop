import createElement from './createElement';
import { Update } from './updateQueue';
import scheduleRoot from './scheduler';
import { useReducer } from './scheduler';
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


function useState(initState) {
  const [state, dispatch] = useReducer(null, { data: initState });
  return [state.data, (payload)=>{dispatch({ data: payload });}];
}

export default {
  createElement,
  Component,
  useReducer,
  useState
};

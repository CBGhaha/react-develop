// import React from './react';
// import ReactDom from './react-dom';

import React from './react-17.0.2/packages/react';
import ReactDOM from './react-17.0.2/packages/react-dom';
console.log('debug');
// import React from '../../react-17.0.2/packages/react';
// import ReactDom from '../../react-17.0.2/packages/react-dom';
// import React from '../../react-17.0.2/build/node_modules/react';
// import ReactDom from '../../react-17.0.2/build/node_modules/react-dom';
const { useReducer, useState } = React;

function reducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return { count: state.count + 1 };
    default:
      return state;
  }
}
function FunctionComponent() {
  const [count, setCount] = useState(1);
  // const [countState, dispatch] = useReducer(reducer, { count: 1 });
  return <div>
    {/* <p onClick={()=>{dispatch({ type: 'ADD' });}}>function component </p> */}
    <p onClick={()=>{setCount(count + 1);}}>function component </p>
    <span>{count}</span>
  </div>;
}
class Example extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.state = {
      num: 1
    };
  }
  handleClick() {
    this.setState(state=>({
      num: state.num + 1
    }));
  }
  render() {
    return <div>
      <p onClick={this.handleClick}> class component</p>
      <span>
        {this.state.num}
      </span>
      <FunctionComponent num={this.state.num}/>

    </div>;
  }
}
ReactDOM.render(<Example/>, document.getElementById('app'));
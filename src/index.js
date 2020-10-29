import React, { ReactDom } from './react/React';

class Mycomponents extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: 'bang'
    };
  }
  componentWillMount() {
    console.log('componentWillMount');
  }
  componentDidMount() {
    console.log('componentDidMount');
  }
  render() {
    console.log('render');
    const { name } = this.state;
    return <div>{name}</div>;
  }
}

ReactDom.render(<Mycomponents/>, '#app');
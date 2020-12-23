import React, { ReactDom } from './react/React';

class Mycomponents extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      number: 1
    };
    setInterval(()=>{
      this.setState({
        number: this.state.number + 1
      });
    }, 1000);
  }
  componentWillMount() {
    console.log('componentWillMount');
  }
  componentDidMount() {
    console.log('componentDidMount');
  }
  render() {
    console.log('render');
    const { number } = this.state;
    return <div className={number % 2 === 0 ? 'ji' : 'ou'}>{ number }</div>;
  }
}

ReactDom.render(<Mycomponents/>, '#app');
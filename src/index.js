import React, { ReactDom } from './react/React';

// { ReactDom }

class Mycomponents extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      number: 1
    };
    setInterval(()=>{
      if (this.state.number < 4) {
        this.setState({
          number: this.state.number + 1
        });
      }

    }, 1000);
  }
  componentDidMount() {
    console.log('componentDidMount');
  }
  render() {
    console.log('render');
    const { number } = this.state;
    return <div className={number % 2 === 0 ? 'ji' : 'ou'}>
      { number }
      {
        number % 2 === 0 ? <div>偶数</div> : <span>奇数</span>
      }
    </div>;
  }
}

ReactDom.render(<Mycomponents/>, '#app');
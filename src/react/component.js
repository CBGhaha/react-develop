export default class Component {
  constructor(props) {
    this.props = props;
  }
  setState(partitailState) {
    this._currentUnit.update(null, partitailState);
  }
}
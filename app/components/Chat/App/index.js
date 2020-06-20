import React, { Component } from 'react';
import Messenger from '../Messenger';

export default class App extends Component {
  render() {
    const { params } = this.props;
    return (
      <div style={{ height: '100%' }}>
        <Messenger userIds={params} />
      </div>
    );
  }
}

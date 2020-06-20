import React, { Component, memo } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';
import injectSaga from 'utils/injectSaga';
import observe, { emitData } from '../../../utils/observers';
import styled from '../styled';
import saga from './saga';

const Div = styled('Compose');
if (!window.__arsfChatEmmitter) {
  window.__arsfChatEmmitter = (txt) => {
    emitData('__arsfChatEmmitter', txt);
  };
}

class Compose extends Component {
  constructor(p) {
    super(p);
    this.rel;
    window.__arsfChatEmmitter.bind(this)();
  }

  componentDidMount() {
    const name = '__arsfChatEmmitter';
    observe(name, {
      [name]: this.send.bind(this),
    });
  }

  componentWillUnmount() {
    this.unobserve();
  }

  unobserve() {
    observe(null);
  }

  send = (e) => {
    if (e) {
      let el = e.target;
      if (el.value) this.props.send(el.value);
      el.value = '';
    }
  };
  test = (e) => {
    e.preventDefault();
    return false;
  };

  render() {

    return (
      <Div>
        <form onSubmit={this.test} className="compose">
          <textarea
            ref={el => this.rel = el}
            type="text"
            className="compose-input form-control"
            placeholder="Start typing..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.keyCode === 13) {
                if (!e.ctrlKey && !e.shiftKey) {
                  this.send(e);
                }
              }
            }}
          />
          <div className="send">
            <button
              className="btn btn-ghost-success img"
              onClick={() => this.send({ target: this.rel })}
            >
            </button>
            {this.props.rightItems}
          </div>
        </form>
      </Div>
    );
  }
}

const mapStateToProps = createStructuredSelector({});

export function mapDispatchToProps(dispatch) {
  return {
    send: (text, userId) => dispatch({ type: 'messages_test', text, userId }),
  };
}

const withSaga = injectSaga({ key: 'message_sent', saga });

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(
  withSaga,
  withConnect,
  memo,
)(Compose);

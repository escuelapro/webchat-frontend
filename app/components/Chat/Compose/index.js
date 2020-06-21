import React, {Component, memo} from 'react';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {createStructuredSelector} from 'reselect';
import injectSaga from 'utils/injectSaga';
import observe, {emitData} from '../../../utils/observers';
import styled from '../styled';
import saga from './saga';

const Div = styled('Compose');
if (!window.__arsfChatEmmitter) {
  window.__arsfChatEmmitter = (txt) => {
    emitData('__arsfChatEmmitter', txt);
  };
}
let rd = 90;
let lastScrollHeight = 0;

function OnInput() {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
  const c = document.querySelector('.abs-w-c-btm-form form.compose')
  if (lastScrollHeight < this.scrollHeight) {
    rd -= 10;
    if (rd > 10) {
      c.style.borderRadius = `${rd}px`;
    }
    lastScrollHeight = this.scrollHeight
  }
}

class Compose extends Component {
  constructor(p) {
    super(p);
    this.rel;
    window.__arsfChatEmmitter.bind(this)();
  }

  componentDidMount() {
    const tx = document.getElementsByTagName('textarea');
    for (let i = 0; i < tx.length; i++) {
      tx[i].setAttribute('style', 'height:' + (tx[i].scrollHeight) + 'px;overflow-y:hidden;');
      tx[i].addEventListener("input", OnInput, false);
    }
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
      <Div className="abs-w-c-btm-form">
        <form onSubmit={this.test} className="compose">
          <textarea
            ref={el => this.rel = el}
            className="compose-input form-control"
            placeholder="Задайте свой вопрос"
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
              className="btn btn-ghost-success img send-btn"
              onClick={() => this.send({target: this.rel})}
            >
              <span />
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
    send: (text, userId) => dispatch({type: 'messages_test', text, userId}),
  };
}

const withSaga = injectSaga({key: 'message_sent', saga});

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(
  withSaga,
  withConnect,
  memo,
)(Compose);

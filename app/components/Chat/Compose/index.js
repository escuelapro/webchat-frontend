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
let firstHeight = false;

function OnInput() {
  if (!firstHeight || this.value.length < 26 && !this.value.match('\n')) {
    firstHeight = true
    this.style.height = '24' + 'px';
    return
  }
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
  const c = document.querySelector('.abs-w-c-btm-form form.compose textarea')
  if (lastScrollHeight < this.scrollHeight) {
    rd -= 20;
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
    const tx = this.rel;
    if (tx) {
      tx.addEventListener("input", OnInput, false);
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
      let v = `${el.value}`.trim();
      if (v) this.props.send(v);
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
              <span/>
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

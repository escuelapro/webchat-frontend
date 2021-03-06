import React, {Component, memo} from 'react';
import {connect} from 'react-redux';
import {compose} from 'redux';
import moment from 'moment';
import {createStructuredSelector} from 'reselect';
import injectSaga from 'utils/injectSaga';
import injectReducer from 'utils/injectReducer';

import Compose from '../Compose';
import Message from '../Message';

import {
  makeSelectError,
  makeSelectLoading,
  makeSelectMess,
  makeSelectAction,
} from './selectors';

import styled from '../styled';
import saga from './saga';
import reducer from './reducer';
import Loader from '../Loader';
import observe, {emitData} from '../../../utils/observers';

const Div = styled('MessageList');

window.__arsfChatEmmitter = emitData;
window.__arsfShowGreetings = true;
const MSG_CONTAINER = '.arsf-messenger-scrollable .arsf-message-list-container';

class MessageList extends Component {
  lastLocation = '';

  componentDidMount() {
    const name = '__arsfChatEmmittermess';
    observe(name, {
      [name]: this.getMessages.bind(this),
    });
    this.getMessages({mount: 1});
    this.scrollBottom();
  }

  componentWillUnmount() {
    this.props.clear();
  }

  componentDidUpdate() {
    this.scrollBottom();
    this.lastLocation = window.location.search;
  }

  scrollBottom = () => {
    const element = document.querySelector(MSG_CONTAINER);
    if (element) {
      setTimeout(() => {
        element.scrollTop = element.scrollHeight;
      }, 100);
    }
  };

  getMessages = (params = {}) => {
    if (params.data) {
      this.sendAction({message: params.data});
      return;
    }
    if (this.el) {
      this.props.getMessages(params);
    }
  };

  renderMessages() {
    let i = 0;
    const mess = this.props.messages;
    const messageCount = mess.messages && mess.messages.length;
    const messagesRender = [];
    while (i < messageCount) {
      const previous = mess.messages[i - 1];
      const current = mess.messages[i];
      const next = mess.messages[i + 1];
      const currentMoment = moment(current.createdAt);
      let prevBySameAuthor = false;
      let nextBySameAuthor = false;
      let startsSequence = true;
      let endsSequence = true;
      let showTimestamp = true;
      let showMore = true;

      if (previous) {
        let previousMoment = moment(previous.createdAt);
        let previousDuration = moment.duration(
          currentMoment.diff(previousMoment));
        prevBySameAuthor = previous.sender === current.sender;

        if (prevBySameAuthor && previousDuration.as('hours') < 1) {
          startsSequence = false;
        }

        if (previousDuration.as('hours') < 1) {
          showTimestamp = false;
          showMore = false;
        }
      }

      if (next) {
        let nextMoment = moment(next.createdAt);
        let nextDuration = moment.duration(nextMoment.diff(currentMoment));
        nextBySameAuthor = next.sender === current.sender;
        if (nextBySameAuthor && nextDuration.as('hours') < 1) {
          endsSequence = false;
        }
      }
      messagesRender.push(
        <Message
          key={i}
          startsSequence={startsSequence}
          endsSequence={endsSequence}
          showTimestamp={showTimestamp}
          showMore={showMore}
          data={current}
        />,
      );

      i += 1;
    }

    return messagesRender;
  }

  renderContent = () => (
    <div className="arsf-message-list" ref={el => (this.el = el)}>
      {this.props.messages.messages.length < this.props.messages.total ? (
        <div>{!this.props.loading ?
          null :
          <Loader/>}</div>
      ) : null}

      <div className="arsf-message-list-container">
        {window.__arsfShowGreetings ? (
          <>
            <div className="greet-message">
              <div className="img-wrap">
                <div className="img"/>
              </div>
              <div className="text">Привет! <br/>
                Это чат для быстрой связи, чтобы
                оперативно решить твой вопрос :)
              </div>
            </div>
          </>
        ) : this.renderMessages()}
      </div>
      <Compose/>
    </div>
  );

  sendAction = ({action, message}) => {
    this.props.sendAction({action, message});
  };

  render() {
    window.__arsfShowGreetings = this.props.messages.messages.length === 0;
    if (this.props.loading) {
      return <Loader/>;
    }
    return (
      <Div style={{height: '100%'}}>
        {this.renderContent()}
      </Div>
    );
  }
}

const mapStateToProps = createStructuredSelector({
  messages: makeSelectMess(),
  action: makeSelectAction(),
  loading: makeSelectLoading(),
  error: makeSelectError(),
});

function mapDispatchToProps(dispatch) {
  return {
    clear: params => dispatch({type: 'messages_clear', ...params}),
    getMessages: params => dispatch({type: 'messages_load', ...params}),
    sendAction: params => dispatch({type: 'send_action', ...params}),
  };
}

const withSaga = injectSaga({key: 'messages', saga});
const withReducer = injectReducer({key: 'messages', reducer});

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(
  withSaga,
  withReducer,
  withConnect,
  memo,
)(MessageList);

import React, { Component, memo } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import moment from 'moment';
import { createStructuredSelector } from 'reselect';
import injectSaga from 'utils/injectSaga';
import injectReducer from 'utils/injectReducer';
import { parseQuery } from 'utils/request';

import Compose from '../Compose';
import Message from '../Message';

import {
  makeSelectError,
  makeSelectLoading,
  makeSelectMess,
  makeSelectLocation,
  makeSelectAction,
} from './selectors';

import styled from '../styled';
import saga from './saga';
import reducer from './reducer';
import Loader from '../Loader';
import observe, { emitData } from '../../../utils/observers';

const Div = styled('MessageList');

const ACTIVE_CHATS = '.conversation-list-item.active';
window.__arsfChatEmmitter = emitData;

class MessageList extends Component {
  lastLocation = '';

  constructor(props) {
    super(props);
    if (props.location.state) {
      this.conv = props.location.state.data;
    }
  }

  componentDidMount() {
    const name = '__arsfChatEmmittermess';
    observe(name, {
      [name]: this.getMessages.bind(this),
    });
    this.getMessages();
    this.scrollBottom();
  }

  componentDidUpdate() {
    const props = this.props;
    const { avitoChatId, actions } = parseQuery();
    if (!actions) {
      this.scrollBottom();
    }
    if (props.location.state) {
      this.conv = props.location.state.data;
    }
    if (props.action && props.action.conv) {
      this.conv = props.action.conv;
    }

    this.lastLocation = window.location.search;

    if (avitoChatId) {
      let sel = `#chat${avitoChatId.replace(/-/g, '_')}`;
      const chatEl = document.querySelector(sel);
      const chatEls = document.querySelectorAll(ACTIVE_CHATS);
      chatEls.forEach(i => i.classList.remove('active'));
      if (chatEl) chatEl.classList.add('active');
    }
  }

  scrollBottom = () => {
    setTimeout(() => {
      const element = document.querySelector('.arsf-messenger-scrollable .arsf-message-list-container');
      element.scrollTop = element.scrollHeight;
    }, 100);
  };

  getMessages = (params = {}) => {
    if (params.data) {
      this.sendAction({ message: params.data });
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
      const currentMoment = moment(current.created_on);
      let prevBySameAuthor = false;
      let nextBySameAuthor = false;
      let startsSequence = true;
      let endsSequence = true;
      let showTimestamp = true;
      let showMore = true;

      if (previous) {
        let previousMoment = moment(previous.created_on);
        let previousDuration = moment.duration(
          currentMoment.diff(previousMoment));
        prevBySameAuthor = previous.author === current.author;

        if (prevBySameAuthor && previousDuration.as('hours') < 1) {
          startsSequence = false;
        }

        if (previousDuration.as('hours') < 1) {
          showTimestamp = false;
          showMore = false;
        }
      }

      if (next) {
        let nextMoment = moment(next.created_on);
        let nextDuration = moment.duration(nextMoment.diff(currentMoment));
        nextBySameAuthor = next.author === current.author;

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
      <div className="arsf-message-list-container">{this.renderMessages()}</div>
      <Compose/>
    </div>
  );

  sendAction = ({ action, message }) => {
    this.props.sendAction({ action, message });
  };

  render() {
    return (
      <Div style={{ height: '100%' }}>
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
  location: makeSelectLocation(),
});

function mapDispatchToProps(dispatch) {
  return {
    getMessages: params => dispatch({ type: 'messages_load', ...params }),
    sendAction: params => dispatch({ type: 'send_action', ...params }),
  };
}

const withSaga = injectSaga({ key: 'messages', saga });
const withReducer = injectReducer({ key: 'messages', reducer });

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
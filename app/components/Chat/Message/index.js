import React, { Component } from 'react';
import moment from 'moment';
import styled from '../styled';

const Div = styled('Message');
export default class Message extends Component {
  render() {
    const { data, startsSequence, endsSequence, showTimestamp } = this.props;
    const friendlyTimestamp = moment(data.created_on).format('HH:mm');
    if (!data.message) return null;
    let isMine = data.sender !== 'admin';
    return (
      <Div>
        <div className={[
          'arsf-message',
          `${isMine ? 'mine' : ''}`,
          `${startsSequence ? 'start' : ''}`,
          `${endsSequence ? 'end' : ''}`,
        ].join(' ')}>
          {
            showTimestamp &&
            <div className="timestamp">
              {friendlyTimestamp}
            </div>
          }

          <div className="bubble-container">
            <div className="bubble" title={friendlyTimestamp}>
              {`${data.message}`.trim()}
              <div className="time">
                <span className={isMine ? "right" : "left"}>{friendlyTimestamp}</span>
              </div>
            </div>
          </div>
        </div>
      </Div>
    );
  }
}

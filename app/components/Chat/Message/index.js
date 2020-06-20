import React, { Component } from 'react';
import moment from 'moment';
import styled from '../styled';

const Div = styled('Message');
export default class Message extends Component {
  render() {
    const { data, startsSequence, endsSequence, showTimestamp } = this.props;
    const friendlyTimestamp = moment(data.created_on).format('DD.MM.YY HH:mm:ss');
    if (!data.message) return null;
    return (
      <Div>
        <div className={[
          'arsf-message',
          `${data.sender !== 'admin' ? 'mine' : ''}`,
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
              {data.message}
              <div className="time">
                <span className="right">{friendlyTimestamp}</span>
              </div>
            </div>
          </div>
        </div>
      </Div>
    );
  }
}

import React, {memo, useEffect, useState} from 'react';
import {compose} from 'redux';
import Chat from 'components/Chat/App';
import styled from './styled';
import observe, {emitData} from 'utils/observers';

const Popup = styled('Page');
window.instantChatBot = {
  show: false,
  open: () => {
    window.instantChatBot.show = !window.instantChatBot.show;
    emitData('instantChatBotEvents', {open: window.instantChatBot.show});
  },
  close: (exit) => {
    if (exit &&
      window.instantChatBotUidName) delete window.instantChatBotUidName;
    window.instantChatBot.show = false;
    emitData('instantChatBotEvents', {open: false});
  },
};

export function HomePage({params}) {
  const [show, setShow] = useState(false);
  const setShowFunc = (data) => {
    setShow(data.open);
  };
  useEffect(() => {
    const name = 'instantChatBotEvents';
    observe(name, {
      [name]: setShowFunc,
    });
  }, []);
  const toggle = () => {
    window.instantChatBot.open();
  };
  return (
    <div>
      <Popup>
        <div className="__mx-phone-line bottom">
          {show ? (
            <div className="chat-wrapper1">
              <Chat params={params}/>
              <button className="__mx-phone-line-btn close-btn"
                      onClick={toggle}>
                <span/>
              </button>
            </div>
          ) : (
            <div className="msger-button" onClick={toggle}
                 title="Support service"/>
          )}
        </div>
      </Popup>
    </div>
  );
}
export default compose(memo)(HomePage);

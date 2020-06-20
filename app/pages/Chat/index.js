import React, { memo, useEffect, useState } from 'react';
import { compose } from 'redux';
import Chat from 'components/Chat/App';
import styled from './styled';
import observe, { emitData } from '../../utils/observers';

const Popup = styled('Page');
window.instantChatBot = {
  open: () => {
    emitData('instantChatBotEvents', { open: true });
  },
  close: () => {
    emitData('instantChatBotEvents', { open: false });
  },
};

export function HomePage({ params }) {
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
  return (
    <div>
      <Popup>
        <div className="__mx-phone-line bottom">
          {show ? (
            <div className="chat-wrapper1">
              <Chat params={params}/>
              <button className="__mx-phone-line-btn close-btn" onClick={() => setShow(false)}>
                <span>x</span>
              </button>
            </div>
          ) : (
            <div className="msger-button" onClick={setShow} title="Support service"/>
          )}
        </div>
      </Popup>
    </div>
  );
}

export default compose(memo)(HomePage);

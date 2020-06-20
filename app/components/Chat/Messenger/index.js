import React, { memo, useEffect } from 'react';
import { compose } from 'redux';
import Storage from 'utils/storage';
import MessageList from '../MessageList';
import styled from '../styled';

const Div = styled('Messenger');
let tabIdKey = 'tabID';
let dubIdKey = 'isDup';
if (window.location.href.match('3011')) {
  tabIdKey = 'tabIdDev';
  dubIdKey = 'isDupDev';
}
const appId = Storage.get(tabIdKey);

function defineTabID() {
  let iPageTabID = sessionStorage[tabIdKey];
  if (iPageTabID == null) {
    iPageTabID = userId;
    sessionStorage[tabIdKey] = iPageTabID;
  }
  return iPageTabID;
}

let duplicateTab = false;
let userId = 1;
if (window.location.href.match(/client\/([0-9]+)\//)) {
  userId = window.location.href.match(/client\/([0-9]+)\//)[1];
}

function onLoad(isFirst) {
  if (typeof sessionStorage[dubIdKey] === 'undefined') {
    sessionStorage[dubIdKey] = userId;
    return;
  }
  if (sessionStorage.isDup === '') {
    sessionStorage.isDup = 'already loaded';
  } else {
    duplicateTab = sessionStorage[dubIdKey] !== userId;

    if (!isFirst) delete sessionStorage.tabID;
  }
  if (!isFirst) delete sessionStorage[tabIdKey];
}

const curAppId = defineTabID();

let isFirst = false;
if (!appId) {
  Storage.set(tabIdKey, curAppId);

  isFirst = true;
}
onLoad(isFirst);


window.addEventListener('beforeunload', () => {
  if (sessionStorage[tabIdKey] === Storage.get(tabIdKey)) Storage.rm(tabIdKey);
  sessionStorage[dubIdKey] = '';
});

const Messenger = ({ userIds }) => {
  let userId;
  if (window.location.href.match(/client\/([0-9]+)\//)) {
    userId = window.location.href.match(/client\/([0-9]+)\//)[1];
  }
  useEffect(() => {
    Storage.set(tabIdKey, userId);
  }, [userId]);

  return (
    <Div style={{ height: '100%' }}>
      <div
        className="arsf-messenger"
        data-user={userIds}
      >
        <div className="arsf-messenger-scrollable content ">
          <MessageList/>
        </div>
      </div>
    </Div>
  );
};


export default compose(
  memo,
)(Messenger);

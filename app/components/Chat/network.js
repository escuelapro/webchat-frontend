import {
  getMessages,
  getGroups,
  sendMessage,
  addGroups,
} from './network/rest';

function logger(e) {
  if (process.env.NODE_ENV === 'development') console.log(e);
}

export {
  getGroups,
  getMessages,
  sendMessage,
  addGroups,
  logger,
};

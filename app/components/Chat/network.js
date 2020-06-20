import {
  getMessages,
  getGroups,
  sendMessage,
  addGroups,
} from './network/rest';

export const MESS_LIMIT = 5;

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

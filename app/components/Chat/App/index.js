import React from 'react';
import Messenger from '../Messenger';

const App = (props) => {
  const {params} = props;
  return (
    <div style={{height: '100%'}}>
      <Messenger userIds={params}/>
    </div>
  );
};
export default App;

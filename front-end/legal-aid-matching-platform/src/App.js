import React from 'react';
import SignIn from './SignIn';
import Signup from './Signup';

function App() {
  return (
    <div>
      {/* show either SignIn or Signup based on route/state */}
      <Signup />
    </div>
  );
}

export default App;


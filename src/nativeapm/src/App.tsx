import React from 'react';

function App() {
  React.useEffect(() => {
    console.log('NativeAPM Mounted');
    window.addEventListener('message', (event) => {
      console.log('Event', event.data);
    });
  }, []);
  return <div>Native APM Widget</div>;
}

export default App;

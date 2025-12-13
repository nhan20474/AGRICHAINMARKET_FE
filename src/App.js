import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return React.createElement(
    AuthProvider,
    null,
    React.createElement(
      'div',
      { className: 'App' },
      React.createElement(Router, null, React.createElement(AppRoutes, null))
    )
  );
}

export default App;

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './components/App/App';
import { LocationProvider } from './components/misc/LocationProvider';
import { BrowserRouter as Router } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <LocationProvider>
        <App />
      </LocationProvider>
    </Router>
  </React.StrictMode>
);


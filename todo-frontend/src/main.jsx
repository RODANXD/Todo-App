import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
// import { ThemeProvider } from './store/ThemeContext';

import { AuthContextP } from './store/AuthContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthContextP>
      {/* <ThemeProvider> */}
      <App />
      {/* </ThemeProvider> */}
    </AuthContextP>
  </BrowserRouter>
);

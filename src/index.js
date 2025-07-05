import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './syncfusion-custom.css'; // Custom styles for Syncfusion components
import App from './App';
import reportWebVitals from './reportWebVitals';

// Import Syncfusion styles
import { registerLicense } from '@syncfusion/ej2-base';
import '@syncfusion/ej2-base/styles/material.css';
// Import only the CSS for components we're actually using
import '@syncfusion/ej2-react-calendars/styles/material.css';
import '@syncfusion/ej2-react-inputs/styles/material.css';
import '@syncfusion/ej2-react-dropdowns/styles/material.css';
import '@syncfusion/ej2-react-buttons/styles/material.css';

// Register Syncfusion license
// Note: For production use, you should register for your own license key at https://www.syncfusion.com/

// Using license key from environment variable
registerLicense(process.env.REACT_APP_SYNCFUSION_LICENSE_KEY || 'ORg4AjUWIQA/Gnt2VVhiQlFadVlJXGFWfVJpTGpQdk5xdV9DaVZUTWY/P1ZhSXxQdkRiWH5fdnRWRGJaVEF/WQ==');

// Note: If you're seeing a banner, please register for a free community license at:
// https://www.syncfusion.com/products/communitylicense

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

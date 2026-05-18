// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Load Sarabun font for Thai
const link = document.createElement('link');
link.rel = 'preconnect';
link.href = 'https://fonts.googleapis.com';
document.head.appendChild(link);
const link2 = document.createElement('link');
link2.rel = 'stylesheet';
link2.href = 'https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap';
document.head.appendChild(link2);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);

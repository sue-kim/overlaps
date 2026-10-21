import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/dm-sans';
import './styles.css';
import App from './App';
import ProductGuide from './ProductGuide';

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /><ProductGuide /></React.StrictMode>);

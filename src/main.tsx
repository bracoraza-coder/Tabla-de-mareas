import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize Google AdSense
const adsenseId = 'ca-pub-3655950973146688';
if (adsenseId) {
  const scriptAd = document.createElement('script');
  scriptAd.async = true;
  scriptAd.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`;
  scriptAd.crossOrigin = 'anonymous';
  document.head.appendChild(scriptAd);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

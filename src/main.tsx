import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize Google Analytics (GA4) if VITE_GA_MEASUREMENT_ID is provided
const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
if (gaId) {
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script1);

  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${gaId}');
  `;
  document.head.appendChild(script2);
}

// Initialize Google AdSense if VITE_ADSENSE_CLIENT_ID is provided
const adsenseId = import.meta.env.VITE_ADSENSE_CLIENT_ID;
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

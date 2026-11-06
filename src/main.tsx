import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Unregister stale service workers to prevent mobile Chrome caching old unresponsive builds
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);

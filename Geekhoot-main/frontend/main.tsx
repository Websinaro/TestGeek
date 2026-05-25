import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker with autoUpdate check and immediate activation
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New update available! Refreshing the page to load the latest premium features...');
    // Automatically force clean update of old cache without manual intervention
    window.location.reload();
  },
  onOfflineReady() {
    console.log('Geekhoot Printing Store is fully cached and ready to run offline!');
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);


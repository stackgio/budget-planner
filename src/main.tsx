import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StoreProvider } from './store';
import { App } from './App';
import './styles.css';
import { IS_ARTIFACT } from './platform';

if (IS_ARTIFACT) document.documentElement.classList.add('artifact');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD && !IS_ARTIFACT) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // offline support unavailable; the app still works online
    });
  });
}

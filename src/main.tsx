import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/manrope';
import '@fontsource-variable/inter';
import './styles/base.css';
import './styles/ui.css';
import './styles/nav.css';
import './styles/hero.css';
import './styles/sections.css';
import './styles/howitworks.css';
import './styles/modal.css';
import './styles/packages.css';
import './styles/admin.css';
import App from './App';
import { AppProvider } from './store';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);

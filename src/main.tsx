import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import 'leaflet/dist/leaflet.css';
import './index.css';
import App from './App';
import { readShotMode } from './lib/shot';

const shot = readShotMode();
if (shot) document.documentElement.classList.add('shot');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App shot={shot} />
  </StrictMode>,
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import { createTheme, MantineProvider } from '@mantine/core';
import { Analytics } from '@vercel/analytics/react';
import '@fontsource-variable/inter';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/quicksand';
import '@mantine/core/styles.css';
import './index.css';
import { App } from './App.tsx';

const budolTheme = createTheme({
  fontFamily: '"Inter Variable", system-ui, sans-serif',
  headings: {
    fontFamily: '"Fraunces Variable", Georgia, serif',
  },
  primaryColor: 'green',
  defaultRadius: 'lg',
});

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <MantineProvider theme={budolTheme}>
        <App />
        <Analytics />
      </MantineProvider>
    </React.StrictMode>
  );
}

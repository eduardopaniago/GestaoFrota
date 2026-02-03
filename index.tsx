
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Erro ao renderizar o aplicativo:", error);
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #ef4444; font-family: sans-serif;">
        <h2>Erro ao carregar o FrotaFin</h2>
        <p>Houve um problema na inicialização. Por favor, recarregue a página.</p>
      </div>
    `;
  }
}

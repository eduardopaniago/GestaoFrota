
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
const loadingScreen = document.getElementById('loading-screen');

if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    // Remove a tela de carregamento após um pequeno delay para garantir o render
    setTimeout(() => {
      if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 500);
      }
    }, 1000);

  } catch (error: any) {
    console.error("Erro ao renderizar o aplicativo:", error);
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 40px; text-align: center; color: #ef4444; font-family: sans-serif;">
          <h2 style="font-weight: 900;">Erro ao carregar o FrotaFin</h2>
          <p style="font-size: 14px; margin-top: 10px;">${error.message || 'Houve um problema na inicialização.'}</p>
          <button onclick="location.reload()" style="margin-top:20px; padding:10px 20px; background:#2563eb; color:white; border:none; border-radius:8px; font-weight:bold;">Reiniciar App</button>
        </div>
      `;
    }
    if (loadingScreen) loadingScreen.style.display = 'none';
  }
}

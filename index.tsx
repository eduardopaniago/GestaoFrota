
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
const loadingScreen = document.getElementById('loading-screen');

const hideLoading = () => {
  if (loadingScreen) {
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 400);
  }
};

if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    
    // Renderizamos o App
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    // Em dispositivos mobile, damos um pequeno fôlego para o navegador processar o CSS/DOM inicial
    if (document.readyState === 'complete') {
        setTimeout(hideLoading, 800);
    } else {
        window.addEventListener('load', () => setTimeout(hideLoading, 800));
    }

  } catch (error: any) {
    console.error("Falha crítica no React:", error);
    hideLoading();
    
    rootElement.innerHTML = `
      <div style="padding: 30px; text-align: center; color: #1e293b; font-family: sans-serif; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <div style="background: #fee2e2; color: #b91c1c; padding: 20px; border-radius: 16px; border: 1px solid #fecaca; max-width: 90%;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 800;">Erro de Inicialização</h2>
          <p style="font-size: 14px; margin-top: 8px; opacity: 0.8;">${error.message || 'Verifique sua conexão ou tente reiniciar o app.'}</p>
        </div>
        <button onclick="location.reload()" style="margin-top:24px; padding: 14px 28px; background: #2563eb; color: white; border: none; border-radius: 12px; font-weight: 700; width: 80%; box-shadow: 0 10px 15px -3px rgba(37,99,235,0.2);">Tentar Novamente</button>
      </div>
    `;
  }
}

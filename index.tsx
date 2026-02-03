
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
    
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    // Aguarda o próximo frame de renderização para garantir que o conteúdo inicial do App 
    // já foi processado pelo navegador antes de ocultar o loading.
    requestAnimationFrame(() => {
      // Pequeno delay adicional para evitar "flickering" em processadores mobile lentos
      setTimeout(hideLoading, 500);
    });

  } catch (error: any) {
    console.error("Falha crítica na montagem da UI:", error);
    hideLoading();
    
    rootElement.innerHTML = `
      <div style="padding: 30px; text-align: center; color: #1e293b; font-family: sans-serif; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        <div style="background: #fee2e2; color: #b91c1c; padding: 20px; border-radius: 16px; border: 1px solid #fecaca; max-width: 90%;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 800;">Erro de Inicialização</h2>
          <p style="font-size: 14px; margin-top: 8px; opacity: 0.8;">${error.message || 'Houve um problema ao carregar os módulos do sistema.'}</p>
        </div>
        <button onclick="location.reload()" style="margin-top:24px; padding: 14px 28px; background: #2563eb; color: white; border: none; border-radius: 12px; font-weight: 700; width: 80%; box-shadow: 0 10px 15px -3px rgba(37,99,235,0.2);">Tentar Novamente</button>
      </div>
    `;
  }
}

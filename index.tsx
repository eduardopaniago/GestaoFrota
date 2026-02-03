
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const loadingScreen = document.getElementById('loading-screen');

const hideLoading = () => {
  if (loadingScreen) {
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);
  }
};

if (container) {
  try {
    const root = createRoot(container);
    
    // Renderização direta para máxima compatibilidade mobile
    root.render(<App />);
    
    // Notifica o navegador que a primeira pintura foi concluída
    requestAnimationFrame(() => {
      setTimeout(hideLoading, 500);
    });

  } catch (error: any) {
    console.error("Falha ao inicializar React:", error);
    if (container) {
        container.innerHTML = `
          <div style="height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;text-align:center;font-family:sans-serif;">
            <div style="background:#fff;padding:30px;border-radius:20px;box-shadow:0 10px 25px rgba(0,0,0,0.1);max-width:400px;">
              <h2 style="color:#ef4444;margin:0;">Erro de Sistema</h2>
              <p style="color:#64748b;margin:15px 0;">Ocorreu um erro ao carregar os módulos. Verifique sua conexão.</p>
              <p style="font-size:10px;color:red;opacity:0.5;">${error?.message || 'Erro desconhecido'}</p>
              <button onclick="location.reload()" style="background:#2563eb;color:white;border:none;padding:12px 24px;border-radius:10px;font-weight:700;cursor:pointer;width:100%;">Tentar Novamente</button>
            </div>
          </div>
        `;
    }
    hideLoading();
  }
}

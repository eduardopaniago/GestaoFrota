
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
    }, 500);
  }
};

if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    
    // Renderizamos o App sem o StrictMode para evitar problemas de duplo efeito em mobile durante o carregamento inicial
    root.render(<App />);
    
    // Garantimos a remoção do loading após o React processar o primeiro render
    requestAnimationFrame(() => {
      setTimeout(hideLoading, 300);
    });

  } catch (error: any) {
    console.error("Falha ao montar o React:", error);
    hideLoading();
    
    rootElement.innerHTML = `
      <div style="height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; text-align: center; font-family: sans-serif;">
        <div style="background: #fff; padding: 30px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
          <h2 style="color: #ef4444; margin: 0;">Erro de Carregamento</h2>
          <p style="color: #64748b; margin: 15px 0;">Não foi possível iniciar o banco de dados local.</p>
          <button onclick="location.reload()" style="background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; cursor: pointer;">Recarregar Sistema</button>
        </div>
      </div>
    `;
  }
}

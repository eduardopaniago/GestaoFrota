import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Carrega as variáveis que começam com VITE_
    const env = loadEnv(mode, process.cwd(), '');
    
    return {
      base: './', // CRUCIAL: Faz os caminhos ficarem relativos para a WebView
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Use import.meta.env no seu código em vez de process.env
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'), // Ajustado para a pasta src padrão
        }
      }
    };
});


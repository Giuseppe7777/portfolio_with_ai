import { defineConfig } from 'vite';

export default defineConfig({
  base: '/portfolioai/', 
  server: {
    proxy: {
      '/php': {
        target: 'http://localhost/my-portfolio-fullstack-ai/my-portfolio-fullstack-ai',
        changeOrigin: true,
        secure: false
      }
    }
  }
});

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  preview: {
    allowedHosts: ['eldissone.onrender.com']
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        servicos: 'src/pages/servicos.html',
        projeto: 'src/pages/projeto.html',
        admin: 'src/pages/admin.html',
        blog: 'src/pages/blog.html',
        blogPost: 'src/pages/blog-post.html',
        biblioteca: 'src/pages/biblioteca.html',
        livro: 'src/pages/livro.html',
        download: 'src/pages/download.html',
      }
    }
  }
})


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,

    proxy: {
      '/smcfs': {
        target: 'http://localhost:9081',
        changeOrigin: true,
        secure: false,
      },

      '/razorpay-api': {
        target: 'https://api.razorpay.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/razorpay-api/, ''),
        secure: true,
      },

      '/stripe-api': {
        target: 'https://api.stripe.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/stripe-api/, ''),
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Strip browser cookies — Stripe doesn't need them and they confuse the API
            proxyReq.removeHeader('cookie')
            
            // Force the Authorization header through (some proxies drop it)
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization)
            }
            
            // Strip browser-specific headers that Stripe doesn't need
            proxyReq.removeHeader('origin')
            proxyReq.removeHeader('referer')
          })
        },
      },
    },
  },
})
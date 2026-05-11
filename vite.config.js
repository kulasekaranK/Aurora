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

      // Razorpay — kept in case still referenced elsewhere
      '/razorpay-api': {
        target: 'https://api.razorpay.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/razorpay-api/, ''),
        secure: true,
      },

      // Stripe — proxied so the secret key header never leaves your machine
      '/stripe-api': {
        target: 'https://api.stripe.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/stripe-api/, ''),
        secure: true,
      },
    },
  },
})
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import ProductList from './pages/ProductList.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import OrderConfirmation from './pages/OrderConfirmation.jsx'
import TrackOrder from './pages/TrackOrder.jsx'
import StoreLocator from './pages/StoreLocator.jsx'
import Login from './pages/Login.jsx'
import Account from './pages/Account.jsx'
import MyOrders from './pages/MyOrders.jsx'

function ProtectedRoutes() {
  const { isLoggedIn } = useAuth()

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-aurora-pale">
        <Login />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-aurora-pale">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/"                     element={<Home />} />
          <Route path="/shop"                 element={<ProductList />} />
          <Route path="/category/:categoryId" element={<ProductList />} />
          <Route path="/product/:itemId"      element={<ProductDetail />} />
          <Route path="/cart"                 element={<Cart />} />
          <Route path="/checkout"             element={<Checkout />} />
          <Route path="/order-confirmation"   element={<OrderConfirmation />} />
          <Route path="/track"                element={<TrackOrder />} />
          <Route path="/stores"               element={<StoreLocator />} />
          <Route path="/account"              element={<Account />} />
          <Route path="/my-orders"            element={<MyOrders />} />
          <Route path="/login"                element={<Navigate to="/" replace />} />
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center py-24 text-center px-4">
              <p className="text-5xl mb-4">🧭</p>
              <h2 className="font-display text-2xl text-aurora-navy font-bold mb-2">Page Not Found</h2>
              <a href="/" className="text-aurora-mid hover:underline font-body mt-3">← Back to Home</a>
            </div>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ProtectedRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
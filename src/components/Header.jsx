import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/stores', label: 'Stores' },
  { to: '/my-orders', label: 'My Orders' },
  { to: '/track', label: 'Track Order' },
]

export default function Header() {
  const { itemCount } = useCart()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-aurora-navy/95 backdrop-blur">
      <div className="bg-aurora-accent text-white text-[11px] md:text-xs text-center py-1.5 font-body tracking-wide">
        Premium Aurora Storefront · Powered by IBM Sterling OMS
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-aurora-gold to-amber-400 text-aurora-navy flex items-center justify-center shadow-lg">
            <span className="font-display font-bold text-sm">A</span>
          </div>
          <div className="leading-tight">
            <p className="font-display text-white text-xl font-bold tracking-tight">
              Aurora<span className="text-aurora-gold">Store</span>
            </p>
            <p className="hidden sm:block text-[10px] uppercase tracking-[0.2em] text-blue-200/70 font-body">
              Modern Commerce Demo
            </p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-body font-medium transition-all ${
                  isActive
                    ? 'bg-white/10 text-aurora-gold shadow-inner'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link
                to="/account"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-aurora-gold text-aurora-navy flex items-center justify-center text-xs font-bold">
                  {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-[11px] text-blue-200 font-body">Signed in as</p>
                  <p className="text-xs text-white font-body font-semibold leading-none">
                    {user.firstName || user.email?.split('@')[0]}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                className="hidden md:block text-xs text-blue-200 hover:text-red-300 underline underline-offset-2 transition-colors font-body"
              >
                Logout
              </button>
            </>
          ) : null}

          <Link
            to="/cart"
            className="relative p-2.5 rounded-full hover:bg-white/10 text-white transition-colors"
            aria-label="Cart"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.2 2.2a1 1 0 00.7 1.7H17m0 0a2 2 0 110 4 2 2 0 010-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-aurora-accent text-white text-[10px] flex items-center justify-center font-mono font-bold">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          <button
            onClick={() => setMenuOpen(v => !v)}
            className="lg:hidden p-2.5 rounded-full hover:bg-white/10 text-white transition-colors"
            aria-label="Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-aurora-blue/95 backdrop-blur">
          <div className="px-4 py-3 space-y-2">
            {user && (
              <Link
                to="/account"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/10"
              >
                <div className="w-9 h-9 rounded-full bg-aurora-gold text-aurora-navy flex items-center justify-center text-sm font-bold">
                  {(user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-blue-200 font-body">Account</p>
                  <p className="text-sm text-white font-body font-semibold">
                    {user.firstName || user.email?.split('@')[0]}
                  </p>
                </div>
              </Link>
            )}

            {NAV.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-white font-body text-sm hover:bg-white/10 transition-colors"
              >
                {label}
              </Link>
            ))}

            {user && (
              <button
                onClick={() => {
                  logout()
                  setMenuOpen(false)
                  navigate('/login')
                }}
                className="w-full text-left px-4 py-3 rounded-xl text-red-300 font-body text-sm hover:bg-white/10 transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
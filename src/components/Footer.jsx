import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-aurora-navy text-blue-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded bg-aurora-accent flex items-center justify-center">
              <span className="text-white font-display font-bold text-xs">A</span>
            </div>
            <span className="font-display text-white text-lg font-bold">
              Aurora<span className="text-aurora-gold">Store</span>
            </span>
          </div>
          <p className="text-xs leading-relaxed text-blue-300">
            IBM Sterling Order Management System demo storefront.
            Aurora Demo — not a real retail site.
          </p>
        </div>

        {/* Shop */}
        <div>
          <h4 className="text-white font-body font-semibold text-sm mb-3 uppercase tracking-wider">Shop</h4>
          <ul className="space-y-2 text-sm">
            {['Apparel','Women','Men','Electronics','Grocery','Health'].map(cat => (
              <li key={cat}>
                <Link to={`/category/${cat}`} className="hover:text-white transition-colors">{cat}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Customer */}
        <div>
          <h4 className="text-white font-body font-semibold text-sm mb-3 uppercase tracking-wider">Customer</h4>
          <ul className="space-y-2 text-sm">
            {[
              { to: '/track',   label: 'Track Order' },
              { to: '/stores',  label: 'Store Locator' },
              { to: '/cart',    label: 'Shopping Cart' },
              { to: '/login',   label: 'Account Login' },
            ].map(({ to, label }) => (
              <li key={to}><Link to={to} className="hover:text-white transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-body font-semibold text-sm mb-3 uppercase tracking-wider">Contact</h4>
          <ul className="space-y-2 text-sm text-blue-300">
            <li>OMS API: localhost:9081</li>
            <li>Org: Aurora-Corp / Aurora</li>
            <li className="pt-2 text-xs text-blue-400">
              Powered by IBM Sterling OMS
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 text-center py-4 text-xs text-blue-400 font-mono">
        © {new Date().getFullYear()} Aurora Store — IBM Sterling OMS Demo · All data is simulated
      </div>
    </footer>
  )
}

import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchInventoryItems } from '../api/products.js'
import { fetchCategories } from '../api/products.js'
import { fetchStores } from '../api/stores.js'
import ProductCard from '../components/ProductCard.jsx'
import StoreCard from '../components/StoreCard.jsx'
import { SkeletonCard } from '../components/Skeleton.jsx'

const TOP_CATEGORIES = [
  { id: 'Apparel',         label: 'Apparel',          icon: '👗', color: 'from-violet-500 to-purple-600' },
  { id: 'Women',           label: 'Women',             icon: '👠', color: 'from-pink-500 to-rose-500' },
  { id: 'Men',             label: 'Men',               icon: '👔', color: 'from-sky-500 to-blue-600' },
  { id: 'Dresses',         label: 'Dresses',           icon: '🌸', color: 'from-fuchsia-400 to-pink-500' },
  { id: 'Electronics',     label: 'Electronics',       icon: '💻', color: 'from-aurora-navy to-aurora-mid' },
  { id: 'Grocery',         label: 'Grocery',           icon: '🛒', color: 'from-emerald-500 to-green-600' },
  { id: 'Health',          label: 'Health',            icon: '💊', color: 'from-teal-500 to-cyan-500' },
  { id: 'Home',            label: 'Home & Furnishing', icon: '🏠', color: 'from-amber-500 to-orange-500' },
]

export default function Home() {
  const [products,   setProducts]   = useState([])
  const [stores,     setStores]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [storeLoad,  setStoreLoad]  = useState(true)
  const navigate = useNavigate()
console.log(products);

  useEffect(() => {
    fetchInventoryItems({ max: 8 })
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false))

    fetchStores(3)
      .then(setStores)
      .catch(console.error)
      .finally(() => setStoreLoad(false))
  }, [])

  return (
    <div className="animate-fade-in">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative bg-aurora-navy overflow-hidden">
        {/* Background geometric shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-aurora-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-48 bg-aurora-mid/30 rounded-tr-full blur-2xl" />
          <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-aurora-gold/10 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left animate-slide-up">
            <span className="inline-block bg-aurora-accent/20 text-aurora-gold border border-aurora-gold/30 text-xs font-mono px-3 py-1 rounded-full mb-4 tracking-widest uppercase">
              IBM Sterling OMS Demo
            </span>
            <h1 className="font-display text-white text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Discover the
              <br />
              <span className="text-aurora-gold italic">Aurora</span> Collection
            </h1>
            <p className="text-blue-200 mt-4 text-base md:text-lg font-body leading-relaxed max-w-lg">
              Premium apparel, electronics, and more — powered by IBM Sterling
              Order Management System.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center md:justify-start">
              <Link to="/shop" className="btn-primary text-sm px-8 py-3 shadow-lg">
                Shop Now
              </Link>
              <Link to="/stores" className="btn-outline border-white text-white hover:bg-white hover:text-aurora-navy text-sm px-8 py-3">
                Find a Store
              </Link>
            </div>
          </div>

          {/* Hero card stack */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-64 h-64 md:w-80 md:h-80">
              <div className="absolute inset-0 bg-gradient-to-br from-aurora-accent to-purple-600 rounded-2xl rotate-6 opacity-50 shadow-xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-aurora-gold to-orange-500 rounded-2xl rotate-3 opacity-60 shadow-xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-aurora-mid to-indigo-600 rounded-2xl shadow-2xl flex flex-col items-center justify-center text-white p-6 text-center">
                <div className="text-5xl mb-3">✨</div>
                <p className="font-display text-xl font-bold">New Season</p>
                <p className="font-display text-lg italic text-blue-200">Arrivals</p>
                <p className="font-mono text-xs mt-3 text-blue-300">Aurora-Corp Catalog</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Announcement Strip ───────────────────────────────────── */}
      <div className="bg-aurora-gold/10 border-y border-aurora-gold/20 py-3">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap gap-6 justify-center text-sm font-body text-aurora-navy">
          <span className="flex items-center gap-1.5"><span>🚚</span> Free Shipping on $75+</span>
          <span className="flex items-center gap-1.5"><span>🏪</span> Buy Online, Pick Up In-Store</span>
          <span className="flex items-center gap-1.5"><span>↩️</span> Easy Returns</span>
          <span className="flex items-center gap-1.5"><span>🔒</span> Secure Checkout</span>
        </div>
      </div>

      {/* ── Category Grid ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-end justify-between mb-6">
          <h2 className="section-title">Shop by Category</h2>
          <Link to="/shop" className="text-aurora-mid hover:text-aurora-accent text-sm font-body font-medium">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {TOP_CATEGORIES.map(cat => (
            <Link
              key={cat.id}
              to={`/category/${cat.id}`}
              className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                {cat.icon}
              </div>
              <span className="text-xs font-body font-medium text-aurora-navy text-center leading-tight">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────────────── */}
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="section-title">Featured Products</h2>
              <p className="text-gray-500 text-sm mt-1 font-body">From the Aurora catalog · OMS inventory data</p>
            </div>
            <Link to="/shop" className="text-aurora-mid hover:text-aurora-accent text-sm font-body font-medium">
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
              : products.length > 0
                ? products.map(p => <ProductCard key={p.ItemID} item={p} />)
                : (
                  <div className="col-span-full text-center py-10 text-gray-400">
                    <p className="text-4xl mb-3">🔌</p>
                    <p className="font-body">No products loaded — ensure OMS is running at localhost:9081</p>
                  </div>
                )
            }
          </div>
        </div>
      </section>

      {/* ── Promo Banner ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-gradient-to-r from-aurora-navy via-aurora-blue to-aurora-mid rounded-2xl overflow-hidden relative">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-48 h-48 bg-white/5 rounded-full" />
            <div className="absolute right-16 -top-8 w-32 h-32 bg-aurora-gold/10 rounded-full" />
          </div>
          <div className="relative px-8 py-10 md:flex items-center justify-between gap-6">
            <div>
              <p className="text-aurora-gold font-mono text-xs tracking-widest uppercase mb-2">Limited Offer</p>
              <h3 className="font-display text-white text-2xl md:text-3xl font-bold">
                Buy Online, Pick Up In Store
              </h3>
              <p className="text-blue-200 mt-2 text-sm font-body">
                Choose BOPIS at checkout — available at all 10 Aurora store locations.
              </p>
            </div>
            <Link to="/shop" className="shrink-0 mt-6 md:mt-0 inline-block bg-aurora-gold text-aurora-navy font-body font-semibold px-8 py-3 rounded hover:bg-yellow-400 transition-colors">
              Shop & Pick Up
            </Link>
          </div>
        </div>
      </section>

      {/* ── Store Locator Preview ─────────────────────────────────── */}
      <section className="bg-aurora-pale py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="section-title">Aurora Store Locations</h2>
              <p className="text-gray-500 text-sm mt-1 font-body">10 locations across the US</p>
            </div>
            <Link to="/stores" className="text-aurora-mid hover:text-aurora-accent text-sm font-body font-medium">
              All stores →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {storeLoad
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="card p-5">
                    <div className="skeleton h-4 w-1/2 rounded mb-3" />
                    <div className="skeleton h-3 w-3/4 rounded mb-2" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                  </div>
                ))
              : stores.slice(0, 3).map((s, i) => <StoreCard key={s.ShipNode || i} store={s} index={i} />)
            }
          </div>
        </div>
      </section>
    </div>
  )
}

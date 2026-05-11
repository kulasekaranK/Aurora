import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchItemById, fetchInventoryItems, fetchNodeInventory, getPrice, normalizeItem } from '../api/products.js'
import { fetchStores } from '../api/stores.js'
import { useCart } from '../context/CartContext.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { SkeletonText } from '../components/Skeleton.jsx'

const GRADIENTS = [
  'from-indigo-500 to-purple-600', 'from-aurora-navy to-aurora-accent',
  'from-emerald-500 to-teal-400',  'from-pink-500 to-rose-400',
  'from-sky-400 to-cyan-300',      'from-amber-400 to-orange-500',
  'from-violet-500 to-fuchsia-400','from-blue-600 to-indigo-400',
]
const grad = (id = '') => GRADIENTS[id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length]

const getEmoji = (itemId = '', desc = '') => {
  const text = `${itemId} ${desc}`.toLowerCase()
  if (text.includes('dress')) return '👗'
  if (text.includes('shirt')) return '👔'
  if (text.includes('sweater')) return '🧥'
  if (text.includes('pant')) return '👖'
  if (text.includes('shoe')) return '👟'
  if (text.includes('pc') || text.includes('desktop') || text.includes('tv')) return '💻'
  if (text.includes('health') || text.includes('sanitizer') || text.includes('bottle')) return '🧴'
  if (text.includes('jacket') || text.includes('suit')) return '🧥'
  if (text.includes('skirt')) return '👗'
  if (text.includes('handbag') || text.includes('bag')) return '👜'
  return '🛍️'
}

export default function ProductDetail() {
  const { itemId } = useParams()
  const { addItem, items: cartItems } = useCart()

  const [item,     setItem]     = useState(null)
  const [related,  setRelated]  = useState([])
  const [stores,   setStores]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [qty,      setQty]      = useState(1)
  const [bopis,    setBopis]    = useState(false)
  const [selStore, setSelStore] = useState('')
  const [added,    setAdded]    = useState(false)

  useEffect(() => {
    setLoading(true); setError(null); setAdded(false)
    fetchItemById(itemId)
      .then(data => setItem(data))
      .catch(() =>
        fetchInventoryItems({ max: 100 })
          .then(all => {
            const found = all.find(i => i.ItemID === itemId)
            if (found) setItem(found)
            else throw new Error('Item not found')
          })
      )
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))

    fetchInventoryItems({ max: 8 }).then(all =>
      setRelated(all.filter(i => i.ItemID !== itemId).slice(0, 4))
    ).catch(() => {})

    fetchStores(10).then(s => { setStores(s); if (s[0]) setSelStore(s[0].ShipNode || '') }).catch(() => {})
  }, [itemId])

  const handleAddToCart = () => {
    if (!item) return
    addItem(item, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  const price = item ? getPrice(item) : 0
  const inCart = cartItems.some(i => i.ItemID === itemId)
  const name = item?.ShortDescription || item?.ItemID || ''

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="skeleton rounded-xl h-80" />
        <div className="space-y-4 pt-4"><SkeletonText lines={6} /></div>
      </div>
    </div>
  )

  if (error || !item) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <p className="text-5xl mb-4">🔍</p>
      <h2 className="font-display text-2xl text-aurora-navy mb-2">Product Not Found</h2>
      <p className="text-gray-500 font-body mb-6">{error || `Item "${itemId}" could not be loaded.`}</p>
      <Link to="/shop" className="btn-secondary">Back to Shop</Link>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="text-sm font-body text-gray-500 mb-6 flex items-center gap-1.5">
        <Link to="/" className="hover:text-aurora-navy">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-aurora-navy">Shop</Link>
        <span>/</span>
        <span className="text-aurora-navy font-medium truncate max-w-xs">{name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">

        {/* ── Image ─────────────────────────────────────────── */}
        <div>
          {/* Main Image */}
          <div className="rounded-2xl h-80 md:h-[480px] relative overflow-hidden shadow-lg">

            {/* Layer 1: Gradient fallback (always underneath) */}
            <div className={`absolute inset-0 bg-gradient-to-br ${grad(item.ItemID)} flex flex-col items-center justify-center p-8`}>
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
              <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-black/10 rounded-full" />
              <span className="text-5xl mb-3 z-10">{getEmoji(item.ItemID, name)}</span>
              <span className="text-white font-display text-xl md:text-2xl font-bold text-center drop-shadow z-10 leading-snug max-w-sm">
                {name}
              </span>
              <span className="text-white/60 font-mono text-sm mt-2 z-10">{item.ItemID}</span>
            </div>

            {/* Layer 2: Real image on top */}
            {item.ImageUrl && (
              <img
                src={item.ImageUrl}
                alt={name}
                className="absolute inset-0 w-full h-full object-cover z-10"
                onError={(e) => e.target.remove()}
              />
            )}
          </div>

          {/* Thumbnail row */}
          <div className="flex gap-2 mt-3">
            {/* Real image thumbnail */}
            <div className="h-16 w-16 rounded-lg overflow-hidden relative ring-2 ring-aurora-blue">
              <div className={`absolute inset-0 bg-gradient-to-br ${grad(item.ItemID)}`} />
              {item.ImageUrl && (
                <img
                  src={item.ImageUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover z-10"
                  onError={(e) => e.target.remove()}
                />
              )}
            </div>
            {/* Extra gradient thumbnails */}
            {[1, 2].map(n => (
              <div
                key={n}
                className={`bg-gradient-to-br ${grad(item.ItemID + n)} h-16 w-16 rounded-lg cursor-pointer ring-2 ring-transparent hover:ring-aurora-blue/50 transition-all`}
              />
            ))}
          </div>
        </div>

        {/* ── Details ───────────────────────────────────────── */}
        <div className="flex flex-col">
          <div className="badge bg-aurora-light text-aurora-blue mb-2 self-start">
            {item.ItemID}
          </div>
          <h1 className="font-display text-2xl md:text-3xl text-aurora-navy font-bold leading-snug">
            {name}
          </h1>

          <div className="flex items-center gap-3 mt-3">
            <span className="font-display text-3xl text-aurora-accent font-bold">${price.toFixed(2)}</span>
            <span className="text-gray-300 line-through text-lg font-body">${(price * 1.2).toFixed(2)}</span>
            <span className="badge bg-green-100 text-green-700">In Stock</span>
          </div>

          {item.Description && (
            <p className="text-gray-600 font-body text-sm mt-4 leading-relaxed border-t border-gray-100 pt-4">
              {item.Description}
            </p>
          )}

          {/* Qty */}
          <div className="mt-6 flex items-center gap-3">
            <label className="text-sm font-body font-medium text-aurora-navy">Qty:</label>
            <div className="flex items-center border border-gray-200 rounded overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1, q - 1))}
                className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-aurora-navy font-bold transition-colors">−</button>
              <span className="px-4 py-2 text-sm font-mono font-medium bg-white border-x border-gray-200">{qty}</span>
              <button onClick={() => setQty(q => q + 1)}
                className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-aurora-navy font-bold transition-colors">+</button>
            </div>
          </div>

          {/* BOPIS Toggle */}
          <div className="mt-5 p-4 bg-aurora-pale rounded-xl border border-aurora-light">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={bopis} onChange={e => setBopis(e.target.checked)}
                className="w-4 h-4 accent-aurora-blue rounded" />
              <div>
                <p className="font-body font-medium text-aurora-navy text-sm">Buy Online, Pick Up In Store (BOPIS)</p>
                <p className="text-xs text-gray-500 mt-0.5">Pick up today at a nearby Aurora store</p>
              </div>
            </label>

            {bopis && (
              <div className="mt-3">
                <label className="text-xs font-body text-gray-600 block mb-1">Select Store</label>
                <select
                  value={selStore}
                  onChange={e => setSelStore(e.target.value)}
                  className="input-field text-sm"
                >
                  {stores.map(s => (
                    <option key={s.ShipNode} value={s.ShipNode}>
                      {s.ShipNodeDescription || s.ShipNode}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="mt-5 flex gap-3">
            <button
              onClick={handleAddToCart}
              className={`flex-1 py-3 rounded font-body font-semibold text-sm transition-all duration-200 active:scale-95 ${
                added
                  ? 'bg-green-600 text-white'
                  : 'bg-aurora-accent text-white hover:bg-red-700'
              }`}
            >
              {added ? '✓ Added to Cart!' : `Add to Cart · $${(price * qty).toFixed(2)}`}
            </button>
            <Link to="/cart"
              className="px-4 py-3 rounded border-2 border-aurora-blue text-aurora-blue font-body font-semibold text-sm hover:bg-aurora-blue hover:text-white transition-all duration-200">
              View Cart
            </Link>
          </div>

          {/* Metadata */}
          <div className="mt-6 pt-4 border-t border-gray-100 space-y-1.5 text-xs font-mono text-gray-400">
            <div><span className="text-gray-500">Item ID:</span> {item.ItemID}</div>
            <div><span className="text-gray-500">UOM:</span> {item.UnitOfMeasure || 'EACH'}</div>
            <div><span className="text-gray-500">Org:</span> Aurora-Corp</div>
            {item.ImageUrl && (
              <div><span className="text-gray-500">Image:</span> {item.ImageUrl}</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Related Products ─────────────────────────────────── */}
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="section-title mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map(p => <ProductCard key={p.ItemID} item={p} compact />)}
          </div>
        </section>
      )}
    </div>
  )
}
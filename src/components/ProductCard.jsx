import React from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { getPrice } from '../api/products.js'

const GRADIENTS = [
  'from-indigo-500 to-purple-600',
  'from-aurora-navy to-aurora-accent',
  'from-emerald-500 to-teal-400',
  'from-pink-500 to-rose-400',
  'from-sky-400 to-cyan-300',
  'from-amber-400 to-orange-500',
  'from-violet-500 to-fuchsia-400',
  'from-blue-600 to-indigo-400',
]

const gradient = (itemId) => {
  const idx = (itemId || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length
  return GRADIENTS[idx]
}

const getEmoji = (itemId = '', desc = '') => {
  const text = `${itemId} ${desc}`.toLowerCase()
  if (text.includes('dress')) return '👗'
  if (text.includes('shirt')) return '👔'
  if (text.includes('sweater')) return '🧥'
  if (text.includes('pant')) return '👖'
  if (text.includes('shoe')) return '👟'
  if (text.includes('pc') || text.includes('desktop') || text.includes('tv')) return '💻'
  if (text.includes('health') || text.includes('sanitizer') || text.includes('bottle')) return '🧴'
  if (text.includes('grocery')) return '🛒'
  if (text.includes('jacket') || text.includes('suit')) return '🧥'
  if (text.includes('skirt')) return '👗'
  if (text.includes('handbag') || text.includes('bag')) return '👜'
  return '🛍️'
}

export default function ProductCard({ item, compact = false }) {
  const { addItem, items } = useCart()
  const price = getPrice(item)
  const inCart = items.some(i => i.ItemID === item.ItemID)
  const grad = gradient(item.ItemID)
  const name = item.ShortDescription || item.ItemID

  return (
    <div className="card group flex flex-col overflow-hidden animate-fade-in">
      {/* Image with gradient underneath */}
      <Link to={`/product/${item.ItemID}`} className="block shrink-0">
        <div className={`relative ${compact ? 'h-36' : 'h-48'} overflow-hidden`}>

          {/* Layer 1: Gradient background (always visible underneath) */}
          <div className={`absolute inset-0 bg-gradient-to-br ${grad} flex flex-col items-center justify-center p-3`}>
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />
            <div className="absolute -left-2 -bottom-2 w-14 h-14 bg-black/10 rounded-full" />
            <span className="text-3xl mb-1 z-10">{getEmoji(item.ItemID, name)}</span>
            <span className="text-white font-display font-semibold text-center text-sm leading-snug z-10 drop-shadow px-2 line-clamp-2">
              {name}
            </span>
            <span className="text-white/60 text-xs font-mono mt-1 z-10">{item.ItemID}</span>
          </div>

          {/* Layer 2: Real image on top (covers gradient if loads successfully) */}
          {item.ImageUrl && (
            <img
              src={item.ImageUrl}
              alt={name}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover z-10 group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Image failed to load - remove it so gradient shows
                e.target.remove()
              }}
            />
          )}

        </div>
      </Link>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <Link to={`/product/${item.ItemID}`}>
          <h3 className="font-body font-medium text-aurora-navy text-sm leading-snug hover:text-aurora-mid transition-colors line-clamp-2 min-h-[2.5rem]">
            {name}
          </h3>
        </Link>
        <p className="text-gray-400 font-mono text-xs mt-0.5">{item.ItemID}</p>

        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <span className="font-display text-aurora-accent font-bold text-lg">
            ${price.toFixed(2)}
          </span>
          <button
            onClick={() => addItem(item)}
            className={`text-xs font-body font-medium px-3 py-1.5 rounded transition-all duration-200 active:scale-95 ${
              inCart
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-aurora-blue text-white hover:bg-aurora-mid'
            }`}
          >
            {inCart ? '✓ In Cart' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'

const gradients = [
  'from-violet-500 to-fuchsia-500',
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-red-500',
  'from-indigo-500 to-purple-600'
]
const grad = (id='') => gradients[id.split('').reduce((a,c)=>a+c.charCodeAt(0),0) % gradients.length]

export default function Cart() {
  const { items, removeItem, updateQty, subtotal, clearCart } = useCart()
  const navigate = useNavigate()

  // const shipping = subtotal >= 75 ? 0 : 9.99
  const shipping = 0
  // const tax = subtotal * 0.08
  const tax = 0
  const total = subtotal + shipping + tax

  if (!items.length) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-aurora-light flex items-center justify-center text-4xl">
          🛒
        </div>
        <h2 className="font-display text-3xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
        <p className="text-slate-500 font-body mb-8">Add products to continue shopping.</p>
        <Link to="/shop" className="rounded-xl bg-aurora-navy text-white px-8 py-3 font-semibold hover:bg-slate-800 transition-colors">
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">Shopping Cart</h1>
          <p className="text-slate-500 text-sm font-body mt-1">{items.length} items in cart</p>
        </div>
        <button
          onClick={clearCart}
          className="text-sm text-red-500 hover:text-red-600 underline underline-offset-2"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr,360px] gap-8">
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.ItemID} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex gap-4">
                <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${grad(item.ItemID)} flex items-center justify-center text-white text-center px-2 text-xs font-semibold shrink-0`}>
                  {item.ShortDescription || item.ItemID}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 font-semibold text-sm">{item.ShortDescription || item.ItemID}</p>
                  <p className="text-xs text-slate-400 font-mono mt-1">{item.ItemID}</p>
                  <p className="text-sm text-slate-600 mt-2">${item.price?.toFixed(2)} each</p>

                  <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                      <button onClick={() => item.qty > 1 ? updateQty(item.ItemID, item.qty - 1) : removeItem(item.ItemID)}
                        className="px-4 py-2 hover:bg-slate-50 transition-colors">−</button>
                      <div className="px-5 py-2 border-x border-slate-200 font-mono">{item.qty}</div>
                      <button onClick={() => updateQty(item.ItemID, item.qty + 1)}
                        className="px-4 py-2 hover:bg-slate-50 transition-colors">+</button>
                    </div>

                    <div className="flex items-center gap-4">
                      <p className="font-display text-xl font-bold text-aurora-navy">
                        ${(item.price * item.qty).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeItem(item.ItemID)}
                        className="text-sm text-red-500 hover:text-red-600 underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Link to="/shop" className="inline-block text-sm text-aurora-mid hover:text-aurora-accent underline">
            ← Continue shopping
          </Link>
        </div>

        <div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sticky top-24">
            <h2 className="font-display text-xl font-bold text-slate-900 mb-5">Order Summary</h2>

            <div className="space-y-3 text-sm font-body">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                  {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
            </div>
{/* 
            {subtotal < 5 && (
              <div className="mt-4 rounded-2xl bg-aurora-light p-3 text-sm text-aurora-navy font-body">
                Add ${(5 - subtotal).toFixed(2)} more for free shipping.
              </div>
            )} */}

            <div className="mt-5 pt-5 border-t border-slate-200 flex justify-between items-end">
              <div>
                <p className="text-sm text-slate-500 font-body">Total</p>
                <p className="font-display text-3xl font-bold text-aurora-navy">${total.toFixed(2)}</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="mt-6 w-full rounded-xl bg-aurora-navy text-white py-3.5 font-semibold hover:bg-slate-800 transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
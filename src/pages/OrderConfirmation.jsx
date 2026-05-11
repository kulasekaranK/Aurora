import React from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'

export default function OrderConfirmation() {
  const { state } = useLocation()

  if (!state?.orderNo) return <Navigate to="/" replace />

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center animate-fade-in">
      <div className="w-20 h-20 mx-auto rounded-full bg-green-100 text-green-700 flex items-center justify-center text-3xl mb-6">
        ✓
      </div>
      <h1 className="font-display text-3xl font-bold text-slate-900">Order Confirmed</h1>
      <p className="text-slate-500 mt-3 font-body">
        Thank you for your purchase. Your order has been placed successfully.
      </p>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-left">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-mono mb-2">Order Number</p>
            <p className="font-display text-2xl font-bold text-aurora-navy">#{state.orderNo}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-mono mb-2">Delivery</p>
            <p className="text-sm font-body text-slate-700">
              {state.isBopis ? `Store Pickup${state.storeName ? ` · ${state.storeName}` : ''}` : 'Home Delivery'}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-mono mb-3">Items</p>
          <div className="space-y-2">
            {state.items?.map((item) => (
              <div key={item.ItemID} className="flex justify-between text-sm">
                <span className="text-slate-700">{item.ShortDescription || item.ItemID} × {item.qty}</span>
                <span className="font-semibold text-slate-900">${(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6 flex justify-between items-center">
          <span className="text-slate-600 font-body">Estimated Total</span>
          <span className="font-display text-2xl font-bold text-aurora-navy">${state.total?.toFixed(2)}</span>
        </div>
      </div>
      {state?.paymentToken && (
        <div className="mt-6 border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-mono mb-2">Payment</p>
              <p className="text-sm font-semibold text-green-700">✅ Authorized via {state.paymentGateway || 'Razorpay'}</p>
              <p className="text-xs font-mono text-slate-500 mt-1">{state.paymentToken}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Status</p>
              <span className="inline-block rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-semibold">
                AUTHORIZED
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Payment will be captured automatically when your order is fulfilled.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <Link
          to="/track"
          state={{ prefillOrder: state.orderNo }}
          className="rounded-xl bg-aurora-navy text-white px-6 py-3 font-semibold hover:bg-slate-800 transition-colors"
        >
          Track Order
        </Link>
        <Link
          to="/my-orders"
          className="rounded-xl border border-slate-200 px-6 py-3 font-semibold hover:bg-slate-50 transition-colors"
        >
          My Orders
        </Link>
        <Link
          to="/shop"
          className="rounded-xl border border-slate-200 px-6 py-3 font-semibold hover:bg-slate-50 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { fetchMyOrders, cancelOrder } from '../api/orders.js'

const getOrderTotal = (order) => {
  const lineSubTotal = parseFloat(order?.OverallTotals?.LineSubTotal || 0)
  if (lineSubTotal > 0) return lineSubTotal
  const grandTotal = parseFloat(order?.OverallTotals?.GrandTotal || 0)
  if (grandTotal > 0) return grandTotal
  const totalAmount = parseFloat(order?.PriceInfo?.TotalAmount || 0)
  if (totalAmount > 0) return totalAmount
  return 0
}

const getStatusColor = (status) => {
  if (!status) return 'bg-gray-100 text-gray-600'
  const s = status.toLowerCase()
  if (s.includes('deliver') || s.includes('complet')) return 'bg-green-100 text-green-700'
  if (s.includes('ship') || s.includes('included')) return 'bg-blue-100 text-blue-700'
  if (s.includes('cancel')) return 'bg-red-100 text-red-700'
  if (s.includes('hold')) return 'bg-amber-100 text-amber-700'
  if (s.includes('release') || s.includes('schedule')) return 'bg-yellow-100 text-yellow-700'
  return 'bg-aurora-light text-aurora-blue'
}

export default function MyOrders() {
  const { user, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cancellingOrder, setCancellingOrder] = useState(null)

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    loadOrders()
  }, [isLoggedIn])

  const loadOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const email = user?.email
      if (!email) throw new Error('No email found')
      const data = await fetchMyOrders(email, 50)
      setOrders(data)
    } catch (e) {
      setError(e.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async (orderNo) => {
    if (!window.confirm(`Cancel order #${orderNo}? This cannot be undone.`)) return
    setCancellingOrder(orderNo)
    try {
      await cancelOrder(orderNo)
      await loadOrders()
    } catch (e) {
      let msg = 'Cancel failed'
      if (e.response?.data) {
        const errData = e.response.data
        if (Array.isArray(errData) && errData[0]?.ErrorDescription) {
          msg = errData[0].ErrorDescription
        }
      } else if (e.message) {
        msg = e.message
      }
      alert(msg)
    } finally {
      setCancellingOrder(null)
    }
  }

  if (!isLoggedIn) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">My Orders</h1>
          <p className="text-slate-500 text-sm mt-1">Orders for {user?.email}</p>
        </div>
        <Link to="/shop" className="rounded-xl bg-aurora-navy text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800 transition-colors">
          Continue Shopping
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-5">
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-slate-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="rounded-3xl bg-white border border-slate-200 p-12 shadow-sm text-center">
          <p className="text-4xl mb-3">📦</p>
          <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">No Orders Yet</h2>
          <p className="text-slate-500 text-sm mb-6">Start shopping to see your orders here.</p>
          <Link to="/shop" className="rounded-xl bg-aurora-navy text-white px-8 py-3 font-semibold hover:bg-slate-800 transition-colors">
            Shop Now
          </Link>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400 font-mono">{orders.length} orders found</p>

          {orders.map((order, idx) => {
            const status = order.MaxOrderStatusDesc || order.Status || 'Processing'
            const total = getOrderTotal(order)
            const orderDate = order.OrderDate
              ? new Date(order.OrderDate).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric'
                })
              : ''
            const isBopis = order.DeliveryMethod === 'PICK' || !!order.ShipNode
            const isOnHold = order.HoldFlag === 'Y'
            const canCancel = !status.toLowerCase().includes('cancel') &&
              !status.toLowerCase().includes('deliver') &&
              !status.toLowerCase().includes('complet')

            return (
              <div key={order.OrderNo || idx} className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-display text-lg font-bold text-slate-900">#{order.OrderNo}</h3>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getStatusColor(status)}`}>
                        {status}
                      </span>
                      {isOnHold && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          On Hold
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      {orderDate && <span>📅 {orderDate}</span>}
                      <span>{isBopis ? '🏪 Store Pickup' : '📦 Home Delivery'}</span>
                      {order.ShipNode && (
                        <span className="text-aurora-mid">{order.ShipNode}</span>
                      )}
                    </div>

                    {order.PersonInfoShipTo && (
                      <p className="text-xs text-slate-400 mt-1.5 truncate">
                        Ship to: {order.PersonInfoShipTo.FirstName} {order.PersonInfoShipTo.LastName}
                        {order.PersonInfoShipTo.City &&
                          ` · ${order.PersonInfoShipTo.City}, ${order.PersonInfoShipTo.State}`}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-display text-xl font-bold text-aurora-navy">
                      {total > 0 ? `$${total.toFixed(2)}` : '—'}
                    </p>
                    <p className="text-xs text-slate-400 mb-2">{order.EnterpriseCode}</p>

                    <div className="flex flex-col gap-1.5 items-end">
                      <Link
                        to="/track"
                        state={{ prefillOrder: order.OrderNo }}
                        className="text-xs text-aurora-mid hover:text-aurora-accent underline"
                      >
                        Track →
                      </Link>

                      {canCancel && (
                        <button
                          onClick={() => handleCancelOrder(order.OrderNo)}
                          disabled={cancellingOrder === order.OrderNo}
                          className="text-xs text-red-400 hover:text-red-600 underline disabled:opacity-50"
                        >
                          {cancellingOrder === order.OrderNo ? 'Cancelling...' : '❌ Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-8 grid grid-cols-3 gap-3">
        {[
          ['🛒 Shop', '/shop'],
          ['📍 My Account', '/account'],
          ['🏪 Stores', '/stores'],
        ].map(([label, path]) => (
          <Link
            key={path}
            to={path}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 text-center text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
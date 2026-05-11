import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { fetchOrderByNo } from '../api/orders.js'

const STATUS_STEPS = [
  { key: 'Created', label: 'Placed' },
  { key: 'Released', label: 'Released' },
  { key: 'Included In Shipment', label: 'In Shipment' },
  { key: 'Shipped', label: 'Shipped' },
]

const getStatusIndex = (status) => {
  if (!status) return 0
  const s = status.toLowerCase()
  if (s.includes('deliver') || s.includes('complet')) return 4
  if (s.includes('ship') && !s.includes('included')) return 3
  if (s.includes('included') || s.includes('pack')) return 2
  if (s.includes('release') || s.includes('schedule')) return 1
  return 0
}

const getItemName = (line) =>
  line?.Item?.ItemShortDesc ||
  line?.Item?.ItemDesc ||
  line?.Item?.CustomerItemDesc ||
  line?.Item?.ItemID ||
  'Unknown Item'

const getLinePrice = (line) =>
  parseFloat(
    line?.LineOverallTotals?.LineTotal ||
    line?.LinePriceInfo?.LineTotal ||
    line?.LineRemainingTotals?.LineTotal ||
    0
  )

const getLineUnitPrice = (line) =>
  parseFloat(
    line?.LineOverallTotals?.UnitPrice ||
    line?.LinePriceInfo?.UnitPrice ||
    0
  )

const getOrderTotal = (order) => {
  const lineSubTotal = parseFloat(order?.OverallTotals?.LineSubTotal || 0)
  if (lineSubTotal > 0) return lineSubTotal
  const grandTotal = parseFloat(order?.OverallTotals?.GrandTotal || 0)
  if (grandTotal > 0) return grandTotal
  const totalAmount = parseFloat(order?.PriceInfo?.TotalAmount || 0)
  if (totalAmount > 0) return totalAmount
  return 0
}

const isBopisOrder = (order) => {
  const lines = order?.OrderLines?.OrderLine
  if (!lines) return false
  const first = Array.isArray(lines) ? lines[0] : lines
  return first?.DeliveryMethod === 'PICK' || !!first?.ShipNode
}

const getShipNode = (order) => {
  const lines = order?.OrderLines?.OrderLine
  if (!lines) return null
  const first = Array.isArray(lines) ? lines[0] : lines
  return first?.ShipNode || order?.ShipNode || null
}

function Timeline({ status }) {
  const idx = getStatusIndex(status)
  return (
    <div className="flex items-start justify-between mt-6 relative">
      <div className="absolute top-4 left-8 right-8 h-px bg-slate-200">
        <div className="h-full bg-green-400" style={{ width: `${(idx / (STATUS_STEPS.length - 1)) * 100}%` }} />
      </div>
      {STATUS_STEPS.map((step, i) => (
        <div key={step.key} className="relative z-10 flex-1 flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            i <= idx ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
          }`}>
            {i <= idx ? '✓' : i + 1}
          </div>
          <span className="text-[11px] text-slate-500 mt-2 text-center hidden sm:block">{step.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function TrackOrder() {
  const location = useLocation()
  const [orderNo, setOrderNo] = useState(location.state?.prefillOrder || '')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (location.state?.prefillOrder) handleSearch(location.state.prefillOrder)
  }, [])

  const handleSearch = async (no = orderNo) => {
    if (!no.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchOrderByNo(no.trim())
      setOrder(data)
    } catch (e) {
      setError(e.message || 'Failed to retrieve order')
    } finally {
      setLoading(false)
    }
  }

  const lines = order?.OrderLines?.OrderLine
    ? (Array.isArray(order.OrderLines.OrderLine)
        ? order.OrderLines.OrderLine
        : [order.OrderLines.OrderLine])
    : []

  const orderTotal = order ? getOrderTotal(order) : 0
  const bopis = order ? isBopisOrder(order) : false
  const shipNode = order ? getShipNode(order) : null
  const orderStatus = order?.MaxOrderStatusDesc || order?.Status || 'Created'

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-slate-900">Track Order</h1>
      <p className="text-slate-500 mt-2 text-sm font-body">Enter an order number to view latest OMS status.</p>

      <div className="mt-6 rounded-3xl bg-white border border-slate-200 shadow-sm p-5">
        <div className="flex gap-3">
          <input
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Order number (e.g. Y100000635)"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-aurora-mid/20"
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading || !orderNo.trim()}
            className="rounded-xl bg-aurora-navy text-white px-5 py-3 font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching…' : 'Track'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {order && !loading && (
        <div className="space-y-5 mt-6">
          <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-mono">Order Number</p>
                <p className="font-display text-3xl font-bold text-aurora-navy mt-1">#{order.OrderNo}</p>
                <p className="text-sm text-slate-500 mt-2 font-body">
                  {order.OrderDate ? new Date(order.OrderDate).toLocaleString() : ''}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block rounded-full px-3 py-1 text-sm font-semibold bg-aurora-light text-aurora-navy">
                  {orderStatus}
                </span>
                <p className="mt-2 text-xs text-slate-500">{bopis ? '🏪 Store Pickup' : '📦 Home Delivery'}</p>
              </div>
            </div>
            <Timeline status={orderStatus} />
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6">
            <h2 className="font-display text-xl font-bold text-slate-900 mb-4">Delivery Details</h2>
            <div className="text-sm text-slate-700 space-y-1">
              <p className="font-semibold">{order.PersonInfoShipTo?.FirstName} {order.PersonInfoShipTo?.LastName}</p>
              {bopis ? (
                <>
                  <p>Pickup Store: <span className="font-medium text-aurora-mid">{shipNode}</span></p>
                  {order.PersonInfoShipTo?.AddressLine1 && <p>{order.PersonInfoShipTo.AddressLine1}</p>}
                </>
              ) : (
                <>
                  {order.PersonInfoShipTo?.AddressLine1 && <p>{order.PersonInfoShipTo.AddressLine1}</p>}
                  <p>{[order.PersonInfoShipTo?.City, order.PersonInfoShipTo?.State, order.PersonInfoShipTo?.ZipCode].filter(Boolean).join(', ')}</p>
                </>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6">
            <h2 className="font-display text-xl font-bold text-slate-900 mb-4">Items Ordered</h2>
            <div className="divide-y divide-slate-100">
              {lines.map((line, idx) => (
                <div key={idx} className="py-4 flex justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{getItemName(line)}</p>
                    <p className="text-xs text-slate-500 mt-1 font-mono">{line.Item?.ItemID}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Qty {parseFloat(line.OrderedQty || 0).toFixed(0)} · ${getLineUnitPrice(line).toFixed(2)} each
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">${getLinePrice(line).toFixed(2)}</p>
                    <p className="text-xs text-slate-500 mt-1">{line.MaxLineStatusDesc || line.Status || orderStatus}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-5 border-t border-slate-200 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>${parseFloat(order?.OverallTotals?.LineSubTotal || orderTotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>{bopis ? 'Store Pickup' : 'FREE'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax</span>
                <span>${parseFloat(order?.OverallTotals?.GrandTax || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-slate-900 pt-3 border-t border-slate-200">
                <span>Total</span>
                <span>${orderTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <details className="text-xs">
            <summary className="cursor-pointer text-slate-400 hover:text-slate-600 font-mono">Raw OMS Response</summary>
            <pre className="mt-3 bg-slate-950 text-green-400 p-4 rounded-2xl overflow-auto text-xs">
              {JSON.stringify(order, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )
}
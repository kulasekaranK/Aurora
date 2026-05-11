import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import {
  getCustomerAddresses,
  addCustomerAddressCombined,
  deleteCustomerAddress,
  setDefaultAddress
} from '../api/customer.js'

export default function Account() {
  const { user, isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()

  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [newAddr, setNewAddr] = useState({
    firstName: '', lastName: '', address1: '',
    city: '', state: '', zip: '', country: 'US',
    phone: '', isDefault: false, email: ''
  })

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    loadAddresses()
    setNewAddr(prev => ({
      ...prev,
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      email: user?.email || ''
    }))
  }, [isLoggedIn, user])

  const loadAddresses = async () => {
    if (!user?.customerKey) return
    setLoading(true)
    try {
      const addrs = await getCustomerAddresses(user.customerKey)
      setAddresses(addrs)
    } finally {
      setLoading(false)
    }
  }

  const update = (e) => setNewAddr(prev => ({
    ...prev,
    [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
  }))

  const handleSave = async (e) => {
    e.preventDefault()
    if (!user?.customerKey) return
    setSaving(true)
    try {
      await addCustomerAddressCombined(user.customerKey, newAddr)
      setSuccess('Address saved successfully.')
      setShowForm(false)
      setNewAddr({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        address1: '',
        city: '',
        state: '',
        zip: '',
        country: 'US',
        phone: user?.phone || '',
        isDefault: false,
        email: user?.email || ''
      })
      await loadAddresses()
      setTimeout(() => setSuccess(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (addressId) => {
    if (!window.confirm('Remove this address?')) return
    await deleteCustomerAddress(user.customerKey, addressId)
    await loadAddresses()
  }

  const handleSetDefault = async (addressId) => {
    await setDefaultAddress(user.customerKey, addressId)
    await loadAddresses()
    setSuccess('Default address updated.')
    setTimeout(() => setSuccess(''), 3000)
  }

  if (!isLoggedIn) return null

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-fade-in">
      <h1 className="font-display text-3xl font-bold text-slate-900 mb-8">My Account</h1>

      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-aurora-navy text-white flex items-center justify-center text-xl font-bold">
              {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-lg">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              {user?.customerKey && (
                <p className="text-xs text-slate-400 font-mono mt-1">Customer ID: {user.customerKey}</p>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="rounded-xl border border-red-200 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {success && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 mb-5">
          ✅ {success}
        </div>
      )}

      <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-bold text-slate-900">Saved Addresses</h2>
          <button
            onClick={() => setShowForm(v => !v)}
            className="rounded-xl bg-aurora-navy text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add Address'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSave} className="rounded-2xl bg-slate-50 border border-slate-200 p-5 mb-5 space-y-4">
            <h3 className="font-semibold text-slate-900">New Address</h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <input name="firstName" value={newAddr.firstName} onChange={update} required placeholder="First name"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none" />
              <input name="lastName" value={newAddr.lastName} onChange={update} required placeholder="Last name"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none" />
            </div>

            <input name="address1" value={newAddr.address1} onChange={update} required placeholder="Address line 1"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none" />

            <div className="grid sm:grid-cols-3 gap-4">
              <input name="city" value={newAddr.city} onChange={update} required placeholder="City"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none" />
              <input name="state" value={newAddr.state} onChange={update} required placeholder="State"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none" />
              <input name="zip" value={newAddr.zip} onChange={update} required placeholder="ZIP"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <input name="phone" value={newAddr.phone} onChange={update} placeholder="Phone"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none" />
              <select
                name="country"
                value={newAddr.country}
                onChange={update}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="GB">United Kingdom</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                name="isDefault"
                checked={newAddr.isDefault}
                onChange={update}
                className="accent-aurora-blue"
              />
              Set as default address
            </label>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-aurora-navy text-white py-3 font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Address'}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-slate-400 py-6 text-center">Loading addresses…</p>
        ) : addresses.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="text-4xl mb-3">📍</p>
            <p className="text-sm">No addresses saved yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map(addr => (
              <div key={addr.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-sm text-slate-700">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-900">{addr.FirstName} {addr.LastName}</p>
                      {addr.IsDefaultContact === 'Y' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-aurora-light text-aurora-navy">
                          Default
                        </span>
                      )}
                    </div>
                    <p>{addr.AddressLine1}</p>
                    <p>{[addr.City, addr.State, addr.ZipCode].filter(Boolean).join(', ')} {addr.Country}</p>
                    {addr.DayPhone && <p className="text-xs text-slate-500 mt-1">{addr.DayPhone}</p>}
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {addr.IsDefaultContact !== 'Y' && (
                      <button onClick={() => handleSetDefault(addr.id)} className="text-xs text-aurora-mid underline">
                        Set Default
                      </button>
                    )}
                    <button onClick={() => handleDelete(addr.id)} className="text-xs text-red-500 underline">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          ['🛒 Shop', '/shop'],
          ['📦 My Orders', '/my-orders'],
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
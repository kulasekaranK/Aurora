import React, { useEffect, useState } from 'react'
import { fetchStores } from '../api/stores.js'
import StoreCard from '../components/StoreCard.jsx'

export default function StoreLocator() {
  const [stores,  setStores]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    fetchStores(20)
      .then(setStores)
      .catch(e => setError(e.message || 'Failed to load stores'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = stores.filter(s => {
    const q = search.toLowerCase()
    const name = (s.ShipNodeDescription || s.ShipNode || '').toLowerCase()
    const city = (s.OwnerOrganization?.City || '').toLowerCase()
    return name.includes(q) || city.includes(q)
  })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="section-title text-3xl mb-2">Store Locator</h1>
        <p className="text-gray-500 font-body text-sm">
          Find an Aurora store near you — {stores.length} locations across the US
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto mb-8">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by store name or city…"
            className="input-field pl-9 text-sm"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-lg mx-auto bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 font-body mb-6 flex gap-2">
          <span>⚠️</span>
          <div>
            <p className="font-medium">Could not load stores</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5">
              <div className="skeleton h-4 w-1/2 rounded mb-3" />
              <div className="skeleton h-3 w-3/4 rounded mb-2" />
              <div className="skeleton h-3 w-1/2 rounded mb-2" />
              <div className="skeleton h-3 w-2/3 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Store grid */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🏪</p>
              <p className="font-body text-gray-400">
                {search ? `No stores found for "${search}"` : 'No stores available'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((store, i) => (
                <StoreCard key={store.ShipNode || i} store={store} index={i} />
              ))}
            </div>
          )}

          {/* Count */}
          {filtered.length > 0 && (
            <p className="text-center text-xs font-mono text-gray-400 mt-6">
              Showing {filtered.length} of {stores.length} Aurora store locations
            </p>
          )}
        </>
      )}

      {/* OMS info */}
      <div className="mt-10 bg-aurora-pale border border-aurora-light rounded-xl p-5 text-center">
        <p className="text-xs font-mono text-gray-400">
          Store data loaded from{' '}
          <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200 text-aurora-mid">
            GET /smcfs/restapi/ship_node
          </code>
          {' '}via IBM Sterling OMS
        </p>
      </div>
    </div>
  )
}

import React from 'react'

const STORE_COLORS = [
  'border-aurora-accent', 'border-aurora-mid', 'border-emerald-500',
  'border-amber-500', 'border-purple-500', 'border-sky-500',
  'border-rose-500', 'border-teal-500', 'border-indigo-500', 'border-orange-500',
]

export default function StoreCard({ store, index = 0 }) {
  const name    = store.ShipNodeDescription || store.ShipNode || store.id || 'Aurora Store'
  const address = store.OwnerOrganization?.AddressLine1 || store.AddressLine1 || '—'
  const city    = store.OwnerOrganization?.City  || store.City  || ''
  const state   = store.OwnerOrganization?.State || store.State || ''
  const phone   = store.OwnerOrganization?.DayPhone || store.DayPhone || '(800) 555-0100'
  const nodeId  = store.ShipNode || store.id || ''
  const color   = STORE_COLORS[index % STORE_COLORS.length]

  return (
    <div className={`card p-5 border-l-4 ${color} animate-fade-in`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display font-semibold text-aurora-navy text-base leading-snug">{name}</h3>
          <p className="font-mono text-xs text-gray-400 mt-0.5">{nodeId}</p>
        </div>
        <div className="shrink-0 w-8 h-8 bg-aurora-pale rounded flex items-center justify-center text-aurora-blue">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 text-sm font-body text-gray-600">
        {address && address !== '—' && (
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>{address}</span>
          </div>
        )}
        {(city || state) && (
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>{[city, state].filter(Boolean).join(', ')}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span>{phone}</span>
        </div>
      </div>
    </div>
  )
}

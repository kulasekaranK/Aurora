import React from 'react'

export function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-48 w-full" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="flex justify-between items-center pt-2">
          <div className="skeleton h-5 w-16 rounded" />
          <div className="skeleton h-7 w-24 rounded" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton h-4 rounded ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}

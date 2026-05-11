import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

import ProductCard from '../components/ProductCard.jsx'
import { SkeletonCard } from '../components/Skeleton.jsx'
import { fetchInventoryItems, fetchItems, fetchCategories, getPrice, loadPriceList, loadModelItems, loadImageCache } from '../api/products.js'


const PAGE_SIZE = 12

export default function ProductList() {
  const { categoryId } = useParams()
  const navigate = useNavigate()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('default')
  const [priceRange, setPriceRange] = useState([0, 300])
  console.log(products);


  const loadProducts = useCallback(async () => {
    setLoading(true); setError(null)
    try {

      await Promise.all([loadPriceList(), loadModelItems(), loadImageCache()])
      // Load price list first
      await loadPriceList()

      // Fetch ALL items from catalog
      const catalogItems = await fetchItems({ max: 5000 })

      // Fetch inventory items for descriptions
      const inventoryItems = await fetchInventoryItems({ max: 5000 })

      // Build description map from inventory
      const descMap = {}
      inventoryItems.forEach(item => {
        if (item.ItemID) {
          descMap[item.ItemID] = {
            ShortDescription: item.ShortDescription,
            Description: item.Description
          }
        }
      })

      // Merge catalog with inventory descriptions
      const merged = catalogItems.map(item => ({
        ...item,
        ShortDescription: descMap[item.ItemID]?.ShortDescription
          || item.ShortDescription
          || item.ItemID,
        Description: descMap[item.ItemID]?.Description
          || item.Description
          || ''
      }))

      // Remove duplicates
      const unique = merged.filter((item, index, self) =>
        index === self.findIndex(t => t.ItemID === item.ItemID)
      )

      setProducts(unique)
    } catch (e) {
      setError(e.message || 'Failed to load products')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    loadProducts()
    fetchCategories(20).then(setCategories).catch(() => { })
  }, [loadProducts])

  useEffect(() => { setPage(1) }, [categoryId, sort, priceRange])

  // Client-side filter + sort
  const filtered = products
    .filter(p => {
      const price = getPrice(p)
      return price >= priceRange[0] && price <= priceRange[1]
    })
    .sort((a, b) => {
      if (sort === 'price-asc') return getPrice(a) - getPrice(b)
      if (sort === 'price-desc') return getPrice(b) - getPrice(a)
      if (sort === 'name-asc') return (a.ShortDescription || a.ItemID).localeCompare(b.ShortDescription || b.ItemID)
      if (sort === 'name-desc') return (b.ShortDescription || b.ItemID).localeCompare(a.ShortDescription || a.ItemID)
      return 0
    })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const currentCat = categoryId
    ? categories.find(c => c.CategoryID === categoryId)
    : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="text-sm font-body text-gray-500 mb-6 flex items-center gap-1.5">
        <Link to="/" className="hover:text-aurora-navy">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-aurora-navy">Shop</Link>
        {categoryId && (
          <>
            <span>/</span>
            <span className="text-aurora-navy font-medium">{categoryId}</span>
          </>
        )}
      </nav>

      <div className="flex flex-col md:flex-row gap-6">
        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className="md:w-56 shrink-0">
          {/* Categories */}
          <div className="card p-4 mb-4">
            <h3 className="font-body font-semibold text-aurora-navy text-sm uppercase tracking-wider mb-3">
              Categories
            </h3>
            <ul className="space-y-0.5 text-sm font-body">
              <li>
                <Link
                  to="/shop"
                  className={`block px-2 py-1.5 rounded transition-colors ${!categoryId ? 'bg-aurora-light text-aurora-blue font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  All Products
                </Link>
              </li>
              {categories.map(c => (
                <li key={c.CategoryID}>
                  <Link
                    to={`/category/${c.CategoryID}`}
                    className={`block px-2 py-1.5 rounded transition-colors ${categoryId === c.CategoryID
                        ? 'bg-aurora-light text-aurora-blue font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    {c.ShortDescription || c.CategoryID}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Price Range */}
          <div className="card p-4">
            <h3 className="font-body font-semibold text-aurora-navy text-sm uppercase tracking-wider mb-3">
              Price Range
            </h3>
            <div className="space-y-2 text-sm font-body">
              {[[0, 300], [0, 50], [50, 100], [100, 200], [200, 300]].map(([min, max]) => (
                <label key={`${min}-${max}`} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    checked={priceRange[0] === min && priceRange[1] === max}
                    onChange={() => setPriceRange([min, max])}
                    className="accent-aurora-blue"
                  />
                  <span className="text-gray-600">
                    {min === 0 && max === 300 ? 'All Prices' : `$${min} – $${max}`}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Main ────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h1 className="font-display text-xl text-aurora-navy font-bold">
                {categoryId || 'All Products'}
              </h1>
              {!loading && (
                <p className="text-gray-400 text-xs font-mono mt-0.5">
                  {filtered.length} items found
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 font-body">Sort:</label>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="input-field !w-auto text-xs py-1.5"
              >
                <option value="default">Featured</option>
                <option value="name-asc">Name A→Z</option>
                <option value="name-desc">Name Z→A</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-5 text-sm text-red-700 font-body flex items-start gap-2">
              <span>⚠️</span>
              <div>
                <p className="font-medium">Failed to load products</p>
                <p className="text-xs mt-1 text-red-500">{error}</p>
                <button onClick={loadProducts} className="mt-2 text-xs underline text-red-600">Retry</button>
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)
              : paged.length > 0
                ? paged.map(p => <ProductCard key={p.ItemID} item={p} />)
                : (
                  <div className="col-span-full text-center py-16 text-gray-400">
                    <p className="text-3xl mb-2">🛍️</p>
                    <p className="font-body">No products match the selected filters</p>
                  </div>
                )
            }
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-8 flex-wrap">
              {/* First Page */}
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-3 py-1.5 rounded border border-gray-200 text-sm font-body disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                «
              </button>

              {/* Previous */}
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded border border-gray-200 text-sm font-body disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                ←
              </button>

              {/* Smart page numbers */}
              {(() => {
                const pages = []
                const delta = 2 // pages around current

                // Always show page 1
                pages.push(1)

                // Left ellipsis
                if (page - delta > 2) pages.push('...')

                // Pages around current
                for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
                  pages.push(i)
                }

                // Right ellipsis
                if (page + delta < totalPages - 1) pages.push('...')

                // Always show last page
                if (totalPages > 1) pages.push(totalPages)

                return pages.map((pg, idx) =>
                  pg === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-sm text-gray-400">
                      …
                    </span>
                  ) : (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`px-3 py-1.5 rounded border text-sm font-body transition-colors ${page === pg
                          ? 'bg-aurora-blue text-white border-aurora-blue'
                          : 'border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      {pg}
                    </button>
                  )
                )
              })()}

              {/* Next */}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded border border-gray-200 text-sm font-body disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                →
              </button>

              {/* Last Page */}
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded border border-gray-200 text-sm font-body disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                »
              </button>

              {/* Page info */}
              <span className="text-xs text-gray-400 font-mono ml-2">
                Page {page} of {totalPages} ({filtered.length} items)
              </span>
            </div>
          )}
          {/* Jump to page */}
          {!loading && totalPages > 10 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <span className="text-xs text-gray-500 font-body">Go to page:</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={page}
                onChange={e => {
                  const val = parseInt(e.target.value)
                  if (val >= 1 && val <= totalPages) setPage(val)
                }}
                className="w-16 text-center border border-gray-200 rounded px-2 py-1 text-sm font-mono"
              />
              <span className="text-xs text-gray-400">of {totalPages}</span>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

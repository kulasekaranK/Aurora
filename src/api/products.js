import { apiClient } from './auth.js'

// ─── Price Cache ──────────────────────────────────────────────────────────────
let priceCache = {}
let priceCacheLoaded = false

// ─── Model Item Cache ──────────────────────────────────────────────────────
let modelItemSet = new Set()
let modelItemSetLoaded = false

export const loadModelItems = async () => {
  if (modelItemSetLoaded) return modelItemSet

  // If image cache is loaded, build from it (has IsModelItem data)
  if (imageCacheLoaded) {
    // Already loaded via loadImageCache
    modelItemSetLoaded = true
    return modelItemSet
  }

  try {
    const items = await fetchItemsWithImages({ max: 5000 })
    items.forEach(item => {
      if (item.IsModelItem) {
        modelItemSet.add(item.ItemID)
      }
    })
    modelItemSetLoaded = true
    console.log(`Model items found: ${modelItemSet.size}`)
  } catch (e) {
    console.error('Failed to load model items:', e.message)
  }

  return modelItemSet
}

// Add new function to fetch items with images using Order Hub's template
export const fetchItemsWithImages = async ({ itemId, max = 5000 } = {}) => {
  const payload = {
    CallingOrganizationCode: 'Aurora',
    DisplayLocalizedFieldInLocale: 'en_US'
  }

  if (itemId) {
    payload.ComplexQuery = {
      Or: {
        Exp: [{ Name: 'ItemID', QryType: 'EQ', Value: itemId }]
      }
    }
  }

  const res = await apiClient.post(
    '/invoke/getItemList?_templateKey=ycm_ui_api_buc_tpl_06',
    payload
  )

  const items = res.data?.Item || []
  const arr = Array.isArray(items) ? items : [items]
  return arr.map(normalizeItemWithImage)
}

// Normalize with image data
const normalizeItemWithImage = (raw) => {
  const pi = raw.PrimaryInformation || {}
  const cc = raw.ClassificationCodes || {}

  // Build image URL from ImageLocation + ImageID
  let imageUrl = null
  if (pi.ImageLocation && pi.ImageID && pi.ImageLocation !== '-' && pi.ImageID !== '-') {
    imageUrl = `${pi.ImageLocation}/${pi.ImageID}`
  }

  // Get parent model item from ClassificationCodes.Model
  const parentItemId = cc.Model || null

  return {
    ItemID:           raw.ItemID,
    ShortDescription: pi.ShortDescription || pi.Description || raw.ItemID,
    Description:      pi.Description || '',
    UnitCost:         parseFloat(pi.UnitCost || 0),
    ComputedUnitCost: parseFloat(pi.ComputedUnitCost || 0),
    UnitOfMeasure:    raw.UnitOfMeasure || 'EACH',
    CategoryID:       raw.CategoryList?.Category?.[0]?.CategoryID || '',
    CategoryPath:     raw.CategoryList?.Category?.[0]?.CategoryPath || '',
    IsModelItem:      pi.IsModelItem === 'Y',
    ItemType:         pi.ItemType || '',
    ImageUrl:         imageUrl,
    ImageID:          pi.ImageID || null,
    ImageLocation:    pi.ImageLocation || null,
    ParentItemId:     parentItemId,
    ManufacturerName: pi.ManufacturerName || '',
    KitCode:          pi.KitCode || '',
    IsPickupAllowed:  pi.IsPickupAllowed === 'Y',
    IsShippingAllowed: pi.IsShippingAllowed === 'Y',
    _raw: raw
  }
}

// Build image cache from items with images
let imageCacheLoaded = false
let imageCache = {}

export const loadImageCache = async () => {
  if (imageCacheLoaded) return imageCache

  try {
    const items = await fetchItemsWithImages({ max: 5000 })
    items.forEach(item => {
      if (item.ImageUrl) {
        imageCache[item.ItemID] = item.ImageUrl
      }
      // Also build model item set
      if (item.IsModelItem) {
        modelItemSet.add(item.ItemID)
      }
    })
    imageCacheLoaded = true
    modelItemSetLoaded = true
    console.log(`Image cache loaded: ${Object.keys(imageCache).length} items with images`)
    console.log(`Model items found: ${modelItemSet.size}`)
  } catch (e) {
    console.error('Image cache load failed:', e.message)
  }

  return imageCache
}

// Get image URL for an item
export const getImageUrl = (itemId) => {
  if (imageCache[itemId]) return imageCache[itemId]
  // Fallback to picsum
  // return `https://picsum.photos/seed/${encodeURIComponent(itemId)}/400/500`
}

// Fetch all prices from Aurora price lists
export const loadPriceList = async () => {
  if (priceCacheLoaded) return priceCache

  try {
    // Fetch from Aurora-Corp price list
    const res1 = await apiClient.get('/pricelist_line', {
      params: { PricelistHeaderKey: 'AURO-0000000245', MaximumRecords: 5000 }
    })
    const data1 = Array.isArray(res1.data) ? res1.data : [res1.data].filter(Boolean)

    data1.forEach(p => {
      if (p.ItemID && parseFloat(p.UnitPrice) > 0) {
        priceCache[p.ItemID] = parseFloat(p.UnitPrice)
      }
    })

    // Also fetch from Aurora price list
    try {
      const res2 = await apiClient.get('/pricelist_line', {
        params: { PricelistHeaderKey: 'AURE-0000000245', MaximumRecords: 5000 }
      })
      const data2 = Array.isArray(res2.data) ? res2.data : [res2.data].filter(Boolean)

      data2.forEach(p => {
        if (p.ItemID && parseFloat(p.UnitPrice) > 0) {
          // Only set if not already in cache (Corp prices take priority)
          if (!priceCache[p.ItemID]) {
            priceCache[p.ItemID] = parseFloat(p.UnitPrice)
          }
        }
      })
    } catch (e) {
      console.warn('Aurora price list fetch failed:', e.message)
    }

    priceCacheLoaded = true
    console.log(`Price cache loaded: ${Object.keys(priceCache).length} items`)
  } catch (e) {
    console.error('Price list fetch failed:', e.message)
  }

  return priceCache
}

// Get price - check cache first, then item data, then generate
export const getPrice = (item) => {
  // 1. Check price cache (from OMS price list)
  const itemId = item?.ItemID || item?.id
  if (itemId && priceCache[itemId]) {
    return priceCache[itemId]
  }

  // 2. Check item cost/list price
  const unitCost = parseFloat(item?.UnitCost || item?._raw?.PrimaryInformation?.UnitCost || 0)
  if (unitCost > 0) return unitCost

  const computedCost = parseFloat(item?._raw?.PrimaryInformation?.ComputedUnitCost || 0)
  if (computedCost > 0) return computedCost

  const listPrice = parseFloat(item?.ListPrice || 0)
  if (listPrice > 0) return listPrice

  // 3. Generate consistent price from ItemID (fallback only)
  const id = itemId || 'ITEM'
  const hash = id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  return parseFloat(((hash % 150) + 19.99).toFixed(2))
}

// Normalize item from either /item or /inventory_item response
export const normalizeItem = (raw) => {
  const base = raw.Item || raw
  const primaryInfo = base.PrimaryInformation || {}
  const itemId = raw.ItemID || base.ItemID

  // Check image from cache
  const cachedImage = imageCache[itemId] || null

  return {
    ItemID:           itemId,
    ShortDescription: primaryInfo.ShortDescription || base.ShortDescription || itemId,
    Description:      primaryInfo.Description || primaryInfo.ExtendedDescription || base.Description || '',
    UnitCost:         parseFloat(primaryInfo.UnitCost || base.UnitCost || raw.UnitCost || 0),
    ListPrice:        parseFloat(base.ListPrice || raw.ListPrice || 0),
    ComputedUnitCost: parseFloat(primaryInfo.ComputedUnitCost || 0),
    UnitOfMeasure:    raw.UnitOfMeasure || base.UnitOfMeasure || 'EACH',
    CategoryID:       base.CategoryID || '',
    IsModelItem:      primaryInfo.IsModelItem === 'Y' || modelItemSet.has(itemId),
    ItemType:         primaryInfo.ItemType || base.ItemType || '',
    ImageUrl:         cachedImage ,
    _raw: raw,
  }
}

// ─── Catalog Items ────────────────────────────────────────────────────────────
export const fetchItems = async ({ categoryId, max = 5000 } = {}) => {
  const params = { OrganizationCode: 'Aurora-Corp', MaximumRecords: max }
  if (categoryId) params.CategoryID = categoryId
  const res = await apiClient.get('/item', { params })
  const data = Array.isArray(res.data) ? res.data : [res.data].filter(Boolean)
  return data.map(normalizeItem)
}

export const fetchItemById = async (itemId) => {
  const res = await apiClient.get(`/item/${itemId}`)
  return normalizeItem(Array.isArray(res.data) ? res.data[0] : res.data)
}

// ─── Inventory Items (richer description data) ───────────────────────────────
export const fetchInventoryItems = async ({ itemId, max = 5000 } = {}) => {
  const params = { OrganizationCode: 'Aurora', MaximumRecords: max }
  if (itemId) params.ItemID = itemId
  const res = await apiClient.get('/inventory_item', { params })
  const data = Array.isArray(res.data) ? res.data : [res.data].filter(Boolean)
  return data.map(normalizeItem)
}

// ─── Categories ───────────────────────────────────────────────────────────────
export const fetchCategories = async (max = 100) => {
  const res = await apiClient.get('/category', {
    params: { OrganizationCode: 'Aurora-Corp', MaximumRecords: max }
  })
  return Array.isArray(res.data) ? res.data : [res.data].filter(Boolean)
}

// ─── Node Inventory (store stock levels) ─────────────────────────────────────
export const fetchNodeInventory = async (itemId) => {
  const res = await apiClient.get('/node_inventory', {
    params: { OrganizationCode: 'Aurora', ItemID: itemId }
  })
  return Array.isArray(res.data) ? res.data : [res.data].filter(Boolean)
}

export const fetchItemDetails = async (itemId) => {
  const res = await apiClient.get(`/item/${itemId}`, {
    params: { OrganizationCode: 'Aurora-Corp' }
  })
  const data = Array.isArray(res.data) ? res.data[0] : res.data
  return data
}

export const fetchItemVariants = async (parentItemId) => {
  const res = await apiClient.get('/item', {
    params: {
      OrganizationCode: 'Aurora-Corp',
      ParentItemID: parentItemId,
      MaximumRecords: 50
    }
  })
  const data = Array.isArray(res.data) ? res.data : [res.data].filter(Boolean)
  return data.map(normalizeItem)
}
import { apiClient } from './auth.js'

export const fetchStores = async (max = 20) => {
  const res = await apiClient.get('/ship_node', {
    params: { MaximumRecords: max }
  })
  return Array.isArray(res.data) ? res.data : [res.data].filter(Boolean)
}

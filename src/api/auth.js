import axios from 'axios'

export const BASE_URL = '/smcfs/restapi'

// Internal admin - never shown in UI
const ADMIN = { LoginID: 'admin', Password: 'password', OrganizationCode: 'DEFAULT' }

export const getToken   = ()    => localStorage.getItem('aurora_jwt')
export const setToken   = (tok) => localStorage.setItem('aurora_jwt', tok)
export const clearToken = ()    => {
  localStorage.removeItem('aurora_jwt')
  localStorage.removeItem('aurora_login')
}

// Always login with admin for API JWT
export const refreshAdminToken = async () => {
  const loginRes = await axios.post(
    `${BASE_URL}/invoke/login`,
    ADMIN,
    { headers: { 'Content-Type': 'application/json', 'ibm-oms-app': 'storefront' } }
  )
  const { UserToken } = loginRes.data
  const jwtRes = await axios.get(
    `${BASE_URL}/jwt?_token=${encodeURIComponent(UserToken)}&_loginid=admin`,
    { headers: { 'ibm-oms-app': 'storefront' }, responseType: 'text' }
  )
  const jwt = typeof jwtRes.data === 'string' ? jwtRes.data.trim() : jwtRes.data
  setToken(jwt)
  return jwt
}

// Kept for backward compatibility
export const login = async (loginId = 'admin', password = 'password') => {
  return refreshAdminToken()
}

export const ensureToken = async () => {
  if (getToken()) return getToken()
  return refreshAdminToken()
}

export const getAuthHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  'ibm-oms-app': 'storefront',
  'Content-Type': 'application/json',
})

export const apiClient = axios.create({ baseURL: BASE_URL })

apiClient.interceptors.request.use(async (config) => {
  await ensureToken()
  config.headers = { ...config.headers, ...getAuthHeaders() }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true
      clearToken()
      try {
        await refreshAdminToken()
        err.config.headers = { ...err.config.headers, ...getAuthHeaders() }
        return axios(err.config)
      } catch (_) {}
    }
    return Promise.reject(err)
  }
)
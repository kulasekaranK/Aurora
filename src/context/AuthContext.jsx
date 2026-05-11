import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { refreshAdminToken, clearToken, getToken } from '../api/auth.js'
import { findCustomerByEmail, createCustomer, updateCustomerEmail, getCustomerContactRef } from '../api/customer.js'

const AuthContext = createContext(null)

const CONSUMER_KEY = 'aurora_consumer'

export function AuthProvider({ children }) {
  const [consumer, setConsumer] = useState(() => {
    try {
      const s = localStorage.getItem(CONSUMER_KEY)
      return s ? JSON.parse(s) : null
    } catch { return null }
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  // Initialize admin API JWT on app start
  useEffect(() => {
    if (!getToken()) {
      refreshAdminToken().catch(console.error)
    }
  }, [])

// In AuthContext.jsx login function:
const login = useCallback(async (email, password) => {
  setLoading(true); setError(null)
  try {
    await refreshAdminToken()

    // Try OMS search
    let customer = await findCustomerByEmail(email)

    // If not found in OMS, check localStorage (email mapping)
    if (!customer) {
      // Search all customers where email was stored locally
      const keys = Object.keys(localStorage)
      for (const key of keys) {
        if (key.startsWith('aurora_email_')) {
          const storedEmail = localStorage.getItem(key)
          if (storedEmail === email) {
            const customerKey = key.replace('aurora_email_', '')
            customer = { CustomerKey: customerKey }
            break
          }
        }
      }
    }

    if (!customer) {
      setError('No account found with this email. Please register first.')
      return false
    }

    const session = {
      email,
      firstName: customer.FirstName || email.split('@')[0],
      lastName:  customer.LastName  || '',
      phone:     customer.DayPhone  || '',
      customerKey: customer.CustomerKey,
      loginTime: Date.now()
    }

    setConsumer(session)
    localStorage.setItem(CONSUMER_KEY, JSON.stringify(session))
    return true
  } catch (e) {
    setError(e.message || 'Login failed')
    return false
  } finally { setLoading(false) }
}, [])

  // In register function - change createCustomer call:
const register = useCallback(async ({ email, password, firstName, lastName, phone = '' }) => {
  setLoading(true); setError(null)
  try {
    await refreshAdminToken()

    // Check if already exists
    const existing = await findCustomerByEmail(email)
    if (existing) {
      setError('Account already exists. Please sign in.')
      return false
    }

    // Step 1: Create customer
    const customer = await createCustomer({ email, firstName, lastName, phone })
    const customerKey = customer?.CustomerKey

    if (!customerKey) throw new Error('Failed to create customer')

    // Step 2: Get ContactKey and update email
    // Wait for DB to commit
    await new Promise(r => setTimeout(r, 1000))

    try {
     const contactRef = await getCustomerContactRef(customerKey)
console.log('contactRef:', contactRef, 'customerKey:', customerKey)

if (contactRef) {
  await updateCustomerEmail(customerKey, contactRef, email, phone)
}
    } catch (e) {
      console.warn('Email update failed:', e.message)
      // Store email mapping locally as fallback
      localStorage.setItem(`aurora_email_${customerKey}`, email)
    }

    const session = {
      email,
      firstName,
      lastName,
      phone,
      customerKey,
      customerID: customer?.CustomerID,
      loginTime: Date.now()
    }

    setConsumer(session)
    localStorage.setItem(CONSUMER_KEY, JSON.stringify(session))
    return true
  } catch (e) {
    setError(e.message || 'Registration failed')
    return false
  } finally { setLoading(false) }
}, [])



  const logout = useCallback(() => {
    setConsumer(null)
    localStorage.removeItem(CONSUMER_KEY)
  }, [])

  const updateConsumer = useCallback((updates) => {
    const updated = { ...consumer, ...updates }
    setConsumer(updated)
    localStorage.setItem(CONSUMER_KEY, JSON.stringify(updated))
  }, [consumer])

  const value = {
    user:       consumer,
    consumer,
    loading,
    error,
    isLoggedIn: !!consumer,
    login,
    register,
    logout,
    updateConsumer
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

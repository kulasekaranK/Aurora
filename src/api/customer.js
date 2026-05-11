import { apiClient } from './auth.js'

// ─── Find Customer by Email ───────────────────────────────────────────────────
export const findCustomerByEmail = async (email) => {
  try {
    // Use EmailID (correct field name)
    const res = await apiClient.get('/customer_contact', {
      params: {
        OrganizationCode: 'Aurora',
        EmailID: email,
        MaximumRecords: 1
      }
    })

    const data = Array.isArray(res.data) ? res.data : [res.data].filter(Boolean)
    if (data.length === 0 || !data[0]?.EmailID) return null

    const contact = data[0]

    // Response has CustomerContactID but NOT CustomerKey
    // We need CustomerKey - get it from customer list
    if (contact.CustomerContactID) {
      // Search customer by contact ID
      try {
        const custRes = await apiClient.get('/customer', {
          params: {
            OrganizationCode: 'Aurora',
            CustomerContactID: contact.CustomerContactID,
            MaximumRecords: 1
          }
        })
        const custData = Array.isArray(custRes.data)
          ? custRes.data[0]
          : custRes.data

        if (custData?.CustomerKey) {
          return {
            ...contact,
            CustomerKey: custData.CustomerKey,
            CustomerID:  custData.CustomerID
          }
        }
      } catch (e) {
        console.warn('Could not get CustomerKey via customer API:', e.message)
      }

      // Fallback: check localStorage for CustomerKey mapping
      const localKeys = Object.keys(localStorage)
      for (const key of localKeys) {
        if (key.startsWith('aurora_customer_')) {
          try {
            const stored = JSON.parse(localStorage.getItem(key))
            if (stored?.email === email) {
              return {
                ...contact,
                CustomerKey: stored.CustomerKey,
                CustomerID:  stored.CustomerID
              }
            }
          } catch {}
        }
      }
    }

    return contact.EmailID ? contact : null
  } catch (e) {
    console.error('findCustomerByEmail error:', e)
    return null
  }
}
// ─── Get CustomerContactKey from DB via API ───────────────────────────────────
const getContactKey = async (customerKey) => {
  try {
    const res = await apiClient.get('/customer_contact', {
      params: { CustomerKey: customerKey, MaximumRecords: 1 }
    })
    const data = Array.isArray(res.data) ? res.data : [res.data].filter(Boolean)
    if (data.length > 0) {
      // CustomerContactKey is not in output template
      // But CustomerContactID gives us the numeric part
      // The actual key is stored in DB
      // We need to get it via a different approach
      return data[0]
    }
    return null
  } catch {
    return null
  }
}

// ─── Create Customer (Step 1: basic info) ────────────────────────────────────
export const createCustomer = async ({ email, firstName, lastName, phone = '' }) => {
  // Step 1: Create customer with contact (name only - email blocked in create)
  const createRes = await apiClient.post('/invoke/manageCustomer', {
    OrganizationCode: 'Aurora',
    CustomerType:     '02',
    Status:           '10',
    CustomerContactList: {
      CustomerContact: [{
        FirstName:        firstName,
        LastName:         lastName,
        DayPhone:         phone,
        IsDefaultContact: 'Y'
      }]
    }
  })

  const customerKey = createRes.data?.CustomerKey
  const customerId  = createRes.data?.CustomerID

  if (!customerKey) throw new Error('Failed to create customer')

  // Step 2: Get the ContactKey from customer_contact API
  // Since output template doesn't return ContactKey,
  // we use CustomerID pattern to derive ContactKey
  // ContactKey = CustomerKey + 3 (based on observed pattern)
  // Better: search and get from list

  // Wait briefly then get contact
  await new Promise(r => setTimeout(r, 500))

  const contactRes = await apiClient.get('/customer_contact', {
    params: { CustomerKey: customerKey, MaximumRecords: 1 }
  })
  const contacts = Array.isArray(contactRes.data)
    ? contactRes.data
    : [contactRes.data].filter(Boolean)

  // Step 3: Update email using manageCustomer
  // We need to find ContactKey - since API doesn't return it,
  // we store CustomerKey and use getPage to find it
  // For now, store what we have and update email separately

  // Store customer info in localStorage to track contact
  const customerData = {
    CustomerKey: customerKey,
    CustomerID:  customerId,
    email:       email,
    firstName,
    lastName,
    phone
  }
  localStorage.setItem(`aurora_customer_${email}`, JSON.stringify(customerData))

  return createRes.data
}

export const updateCustomerEmail = async (customerKey, contactRef, email, phone = '') => {
  if (!contactRef) throw new Error('No customer contact reference found')

  const contactPayload = {
    EmailID: email,
    DayPhone: phone
  }

  if (contactRef.customerContactKey) {
    contactPayload.CustomerContactKey = contactRef.customerContactKey
  } else if (contactRef.customerContactID) {
    contactPayload.CustomerContactID = contactRef.customerContactID
  }

  const res = await apiClient.post('/invoke/manageCustomer', {
    CustomerKey: customerKey,
    OrganizationCode: 'Aurora',
    CustomerContactList: {
      CustomerContact: [contactPayload]
    }
  })

  return res.data
}
// ─── Get Customer Contact Key via getPage ────────────────────────────────────
export const getCustomerContactRef = async (customerKey) => {
  try {
    const res = await apiClient.get('/customer_contact', {
      params: {
        CustomerKey: customerKey,
        MaximumRecords: 1
      }
    })

    const arr = Array.isArray(res.data) ? res.data : [res.data].filter(Boolean)
    if (arr.length === 0) return null

    return {
      customerContactKey: arr[0]?.CustomerContactKey || null,
      customerContactID:  arr[0]?.CustomerContactID  || null,
      firstName:          arr[0]?.FirstName || '',
      lastName:           arr[0]?.LastName  || '',
      email:              arr[0]?.EmailID || arr[0]?.EMailID || ''
    }
  } catch (e) {
    console.error('getCustomerContactRef failed:', e)
    return null
  }
}

// ─── Add Address ──────────────────────────────────────────────────────────────
export const addCustomerAddress = async (customerKey, contactRef, addr) => {
  if (!contactRef) throw new Error('No customer contact reference found')

  const contactPayload = {
    CustomerAdditionalAddressList: {
      CustomerAdditionalAddress: [{
        Operation: 'Create',
        IsDefaultShipTo: addr.isDefault ? 'Y' : 'N',
        IsDefaultBillTo: addr.isDefault ? 'Y' : 'N',
        IsDefaultSoldTo: addr.isDefault ? 'Y' : 'N',
        IsShipTo: 'Y',
        IsBillTo: 'Y',
        IsSoldTo: 'Y',
        PersonInfo: {
          FirstName: addr.firstName,
          LastName: addr.lastName,
          AddressLine1: addr.address1,
          AddressLine2: addr.address2 || '',
          City: addr.city,
          State: addr.state,
          ZipCode: addr.zip,
          Country: addr.country || 'US',
          DayPhone: addr.phone || '',
          EMailID: addr.email || ''
        }
      }]
    }
  }

  if (contactRef.customerContactKey) {
    contactPayload.CustomerContactKey = contactRef.customerContactKey
  } else if (contactRef.customerContactID) {
    contactPayload.CustomerContactID = contactRef.customerContactID
  }

  const res = await apiClient.post('/invoke/manageCustomer', {
    CustomerKey: customerKey,
    OrganizationCode: 'Aurora',
    CustomerContactList: {
      CustomerContact: [contactPayload]
    }
  })

  return res.data
}

// ─── Get Addresses (localStorage primary, OMS secondary) ─────────────────────
export const getCustomerAddresses = async (customerKey) => {
  // Primary: localStorage (since OMS output template restricts address fields)
  const local = getLocalAddresses(customerKey)
  if (local.length > 0) return local

  // Try OMS as fallback
  try {
    const res = await apiClient.get('/customer_contact', {
      params: { CustomerKey: customerKey, MaximumRecords: 10 }
    })
    const contacts = Array.isArray(res.data) ? res.data : [res.data].filter(Boolean)
    let addresses = []
    for (const c of contacts) {
      const addnl = c?.CustomerAdditionalAddressList?.CustomerAdditionalAddress
      if (addnl) {
        const arr = Array.isArray(addnl) ? addnl : [addnl]
        arr.forEach(a => {
          const pi = a.PersonInfo || {}
          if (pi.AddressLine1) {
            addresses.push({
              id:               a.CustomerAdditionalAddressKey || Date.now().toString(),
              FirstName:        pi.FirstName    || '',
              LastName:         pi.LastName     || '',
              AddressLine1:     pi.AddressLine1 || '',
              City:             pi.City         || '',
              State:            pi.State        || '',
              ZipCode:          pi.ZipCode      || '',
              Country:          pi.Country      || 'US',
              DayPhone:         pi.DayPhone     || '',
              EMailID:          pi.EMailID      || '',
              IsDefaultContact: a.IsDefaultShipTo === 'Y' ? 'Y' : 'N'
            })
          }
        })
      }
    }
    if (addresses.length > 0) {
      localStorage.setItem(`aurora_addr_${customerKey}`, JSON.stringify(addresses))
      return addresses
    }
  } catch (e) {
    console.error(e)
  }

  return []
}

// ─── Combined Add Address ─────────────────────────────────────────────────────
export const addCustomerAddressCombined = async (customerKey, addr) => {
  saveLocalAddress(customerKey, addr)

  try {
    const contactRef = await getCustomerContactRef(customerKey)
    console.log('contactRef:', contactRef)

    if (contactRef) {
      await addCustomerAddress(customerKey, contactRef, addr)
    } else {
      console.warn('No contact reference found, address only saved locally')
    }
  } catch (e) {
    console.warn('OMS address save failed:', e.message)
  }

  return true
}

// ─── localStorage helpers ─────────────────────────────────────────────────────
const getLocalKey = (k) => `aurora_addr_${k}`

export const getLocalAddresses = (customerKey) => {
  try {
    const stored = localStorage.getItem(getLocalKey(customerKey))
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

const saveLocalAddress = (customerKey, addr) => {
  const existing = getLocalAddresses(customerKey)
  const updated = existing.map(a => ({
    ...a,
    IsDefaultContact: addr.isDefault ? 'N' : a.IsDefaultContact
  }))
  updated.push({
    id:               Date.now().toString(),
    FirstName:        addr.firstName  || '',
    LastName:         addr.lastName   || '',
    AddressLine1:     addr.address1   || '',
    City:             addr.city       || '',
    State:            addr.state      || '',
    ZipCode:          addr.zip        || '',
    Country:          addr.country    || 'US',
    DayPhone:         addr.phone      || '',
    EMailID:          addr.email      || '',
    IsDefaultContact: addr.isDefault  ? 'Y' : (updated.length === 0 ? 'Y' : 'N')
  })
  localStorage.setItem(getLocalKey(customerKey), JSON.stringify(updated))
}

export const deleteCustomerAddress = async (customerKey, addressId) => {
  const existing = getLocalAddresses(customerKey)
  const updated = existing.filter(a => a.id !== addressId)
  localStorage.setItem(getLocalKey(customerKey), JSON.stringify(updated))
  return true
}

export const setDefaultAddress = async (customerKey, addressId) => {
  const existing = getLocalAddresses(customerKey)
  const updated = existing.map(a => ({
    ...a,
    IsDefaultContact: a.id === addressId ? 'Y' : 'N'
  }))
  localStorage.setItem(getLocalKey(customerKey), JSON.stringify(updated))
  return true
}
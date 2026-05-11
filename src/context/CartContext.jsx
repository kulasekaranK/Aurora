import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { getPrice } from '../api/products.js'

const CartContext = createContext(null)

const load = () => {
  try { return JSON.parse(localStorage.getItem('aurora_cart') || '[]') } catch { return [] }
}

const reducer = (state, action) => {
  switch (action.type) {
    case 'ADD': {
      const exists = state.find(i => i.ItemID === action.item.ItemID)
      if (exists) {
        return state.map(i =>
          i.ItemID === action.item.ItemID
            ? { ...i, qty: i.qty + (action.qty || 1) }
            : i
        )
      }
      return [...state, { ...action.item, qty: action.qty || 1 }]
    }
    case 'REMOVE':
      return state.filter(i => i.ItemID !== action.itemId)
    case 'UPDATE_QTY':
      return state.map(i =>
        i.ItemID === action.itemId ? { ...i, qty: Math.max(1, action.qty) } : i
      )
    case 'CLEAR':
      return []
    default:
      return state
  }
}

export const CartProvider = ({ children }) => {
  const [items, dispatch] = useReducer(reducer, [], load)

  useEffect(() => {
    localStorage.setItem('aurora_cart', JSON.stringify(items))
  }, [items])

  const addItem    = (item, qty = 1)       => dispatch({ type: 'ADD',        item: { ...item, price: getPrice(item) }, qty })
  const removeItem = (itemId)              => dispatch({ type: 'REMOVE',     itemId })
  const updateQty  = (itemId, qty)         => dispatch({ type: 'UPDATE_QTY', itemId, qty })
  const clearCart  = ()                    => dispatch({ type: 'CLEAR' })

  const subtotal   = items.reduce((s, i)  => s + (i.price * i.qty), 0)
  const itemCount  = items.reduce((s, i)  => s + i.qty, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, subtotal, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)

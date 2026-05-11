import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { createOrder } from '../api/orders.js'
import { fetchStores } from '../api/stores.js'
import { getCustomerAddresses } from '../api/customer.js'
import { getStripe, tokenizeCard, savePaymentTokenToOMS } from '../api/payment.js'

const STEPS = ['Customer Info', 'Shipping', 'Payment', 'Review']

const Field = ({ label, name, value, onChange, type = 'text', required, placeholder, children }) => (
  <div>
    <label className="block text-xs font-medium text-slate-600 mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children || (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-aurora-mid/20"
      />
    )}
  </div>
)

// ---------------------------------------------------------------------------
// StripeCardForm — collects card and returns a pm_xxx token.
// Must be rendered inside <Elements> so useStripe / useElements work.
// Does NOT authorize — OMS does that with the token later.
// ---------------------------------------------------------------------------
function StripeCardForm({ amount, customerInfo, onSuccess, onFailure }) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [cardError, setCardError] = useState(null)

  const handleTokenize = async () => {
    if (!stripe || !elements) return
    setProcessing(true)
    setCardError(null)

    try {
      const paymentMethod = await tokenizeCard({
        stripe,
        cardElement: elements.getElement(CardElement),
        customerInfo,
      })

      // paymentMethod.id === 'pm_xxx'
      // Hand the token up — no authorization happened here.
      onSuccess({
        paymentToken: paymentMethod.id,
        last4: paymentMethod.card?.last4 ?? '****',
        brand: paymentMethod.card?.brand ?? 'card',
        gateway: 'STRIPE',
      })
    } catch (err) {
      setCardError(err.message)
      onFailure({ message: err.message })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Amount display */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-mono">Order Total</p>
            <p className="font-display text-3xl font-bold text-slate-900 mt-1">${amount.toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-1">
              OMS will authorize this amount after order is placed
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Secured by</p>
            <p className="text-sm font-bold text-[#6772e5]">Stripe</p>
          </div>
        </div>

        {/* Stripe CardElement — PCI-compliant inline card input */}
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '14px',
                  color: '#1e293b',
                  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                  '::placeholder': { color: '#94a3b8' },
                },
                invalid: { color: '#ef4444' },
              },
              hidePostalCode: false,
            }}
          />
        </div>
      </div>

      {/* Test mode hint */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">🧪 Test Mode</p>
        <p className="text-xs">
          Use test card: <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">4242 4242 4242 4242</code>
          <br />
          Any future MM/YY · Any 3-digit CVC · Any ZIP
        </p>
      </div>

      {cardError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          ⚠️ {cardError}
        </div>
      )}

      <button
        onClick={handleTokenize}
        disabled={!stripe || processing}
        className="w-full rounded-xl bg-[#6772e5] text-white py-4 text-base font-bold hover:bg-[#5469d4] transition-colors disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
      >
        {processing ? 'Saving Card…' : 'Save Card & Continue'}
      </button>

      <p className="text-center text-xs text-slate-400">
        Your card details are tokenized by Stripe and never touch our servers.
        OMS will authorize the amount when your order is confirmed.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Checkout page
// ---------------------------------------------------------------------------
export default function Checkout() {
  const [stripePromise] = useState(() => getStripe())

  const [paymentDone, setPaymentDone] = useState(false)
  const [paymentToken, setPaymentToken] = useState(null)   // pm_xxx
  const [cardSummary, setCardSummary] = useState(null)     // { last4, brand }
  const [paymentError, setPaymentError] = useState(null)

  const { items, subtotal, clearCart } = useCart()
  const { user, isLoggedIn } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [stores, setStores] = useState([])
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddr, setSelectedAddr] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const [customer, setCustomer] = useState({
    firstName: '', lastName: '', email: '', phone: '',
  })
  const [shipping, setShipping] = useState({
    address1: '', city: '', state: '', zip: '', country: 'US',
  })
  const [bopis, setBopis] = useState(false)
  const [selStore, setSelStore] = useState('')

  useEffect(() => {
    fetchStores(10).then(s => {
      setStores(s)
      if (s[0]) setSelStore(s[0].ShipNode || '')
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (isLoggedIn && user?.customerKey) {
      setCustomer(p => ({
        firstName: p.firstName || user.firstName || '',
        lastName: p.lastName || user.lastName || '',
        email: p.email || user.email || '',
        phone: p.phone || user.phone || '',
      }))
      getCustomerAddresses(user.customerKey).then(addrs => {
        setSavedAddresses(addrs)
        const def = addrs.find(a => a.IsDefaultContact === 'Y') || addrs[0]
        if (def) {
          setSelectedAddr(def)
          setShipping({
            address1: def.AddressLine1 || '',
            city: def.City || '',
            state: def.State || '',
            zip: def.ZipCode || '',
            country: def.Country || 'US',
          })
        }
      }).catch(() => {})
    }
  }, [isLoggedIn, user])

  const updateC = e => setCustomer(p => ({ ...p, [e.target.name]: e.target.value }))
  const updateS = e => setShipping(p => ({ ...p, [e.target.name]: e.target.value }))

  const shippingTotal = subtotal >= 75 ? 0 : 9.99
  const tax = 0
  const total = subtotal + shippingTotal + tax

  const canNext = [
    customer.firstName && customer.lastName && customer.email,
    bopis ? !!selStore : (shipping.address1 && shipping.city && shipping.state && shipping.zip),
    paymentDone,
    true,
  ][step]

  // ── Place order: create OMS order then attach the Stripe pm_xxx token ──
  const handlePlaceOrder = async () => {
    setSubmitting(true)
    setError(null)

    try {
      let addr
      if (bopis) {
        const selectedStore = stores.find(s => s.ShipNode === selStore)
        const info = selectedStore?.ShipNodePersonInfo || {}
        addr = {
          address1: info.AddressLine1 || 'Store Pickup',
          city: info.City || selStore,
          state: info.State || '',
          zip: info.ZipCode || '00000',
          country: info.Country || 'US',
        }
      } else {
        addr = shipping
      }

      const result = await createOrder({
        cartItems: items,
        customerInfo: customer,
        shippingAddress: addr,
        shipNode: bopis ? selStore : undefined,
        customerId: user?.customerID,
      })

      const orderNo = result?.OrderNo || result?.OrderHeaderKey

      // Attach the Stripe pm_xxx token to the order.
      // OMS payment-collection agent will use this token to call Stripe and authorize.
      if (paymentToken && orderNo) {
        try {
          await savePaymentTokenToOMS({
            orderNo,
            paymentToken,
            amount: subtotal,
            customerInfo: customer,
          })
          console.log('Stripe pm token stored in OMS for order:', orderNo)
        } catch (payErr) {
          console.warn('Failed to store Stripe token in OMS:', payErr.message)
        }
      }

      clearCart()
      navigate('/order-confirmation', {
        state: {
          order: result,
          orderNo,
          customer,
          items,
          total,
          isBopis: bopis,
          storeName: bopis ? stores.find(s => s.ShipNode === selStore)?.Description : null,
          paymentToken,
          cardSummary,
          paymentGateway: 'STRIPE',
        },
      })
    } catch (e) {
      let msg = 'Order creation failed'
      const errData = e.response?.data
      if (Array.isArray(errData) && errData[0]?.ErrorDescription) msg = errData[0].ErrorDescription
      else if (errData?.errorDescription) msg = errData.errorDescription
      else if (e.message) msg = e.message
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!items.length) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h2 className="font-display text-2xl text-slate-900 mb-3">Cart is Empty</h2>
        <Link to="/shop" className="rounded-xl bg-aurora-navy text-white px-8 py-3 font-semibold hover:bg-slate-800 transition-colors">
          Shop Now
        </Link>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
        <h1 className="font-display text-3xl font-bold text-slate-900 mb-8">Checkout</h1>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2 shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < step ? 'bg-green-500 text-white' :
                  i === step ? 'bg-aurora-navy text-white' :
                  'bg-slate-200 text-slate-500'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-sm font-medium ${i === step ? 'text-slate-900' : 'text-slate-400'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-slate-300 shrink-0" />}
            </React.Fragment>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr,360px] gap-8">
          <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6">

            {/* ── Step 0: Customer Info ── */}
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="font-display text-xl font-bold text-slate-900">Customer Information</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="First Name" name="firstName" value={customer.firstName} onChange={updateC} required />
                  <Field label="Last Name" name="lastName" value={customer.lastName} onChange={updateC} required />
                  <Field label="Email" name="email" value={customer.email} onChange={updateC} required type="email" placeholder="you@example.com" />
                  <Field label="Phone" name="phone" value={customer.phone} onChange={updateC} placeholder="(555) 000-0000" />
                </div>
              </div>
            )}

            {/* ── Step 1: Shipping ── */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="font-display text-xl font-bold text-slate-900">Shipping or Pickup</h2>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 cursor-pointer">
                  <input type="checkbox" checked={bopis} onChange={e => setBopis(e.target.checked)} className="accent-aurora-blue" />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Buy Online, Pick Up In Store</p>
                    <p className="text-xs text-slate-500">Choose a store for pickup</p>
                  </div>
                </label>

                {bopis ? (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Pickup Store</label>
                    <select value={selStore} onChange={e => setSelStore(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-aurora-mid/20">
                      {stores.map(s => (
                        <option key={s.ShipNode} value={s.ShipNode}>{s.Description || s.ShipNode}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {isLoggedIn && savedAddresses.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-600 mb-2">Saved Addresses</p>
                        <div className="space-y-2">
                          {savedAddresses.map(addr => (
                            <label key={addr.id}
                              className={`block rounded-2xl border p-4 cursor-pointer transition-colors ${
                                selectedAddr === addr ? 'border-aurora-navy bg-aurora-light' : 'border-slate-200 hover:bg-slate-50'
                              }`}>
                              <div className="flex gap-3">
                                <input type="radio" name="savedAddr" checked={selectedAddr === addr}
                                  onChange={() => {
                                    setSelectedAddr(addr)
                                    setShipping({ address1: addr.AddressLine1 || '', city: addr.City || '', state: addr.State || '', zip: addr.ZipCode || '', country: addr.Country || 'US' })
                                  }}
                                  className="mt-1 accent-aurora-blue" />
                                <div className="text-sm">
                                  <p className="font-semibold text-slate-900">{addr.FirstName} {addr.LastName}</p>
                                  <p className="text-slate-600">{addr.AddressLine1}</p>
                                  <p className="text-slate-500">{[addr.City, addr.State, addr.ZipCode].filter(Boolean).join(', ')}</p>
                                </div>
                              </div>
                            </label>
                          ))}
                          <label className="block rounded-2xl border border-slate-200 p-4 cursor-pointer hover:bg-slate-50">
                            <div className="flex gap-3">
                              <input type="radio" name="savedAddr" checked={selectedAddr === null}
                                onChange={() => { setSelectedAddr(null); setShipping({ address1: '', city: '', state: '', zip: '', country: 'US' }) }}
                                className="mt-1 accent-aurora-blue" />
                              <p className="text-sm font-medium text-slate-900">Use a new address</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}

                    {(!isLoggedIn || savedAddresses.length === 0 || selectedAddr === null) && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <Field label="Address Line 1" name="address1" value={shipping.address1} onChange={updateS} required placeholder="123 Main St" />
                        </div>
                        <Field label="City" name="city" value={shipping.city} onChange={updateS} required />
                        <Field label="State" name="state" value={shipping.state} onChange={updateS} required placeholder="MA" />
                        <Field label="ZIP Code" name="zip" value={shipping.zip} onChange={updateS} required placeholder="02101" />
                        <Field label="Country" name="country" value={shipping.country} onChange={updateS}>
                          <select name="country" value={shipping.country} onChange={updateS}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-aurora-mid/20">
                            <option value="US">United States</option>
                            <option value="CA">Canada</option>
                            <option value="GB">United Kingdom</option>
                          </select>
                        </Field>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 2: Payment ── */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="font-display text-xl font-bold text-slate-900">Payment</h2>

                {!paymentDone ? (
                  <StripeCardForm
                    amount={subtotal}
                    customerInfo={customer}
                    onSuccess={({ paymentToken: token, last4, brand }) => {
                      setPaymentToken(token)
                      setCardSummary({ last4, brand })
                      setPaymentDone(true)
                      setPaymentError(null)
                    }}
                    onFailure={({ message }) => setPaymentError(message)}
                  />
                ) : (
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl mb-4">✓</div>
                      <h3 className="font-display text-xl font-bold text-green-900 mb-1">Card Saved</h3>
                      <p className="text-sm text-green-700 mb-4">
                        {cardSummary?.brand?.toUpperCase()} ending in {cardSummary?.last4} has been tokenized securely.
                      </p>
                      <div className="inline-block rounded-xl bg-green-100 px-4 py-2 mb-3">
                        <p className="text-xs text-green-600 font-mono break-all">Token: {paymentToken}</p>
                      </div>
                      <p className="text-xs text-green-600">
                        OMS will authorize ${subtotal.toFixed(2)} using this token when your order is confirmed.
                      </p>
                    </div>
                  </div>
                )}

                {paymentError && !paymentDone && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    ⚠️ {paymentError}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: Review ── */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="font-display text-xl font-bold text-slate-900">Review Order</h2>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-mono mb-2">Customer</p>
                  <p className="text-sm text-slate-800">{customer.firstName} {customer.lastName}</p>
                  <p className="text-sm text-slate-500">{customer.email}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-mono mb-2">
                    {bopis ? 'Pickup Store' : 'Shipping Address'}
                  </p>
                  {bopis ? (
                    <p className="text-sm text-slate-800">{stores.find(s => s.ShipNode === selStore)?.Description || selStore}</p>
                  ) : (
                    <p className="text-sm text-slate-800">
                      {shipping.address1}, {shipping.city}, {shipping.state} {shipping.zip}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-mono mb-2">Payment</p>
                  <p className="text-sm text-slate-800">
                    {cardSummary?.brand?.toUpperCase()} ···· {cardSummary?.last4}
                    <span className="ml-2 text-xs text-slate-500">(token saved · OMS authorizes on order)</span>
                  </p>
                </div>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    ⚠️ {error}
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
              {step > 0 ? (
                <button onClick={() => setStep(s => s - 1)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50 transition-colors">
                  ← Back
                </button>
              ) : (
                <Link to="/cart" className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50 transition-colors">
                  ← Cart
                </Link>
              )}

              {step < STEPS.length - 1 ? (
                <button onClick={() => setStep(s => s + 1)} disabled={!canNext}
                  className="rounded-xl bg-aurora-navy text-white px-6 py-2.5 text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50">
                  Continue →
                </button>
              ) : (
                <button onClick={handlePlaceOrder} disabled={submitting}
                  className="rounded-xl bg-aurora-navy text-white px-6 py-2.5 text-sm font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50">
                  {submitting ? 'Placing Order…' : `Place Order · $${total.toFixed(2)}`}
                </button>
              )}
            </div>
          </div>

          {/* Order Summary sidebar */}
          <div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sticky top-24">
              <h3 className="font-display text-xl font-bold text-slate-900 mb-5">Order Summary</h3>
              <ul className="space-y-3 mb-5">
                {items.map(item => (
                  <li key={item.ItemID} className="flex justify-between gap-3 text-sm">
                    <span className="text-slate-600 flex-1">{item.ShortDescription || item.ItemID} × {item.qty}</span>
                    <span className="font-semibold text-slate-900">${(item.price * item.qty).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-2 text-sm border-t border-slate-200 pt-4">
                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-slate-600"><span>Shipping</span><span>{shippingTotal === 0 ? 'FREE' : `$${shippingTotal.toFixed(2)}`}</span></div>
                <div className="flex justify-between text-slate-600"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
                <div className="flex justify-between pt-3 mt-3 border-t border-slate-200 font-bold text-lg text-slate-900">
                  <span>Total</span><span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Elements>
  )
}
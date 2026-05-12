/**
 * Stripe payment flow — mirrors the working Razorpay pattern:
 * 1. Frontend tokenizes card → pm_xxx
 * 2. Frontend creates PaymentIntent at Stripe (manual capture) → pi_xxx
 * 3. Frontend creates OMS order WITHOUT payment block
 * 4. Frontend calls changeOrder to attach the FULL authorization
 *    (with PaymentStatus: 'AUTHORIZED', AuthorizationID = pi_xxx)
 * 5. Frontend resolves the auto-applied holds
 */

import axios from 'axios'
import { loadStripe } from '@stripe/stripe-js'
import { apiClient } from './auth.js'
import { STRIPE_CONFIG } from '../config/stripe.js'

let stripePromise = null
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_CONFIG.PUBLISHABLE_KEY)
  }
  return stripePromise
}

// ── Tokenize the card via Stripe.js → returns pm_xxx ──
export const tokenizeCard = async ({ stripe, cardElement, customerInfo }) => {
  const { error, paymentMethod } = await stripe.createPaymentMethod({
    type: 'card',
    card: cardElement,
    billing_details: {
      name: `${customerInfo.firstName} ${customerInfo.lastName}`.trim(),
      email: customerInfo.email,
      phone: customerInfo.phone || undefined,
    },
  })
  if (error) throw new Error(error.message || 'Card tokenization failed')
  return paymentMethod
}

// ── Create PaymentIntent at Stripe (manual capture) → returns pi_xxx ──
export const createStripeAuthorization = async ({
  paymentToken,
  amount,
  customerInfo,
  shippingAddress,
  orderRef,
}) => {
  if (!STRIPE_CONFIG.SECRET_KEY) {
    throw new Error('STRIPE_CONFIG.SECRET_KEY is undefined — check .env')
  }

  const amountCents = Math.round(amount * 100)
  const customerName = `${customerInfo.firstName} ${customerInfo.lastName}`.trim()

  const formData = new URLSearchParams()
  formData.append('amount', String(amountCents))
  formData.append('currency', 'usd')
  formData.append('payment_method', paymentToken)
  formData.append('capture_method', 'manual')
  formData.append('confirm', 'true')
  formData.append('automatic_payment_methods[enabled]', 'true')
  formData.append('automatic_payment_methods[allow_redirects]', 'never')
  formData.append('description', `Aurora Store order — ${orderRef || 'PENDING'}`)
  formData.append('shipping[name]', customerName)
  formData.append('shipping[address][line1]', shippingAddress?.address1 || 'N/A')
  formData.append('shipping[address][city]', shippingAddress?.city || 'N/A')
  formData.append('shipping[address][state]', shippingAddress?.state || 'N/A')
  formData.append('shipping[address][postal_code]', shippingAddress?.zip || '00000')
  formData.append('shipping[address][country]', shippingAddress?.country || 'US')
  formData.append('metadata[order_ref]', orderRef || 'PENDING')
  formData.append('metadata[customer_email]', customerInfo?.email || '')

  const res = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_CONFIG.SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  const data = await res.json()
  if (!res.ok || data.error) {
    console.error('Stripe error response:', data)
    throw new Error(data.error?.message || 'Stripe authorization failed')
  }

  return {
    paymentIntentId: data.id,
    clientSecret: data.client_secret,
    status: data.status,
    amount: data.amount / 100,
    currency: data.currency,
    nextAction: data.next_action || null,
  }
}

// ── Handle 3DS challenge if Stripe requires it ──
export const handle3DSChallenge = async ({ stripe, clientSecret }) => {
  const { error, paymentIntent } = await stripe.handleNextAction({ clientSecret })
  if (error) throw new Error(error.message || '3D Secure authentication failed')
  if (paymentIntent.status !== 'requires_capture') {
    throw new Error(`Payment status after 3DS: ${paymentIntent.status}`)
  }
  return paymentIntent
}

// ─────────────────────────────────────────────────────────────────────────
// Store the Stripe authorization in OMS via changeOrder.
// EXACTLY mirrors the working Razorpay storePaymentMethodInOMS pattern:
//   - PaymentStatus: 'AUTHORIZED'
//   - PaymentMethod with all auth fields populated (AuthID = pi_xxx)
//   - PaymentDetailsList → PaymentDetails with ChargeType=AUTHORIZATION
// ─────────────────────────────────────────────────────────────────────────
export const storePaymentMethodInOMS = async ({
  orderNo,
  paymentToken,
  paymentIntentId,
  amount,
  customerInfo
}) => {
  const expiryDate = '2026-12-31T23:59:59'
  const amountStr = amount.toFixed(2)

  const payload = {
    OrderNo: orderNo,
    EnterpriseCode: 'Aurora',
    DocumentType: '0001',
    PaymentMethods: {
      PaymentMethod: [{
        PaymentType: 'STRIPE_CARD',
        ChargeSequence: '0',              // ← 0 not 1
        UnlimitedCharges: 'N',
        MaxChargeLimit: amountStr,
        PaymentReference1: paymentToken,  // pm_xxx
        PaymentReference2: 'STRIPE',
        PaymentReference3: 'AUTHORIZED',
        FirstName: customerInfo.firstName,
        LastName: customerInfo.lastName,

        // ← PaymentDetails directly, NOT PaymentDetailsList
        PaymentDetails: {
          ChargeType: 'AUTHORIZATION',
          RequestAmount: amountStr,
          ProcessedAmount: amountStr,
          AuthorizationID: paymentIntentId,  // pi_xxx
          AuthCode: 'AUTH_SUCCESS',          // ← AuthCode not AuthorizationCode
          AuthorizationExpirationDate: expiryDate
          // ← NO HoldAgainstBook, NO TranAmount, NO RequestProcessed
        }
      }]
    }
  }

  const res = await apiClient.post('/invoke/changeOrder', payload)
  return res.data
}

// ── Resolve auto-applied holds ──
export const resolveDefaultHolds = async (orderNo) => {
  const holdsToResolve = ['YCD_DUPLICATE_ORDER', 'YCD_FRAUD_CHECK']
  const results = []

  for (const holdType of holdsToResolve) {
    try {
      await apiClient.post('/invoke/changeOrder', {
        OrderNo: orderNo,
        EnterpriseCode: 'Aurora',
        DocumentType: '0001',
        Holds: {
          Hold: [
            {
              HoldType: holdType,
              Status: '1300_10',
              ReasonText: 'Auto-resolved by storefront',
            },
          ],
        },
      })
      results.push({ holdType, ok: true })
    } catch (e) {
      console.warn(`Could not resolve hold ${holdType}:`, e?.response?.data || e.message)
      results.push({ holdType, ok: false })
    }
  }
  return results
}

// ─────────────────────────────────────────────────────────────────────────
// Convenience wrapper: store auth + release PAYMENT_HOLD
// (mirrors the old saveAuthorizedPaymentToOMS pattern)
// ─────────────────────────────────────────────────────────────────────────
export const saveAuthorizedPaymentToOMS = async ({
  orderNo,
  paymentToken,
  paymentIntentId,
  amount,
  customerInfo,
}) => {
  await storePaymentMethodInOMS({
    orderNo,
    paymentToken,
    paymentIntentId,
    amount,
    customerInfo,
  })

  // Release auto-applied holds so order moves forward
  await resolveDefaultHolds(orderNo)

  // Release standard PAYMENT_HOLD if exists
  try {
    await apiClient.post('/invoke/changeOrder', {
      OrderNo: orderNo,
      EnterpriseCode: 'Aurora',
      DocumentType: '0001',
      Holds: {
        Hold: [{
          HoldType: 'PAYMENT_HOLD',
          Status: 'RESOLVED',
          ReasonText: 'Stripe authorization stored by storefront',
        }],
      },
    })
  } catch (e) {
    console.warn('PAYMENT_HOLD release skipped:', e?.response?.data || e.message)
  }

  return true
}
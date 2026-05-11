/**
 * Payment flow (Stripe tokenization only)
 * ────────────────────────────────────────
 * 1. Frontend: stripe.createPaymentMethod()  →  pm_xxx  (publishable key, safe in browser)
 * 2. Frontend stores pm_xxx in OMS order via changeOrder
 * 3. IBM Sterling OMS payment-collection agent calls Stripe with the secret key
 *    to create + confirm a PaymentIntent  →  authorization recorded in OMS
 * 4. OMS captures the authorization after the shipment invoice is created
 *
 * The frontend NEVER creates a PaymentIntent — that keeps the secret key
 * on the server (OMS / your backend) where it belongs.
 */

import { loadStripe } from '@stripe/stripe-js'
import { apiClient } from './auth.js'
import { STRIPE_CONFIG } from '../config/stripe.js'

// ---------------------------------------------------------------------------
// Singleton Stripe.js instance (publishable key only — safe in the browser)
// ---------------------------------------------------------------------------
let stripePromise = null
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_CONFIG.PUBLISHABLE_KEY)
  }
  return stripePromise
}

// ---------------------------------------------------------------------------
// Step 1 (frontend only): tokenize the card → returns pm_xxx
//
// This is the ONLY Stripe API call the frontend makes.
// No charge, no authorization — just a reusable payment-method token.
// ---------------------------------------------------------------------------
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

  if (error) {
    throw new Error(error.message || 'Card tokenization failed')
  }

  // paymentMethod.id === 'pm_xxx'  ← this is your OMS token
  return paymentMethod
}

// ---------------------------------------------------------------------------
// Step 2: persist the Stripe PaymentMethod token in IBM Sterling OMS
//
// OMS treats PaymentReference1 as the external token it will pass to Stripe
// when its payment-collection agent authorizes (and later captures) the order.
// We do NOT record an AUTHORIZATION entry here — OMS writes that itself
// after its agent successfully calls Stripe.
// ---------------------------------------------------------------------------
export const storePaymentMethodInOMS = async ({
  orderNo,
  paymentToken,   // pm_xxx  from tokenizeCard()
  amount,
  customerInfo,
}) => {
  const amountStr = amount.toFixed(2)

  const payload = {
    OrderNo: orderNo,
    EnterpriseCode: 'Aurora',
    DocumentType: '0001',

    PaymentMethods: {
      PaymentMethod: [
        {
          PaymentType: 'CREDIT_CARD',
          ChargeSequence: '1',

          // This is the field OMS payment rules read when calling Stripe
          PaymentReference1: paymentToken,    // pm_xxx
          PaymentReference2: 'STRIPE',
          PaymentReference3: 'PENDING_AUTH',  // OMS updates this to AUTHORIZED

          DisplayCreditCardNo: '****',
          CreditCardNo: paymentToken,
          SvcNo: paymentToken,

          RequestedChargeAmount: amountStr,
          MaxChargeLimit: amountStr,
          UnlimitedCharges: 'N',

          PaymentDetailsList: {
            PaymentDetails: [
              {
                ChargeType: 'AUTHORIZATION',
                RequestAmount: amountStr,
                ProcessedAmount: '0.00',
                RequestProcessed: 'N',   // ← tells the agent this needs processing
                HoldAgainstBook: 'Y'
              }
            ]
          },

          PersonInfoBillTo: {
            FirstName: customerInfo.firstName,
            LastName: customerInfo.lastName,
            EMailID: customerInfo.email,
            DayPhone: customerInfo.phone || '',
          },

          // No PaymentDetailsList — OMS writes the AUTHORIZATION record itself
          // once its payment agent calls Stripe and gets a successful response.
        },
      ],
    },
  }

  const res = await apiClient.post('/invoke/changeOrder', payload)
  return res.data
}

// ---------------------------------------------------------------------------
// Convenience wrapper: store token + release the PAYMENT_HOLD
// so OMS's payment-collection agent picks up the order immediately.
// ---------------------------------------------------------------------------
export const savePaymentTokenToOMS = async ({
  orderNo,
  paymentToken,
  amount,
  customerInfo,
}) => {
  await storePaymentMethodInOMS({ orderNo, paymentToken, amount, customerInfo })

  try {
    await apiClient.post('/invoke/changeOrder', {
      OrderNo: orderNo,
      EnterpriseCode: 'Aurora',
      DocumentType: '0001',
      Holds: {
        Hold: [
          {
            HoldType: 'PAYMENT_HOLD',
            Status: 'RESOLVED',
            ReasonText: 'Stripe payment method token stored by storefront',
          },
        ],
      },
    })
  } catch (e) {
    console.warn('Hold release failed (may not exist):', e?.response?.data || e.message)
  }

  return true
}
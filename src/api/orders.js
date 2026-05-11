import { apiClient } from './auth.js'

// Generate consistent price from ItemID
const getItemPrice = (item) => {
  const price = parseFloat(item?.price || item?.UnitCost || 0)
  if (price > 0) return price
  const id = item?.ItemID || 'ITEM'
  const hash = id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  return parseFloat(((hash % 150) + 19.99).toFixed(2))
}

export const createOrder = async ({
  cartItems,
  customerInfo,
  shippingAddress,
  shipNode,
  customerId,
  paymentToken,      // pm_xxx
  paymentGateway,    // 'STRIPE'
  amount,            // authorization amount
}) => {
  const orderableItems = cartItems.filter(item => !item.IsModelItem)

  if (orderableItems.length === 0) {
    throw new Error('All items require variant selection.')
  }

  const isBopis = !!shipNode
  const lineSubTotal = orderableItems.reduce(
    (sum, item) => sum + getItemPrice(item) * parseInt(item.qty || 1),
    0
  )

  const payload = {
    EnterpriseCode: 'Aurora',
    BuyerOrganizationCode: 'Aurora',
    SellerOrganizationCode: 'Aurora',
    DocumentType: '0001',
    ...(customerId ? { CustomerID: customerId, BillToID: customerId } : {}),
    DeliveryMethod: isBopis ? 'PICK' : 'SHP',
    OrderLines: {
      OrderLine: orderableItems.map((item, index) => ({
        PrimeLineNo: String(index + 1),
        SubLineNo: '1',
        LineType: 'PRODUCT',
        Item: {
          ItemID: item.ItemID,
          UnitOfMeasure: item.UnitOfMeasure || 'EACH',
          OrganizationCode: 'Aurora-Corp',
        },
        OrderedQty: String(item.qty || 1),
        DeliveryMethod: isBopis ? 'PICK' : 'SHP',
        ...(isBopis ? { ShipNode: shipNode } : {}),
        LinePriceInfo: {
          IsPriceLocked: 'Y',
          UnitPrice: getItemPrice(item).toFixed(2),
          RetailPrice: getItemPrice(item).toFixed(2),
          ExtendedPrice: (getItemPrice(item) * parseInt(item.qty || 1)).toFixed(2),
        },
      })),
    },
    PersonInfoBillTo: {
      FirstName: customerInfo.firstName,
      LastName: customerInfo.lastName,
      EMailID: customerInfo.email,
      DayPhone: customerInfo.phone || '',
      AddressLine1: shippingAddress.address1,
      City: shippingAddress.city,
      State: shippingAddress.state,
      ZipCode: shippingAddress.zip,
      Country: shippingAddress.country || 'US',
    },
    PersonInfoShipTo: {
      FirstName: customerInfo.firstName,
      LastName: customerInfo.lastName,
      EMailID: customerInfo.email,
      AddressLine1: shippingAddress.address1,
      City: shippingAddress.city,
      State: shippingAddress.state,
      ZipCode: shippingAddress.zip,
      Country: shippingAddress.country || 'US',
    },
  }

  if (isBopis) {
    payload.ShipNode = shipNode
  }

  // ── Attach Stripe token atomically during order creation ──
  if (paymentToken && amount > 0) {
    const amountStr = amount.toFixed(2)
    payload.PaymentMethods = {
      PaymentMethod: [
        {
          PaymentType: 'CREDIT_CARD',
          ChargeSequence: '1',
          PaymentReference1: paymentToken,               // pm_xxx
          PaymentReference2: paymentGateway || 'STRIPE',
          PaymentReference3: 'PENDING_AUTH',
          DisplayCreditCardNo: '****',
          CreditCardNo: '************',                // masked — NEVER the token
          SvcNo: '',                                   // CVV only
          RequestedChargeAmount: amountStr,
          MaxChargeLimit: amountStr,
          UnlimitedCharges: 'N',
          PaymentDetailsList: {
            PaymentDetails: [
              {
                ChargeType: 'AUTHORIZATION',
                RequestAmount: amountStr,
                ProcessedAmount: '0.00',
                RequestProcessed: 'N',
                HoldAgainstBook: 'Y',
              },
            ],
          },
          PersonInfoBillTo: {
            FirstName: customerInfo.firstName,
            LastName: customerInfo.lastName,
            EMailID: customerInfo.email,
            DayPhone: customerInfo.phone || '',
          },
        },
      ],
    }
  }

  console.log('createOrder payload', payload)

  const res = await apiClient.post('/invoke/createOrder', payload)

  return {
    ...res.data,
    calculatedTotal: lineSubTotal.toFixed(2),
  }
}

export const fetchOrders = async (max = 20) => {
  const res = await apiClient.get('/order', {
    params: { EnterpriseCode: 'Aurora', MaximumRecords: max },
  })
  return Array.isArray(res.data) ? res.data : [res.data].filter(Boolean)
}

export const fetchOrderByNo = async (orderNo) => {
  try {
    const detailRes = await apiClient.post('/invoke/getOrderDetails', {
      OrderNo: orderNo.trim(),
      EnterpriseCode: 'Aurora',
      DocumentType: '0001',
    })
    return detailRes.data
  } catch {
    const searchRes = await apiClient.get('/order', {
      params: {
        OrderNo: orderNo.trim(),
        EnterpriseCode: 'Aurora',
        MaximumRecords: 1,
      },
    })
    const data = Array.isArray(searchRes.data) ? searchRes.data[0] : searchRes.data
    if (!data) throw new Error('Order not found')
    return data
  }
}

export const fetchMyOrders = async (email, max = 50) => {
  const res = await apiClient.get('/order', {
    params: {
      EnterpriseCode: 'Aurora',
      CustomerEMailID: email,
      MaximumRecords: max,
    },
  })
  return Array.isArray(res.data) ? res.data : [res.data].filter(Boolean)
}

export const cancelOrder = async (orderNo) => {
  const res = await apiClient.post('/invoke/changeOrder', {
    OrderNo: orderNo,
    EnterpriseCode: 'Aurora',
    DocumentType: '0001',
    Action: 'CANCEL',
  })
  return res.data
}
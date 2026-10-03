import api from './axios'

/*
 * Admin order management + sales (Phase 9). Reuses the role-aware /orders
 * endpoint: staff automatically see every order, customers only their own —
 * enforced server-side in OrderController, not by the route path.
 */

export function fetchOrders(params = {}) {
  return api.get('/orders', { params }).then((res) => res.data)
}

export function fetchOrder(id) {
  return api.get(`/orders/${id}`).then((res) => res.data)
}

export function createOrder(payload) {
  return api.post('/orders', payload).then((res) => res.data)
}

export function updateOrderStatus(id, orderStatus, notes) {
  return api
    .patch(`/orders/${id}/status`, { order_status: orderStatus, notes })
    .then((res) => res.data)
}

export function updatePaymentStatus(id, paymentStatus) {
  return api
    .patch(`/orders/${id}/payment-status`, { payment_status: paymentStatus })
    .then((res) => res.data)
}

export function cancelOrder(id, reason) {
  return api.post(`/orders/${id}/cancel`, { reason }).then((res) => res.data)
}

export function fetchInvoice(orderId) {
  return api.get(`/orders/${orderId}/invoice`).then((res) => res.data)
}

export function fetchSalesSummary(params = {}) {
  return api.get('/admin/sales/summary', { params }).then((res) => res.data)
}

export function fetchSalesByDate(params = {}) {
  return api.get('/admin/sales', { params }).then((res) => res.data)
}

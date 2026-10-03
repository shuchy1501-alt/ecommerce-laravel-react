import api from './axios'

/* Admin finance/accounting reports (Phase 12). Mirrors api/orders.js / api/returns.js style. */

export function fetchDashboard(params = {}) {
  return api.get('/admin/finance/dashboard', { params }).then((res) => res.data)
}

export function fetchRevenue(params = {}) {
  return api.get('/admin/finance/revenue', { params }).then((res) => res.data)
}

export function fetchFinancePayments(params = {}) {
  return api.get('/admin/finance/payments', { params }).then((res) => res.data)
}

export function fetchFinanceRefunds(params = {}) {
  return api.get('/admin/finance/refunds', { params }).then((res) => res.data)
}

export function fetchProfitLoss(params = {}) {
  return api.get('/admin/finance/profit-loss', { params }).then((res) => res.data)
}

export function fetchCashFlow(params = {}) {
  return api.get('/admin/finance/cash-flow', { params }).then((res) => res.data)
}

export function fetchTransactions(params = {}) {
  return api.get('/admin/finance/transactions', { params }).then((res) => res.data)
}

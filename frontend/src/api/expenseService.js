import api from './axios'

/* Admin expense + expense-category management (Phase 12). */

export function fetchExpenses(params = {}) {
  return api.get('/admin/expenses', { params }).then((res) => res.data)
}

export function fetchExpense(id) {
  return api.get(`/admin/expenses/${id}`).then((res) => res.data)
}

export function createExpense(payload) {
  return api.post('/admin/expenses', payload).then((res) => res.data)
}

export function updateExpense(id, payload) {
  return api.put(`/admin/expenses/${id}`, payload).then((res) => res.data)
}

export function markExpensePaid(id) {
  return api.post(`/admin/expenses/${id}/mark-paid`).then((res) => res.data)
}

export function cancelExpense(id) {
  return api.delete(`/admin/expenses/${id}`).then((res) => res.data)
}

export function fetchExpenseCategories() {
  return api.get('/admin/expense-categories').then((res) => res.data)
}

export function createExpenseCategory(payload) {
  return api.post('/admin/expense-categories', payload).then((res) => res.data)
}

export function updateExpenseCategory(id, payload) {
  return api.put(`/admin/expense-categories/${id}`, payload).then((res) => res.data)
}

export function deleteExpenseCategory(id) {
  return api.delete(`/admin/expense-categories/${id}`).then((res) => res.data)
}

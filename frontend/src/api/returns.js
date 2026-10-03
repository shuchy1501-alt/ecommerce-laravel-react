import api from './axios'

/*
 * Admin returns + refunds + exchanges management (Phase 11). Mirrors the
 * naming style of api/orders.js — plain functions returning res.data,
 * used by the staff-facing pages under pages/.
 */

export function fetchReturns(params = {}) {
  return api.get('/admin/returns', { params }).then((res) => res.data)
}

export function fetchReturn(id) {
  return api.get(`/admin/returns/${id}`).then((res) => res.data)
}

export function approveReturn(id, note) {
  return api.patch(`/admin/returns/${id}/approve`, { note }).then((res) => res.data)
}

export function rejectReturn(id, reason) {
  return api.patch(`/admin/returns/${id}/reject`, { reason }).then((res) => res.data)
}

export function updateReturnStatus(id, status, note) {
  return api.patch(`/admin/returns/${id}/status`, { status, note }).then((res) => res.data)
}

export function receiveReturn(id, note) {
  return api.post(`/admin/returns/${id}/receive`, { note }).then((res) => res.data)
}

export function inspectReturn(id, inspections, note) {
  return api.post(`/admin/returns/${id}/inspect`, { inspections, note }).then((res) => res.data)
}

export function fetchRefunds(params = {}) {
  return api.get('/admin/refunds', { params }).then((res) => res.data)
}

export function fetchRefund(id) {
  return api.get(`/admin/refunds/${id}`).then((res) => res.data)
}

export function processRefund(id, notes) {
  return api.post(`/admin/refunds/${id}/process`, { notes }).then((res) => res.data)
}

export function verifyRefund(id) {
  return api.post(`/admin/refunds/${id}/verify`).then((res) => res.data)
}

export function fetchExchanges(params = {}) {
  return api.get('/admin/exchanges', { params }).then((res) => res.data)
}

export function fetchExchange(id) {
  return api.get(`/admin/exchanges/${id}`).then((res) => res.data)
}

export function updateExchangeStatus(id, status) {
  return api.patch(`/admin/exchanges/${id}/status`, { status }).then((res) => res.data)
}

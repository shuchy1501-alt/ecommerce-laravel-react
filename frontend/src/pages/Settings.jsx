import { useEffect, useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { getSettingSection, updateSettingSection } from '@/api/settingsService'

/**
 * Phase 13C — /admin/settings
 *
 * One centralized page, one tab per section, all backed by the same
 * generic get/update pair (see api/settingsService.js). Field
 * configuration lives in SECTIONS below so adding a new setting is a
 * one-line change rather than a new component.
 *
 * Payment gateway secret fields (type: 'secret') are always rendered
 * blank — the API never returns their real values — and are only sent to
 * the server if the admin actually types a new one. This mirrors the
 * backend's "empty submission = leave unchanged" rule.
 */
const SECTIONS = [
  {
    key: 'general',
    label: 'General',
    fields: [
      { key: 'store_name', label: 'Store Name', type: 'text' },
      { key: 'logo', label: 'Logo URL', type: 'text' },
      { key: 'favicon', label: 'Favicon URL', type: 'text' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'currency', label: 'Currency', type: 'text', hint: 'ISO code, e.g. BDT' },
      { key: 'timezone', label: 'Timezone', type: 'text', hint: 'e.g. Asia/Dhaka' },
    ],
  },
  {
    key: 'store',
    label: 'Store',
    fields: [
      { key: 'store_name', label: 'Store Name', type: 'text' },
      { key: 'description', label: 'Store Description', type: 'textarea' },
      { key: 'logo', label: 'Store Logo URL', type: 'text' },
      { key: 'contact_email', label: 'Contact Email', type: 'email' },
      { key: 'contact_phone', label: 'Contact Phone', type: 'text' },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'facebook', label: 'Facebook URL', type: 'text' },
      { key: 'instagram', label: 'Instagram URL', type: 'text' },
      { key: 'youtube', label: 'YouTube URL', type: 'text' },
      { key: 'website', label: 'Website URL', type: 'text' },
    ],
  },
  {
    key: 'order',
    label: 'Order',
    fields: [
      { key: 'number_prefix', label: 'Order Number Prefix', type: 'text' },
      { key: 'minimum_amount', label: 'Minimum Order Amount', type: 'number' },
      { key: 'cancellation_window_hours', label: 'Cancellation Window (hours)', type: 'number' },
      { key: 'auto_confirm', label: 'Auto-confirm new orders', type: 'checkbox' },
      { key: 'notify_on_new_order', label: 'Notify admins on new order', type: 'checkbox' },
    ],
  },
  {
    key: 'payment',
    label: 'Payment',
    fields: [
      { key: 'cod_enabled', label: 'Cash on Delivery enabled', type: 'checkbox' },
      { key: 'cod_instructions', label: 'COD Instructions', type: 'textarea' },
      { key: 'online_enabled', label: 'Online Payment enabled', type: 'checkbox' },
      { key: 'online_gateway', label: 'Gateway Name', type: 'text', hint: 'e.g. stripe, sslcommerz' },
      { key: 'online_api_key', label: 'API Key', type: 'secret' },
      { key: 'online_api_secret', label: 'API Secret', type: 'secret' },
      { key: 'online_private_key', label: 'Private Key', type: 'secret' },
      { key: 'online_gateway_secret', label: 'Gateway Secret', type: 'secret' },
      { key: 'online_merchant_secret', label: 'Merchant Secret', type: 'secret' },
    ],
  },
  {
    key: 'shipping',
    label: 'Shipping',
    fields: [
      { key: 'default_charge', label: 'Default Shipping Charge', type: 'number' },
      { key: 'free_shipping_threshold', label: 'Free Shipping Threshold', type: 'number' },
      { key: 'areas', label: 'Shipping Areas', type: 'list', hint: 'Comma-separated, e.g. Dhaka, Chattogram' },
      { key: 'charge_by_area', label: 'Delivery Charge by Area', type: 'map', hint: 'One "Area: Charge" per line, e.g. Dhaka: 60' },
    ],
  },
  {
    key: 'return',
    label: 'Return',
    fields: [
      { key: 'return_window_days', label: 'Return Window (days)', type: 'number' },
      { key: 'exchange_window_days', label: 'Exchange Window (days)', type: 'number' },
      { key: 'refund_policy', label: 'Refund Policy', type: 'textarea' },
      { key: 'conditions', label: 'Return Conditions', type: 'textarea' },
      { key: 'non_returnable_rules', label: 'Non-returnable Product Rules', type: 'textarea' },
    ],
  },
  {
    key: 'tax',
    label: 'Tax',
    fields: [
      { key: 'enabled', label: 'Tax enabled', type: 'checkbox' },
      { key: 'percentage', label: 'Tax Percentage', type: 'number' },
      { key: 'display', label: 'Tax Display', type: 'select', options: ['inclusive', 'exclusive'] },
    ],
  },
  {
    key: 'notification',
    label: 'Notification',
    fields: [
      { key: 'admin_enabled', label: 'Admin notifications enabled', type: 'checkbox' },
      { key: 'customer_enabled', label: 'Customer notifications enabled', type: 'checkbox' },
    ],
  },
  {
    key: 'seo',
    label: 'SEO',
    fields: [
      { key: 'site_title', label: 'Site Title', type: 'text' },
      { key: 'meta_description', label: 'Meta Description', type: 'textarea' },
      { key: 'meta_keywords', label: 'Meta Keywords', type: 'text' },
      { key: 'og_title', label: 'OG Title', type: 'text' },
      { key: 'og_description', label: 'OG Description', type: 'textarea' },
      { key: 'og_image', label: 'OG Image URL', type: 'text' },
      { key: 'default_image', label: 'Default SEO Image URL', type: 'text' },
    ],
  },
]

function listToArray(value) {
  return (value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

function mapToObject(value) {
  const result = {}
  for (const line of (value || '').split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const val = Number(line.slice(idx + 1).trim())
    if (key && !Number.isNaN(val)) result[key] = val
  }
  return result
}

function objectToMapString(obj) {
  return Object.entries(obj || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
}

function SectionForm({ section, canUpdate, toast }) {
  const [values, setValues] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    getSettingSection(section.key)
      .then((res) => {
        if (!active) return
        const data = res.data || {}
        const shaped = { ...data }
        for (const f of section.fields) {
          if (f.type === 'list') shaped[f.key] = (data[f.key] || []).join(', ')
          if (f.type === 'map') shaped[f.key] = objectToMapString(data[f.key])
          if (f.type === 'secret') shaped[f.key] = '' // always start blank — write-only field
        }
        setValues(shaped)
      })
      .catch((err) => toast.error(err.message || `Failed to load ${section.label} settings.`))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.key])

  const setField = (key, val) => setValues((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {}
      for (const f of section.fields) {
        const raw = values[f.key]
        if (f.type === 'secret' && (raw === '' || raw === null || raw === undefined)) {
          continue // leave unchanged server-side
        }
        if (f.type === 'list') {
          payload[f.key] = listToArray(raw)
        } else if (f.type === 'map') {
          payload[f.key] = mapToObject(raw)
        } else {
          payload[f.key] = raw
        }
      }

      const res = await updateSettingSection(section.key, payload)
      const data = res.data || {}
      const shaped = { ...data }
      for (const f of section.fields) {
        if (f.type === 'list') shaped[f.key] = (data[f.key] || []).join(', ')
        if (f.type === 'map') shaped[f.key] = objectToMapString(data[f.key])
        if (f.type === 'secret') shaped[f.key] = ''
      }
      setValues(shaped)
      toast.success(`${section.label} settings updated.`)
    } catch (err) {
      toast.error(err.message || `Could not update ${section.label} settings.`)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !values) {
    return <p className="py-8 text-center text-sm text-stone">Loading {section.label} settings…</p>
  }

  return (
    <form onSubmit={handleSubmit} className="grid max-w-2xl gap-5">
      {section.fields.map((f) => {
        if (f.type === 'checkbox') {
          return (
            <label key={f.key} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={!!values[f.key]}
                disabled={!canUpdate}
                onChange={(e) => setField(f.key, e.target.checked)}
                className="h-4 w-4 rounded-sm border-stone-light accent-ink"
              />
              {f.label}
            </label>
          )
        }

        if (f.type === 'textarea' || f.type === 'map') {
          return (
            <div key={f.key} className="flex flex-col gap-1.5">
              <label className="text-xs font-utility uppercase tracking-wider text-stone">{f.label}</label>
              <textarea
                rows={f.type === 'map' ? 4 : 3}
                value={values[f.key] || ''}
                disabled={!canUpdate}
                onChange={(e) => setField(f.key, e.target.value)}
                className="w-full rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink focus:border-oxblood"
              />
              {f.hint && <p className="text-xs text-stone">{f.hint}</p>}
            </div>
          )
        }

        if (f.type === 'select') {
          return (
            <div key={f.key} className="flex flex-col gap-1.5">
              <label className="text-xs font-utility uppercase tracking-wider text-stone">{f.label}</label>
              <select
                value={values[f.key] || ''}
                disabled={!canUpdate}
                onChange={(e) => setField(f.key, e.target.value)}
                className="w-full rounded-sm border border-stone-light bg-white px-3 py-2 text-sm text-ink focus:border-oxblood"
              >
                {f.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )
        }

        return (
          <div key={f.key}>
            <Input
              label={f.label}
              type={f.type === 'secret' ? 'password' : f.type === 'number' ? 'number' : f.type}
              value={values[f.key] ?? ''}
              disabled={!canUpdate}
              placeholder={f.type === 'secret' ? '•••••••• (leave blank to keep unchanged)' : undefined}
              hint={f.type === 'secret' ? undefined : f.hint}
              onChange={(e) => setField(f.key, e.target.value)}
              autoComplete={f.type === 'secret' ? 'new-password' : 'off'}
            />
            {f.type === 'secret' && <p className="mt-1 text-xs text-stone">Write-only — never displayed once saved.</p>}
          </div>
        )
      })}

      {canUpdate ? (
        <div>
          <Button type="submit" loading={saving}>
            Save {section.label} Settings
          </Button>
        </div>
      ) : (
        <Badge tone="warning">Read-only — you don't have permission to update settings</Badge>
      )}
    </form>
  )
}

export default function Settings() {
  const { can } = useAuth()
  const toast = useToast()
  const canView = can('settings.view')
  const canUpdate = can('settings.update')
  const [active, setActive] = useState(SECTIONS[0].key)

  const activeSection = useMemo(() => SECTIONS.find((s) => s.key === active), [active])

  if (!canView) {
    return (
      <div className="rounded-sm border border-stone-light bg-white p-8 text-center">
        <p className="text-sm text-stone">You don't have permission to view settings.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Settings</h1>
        <p className="text-sm text-stone">Manage store-wide configuration across every section.</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex shrink-0 gap-1 overflow-x-auto lg:w-48 lg:flex-col lg:overflow-visible">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={`whitespace-nowrap rounded-sm px-3 py-2 text-left text-sm font-medium transition-colors ${
                active === s.key ? 'bg-ink text-bone' : 'text-ink hover:bg-bone-dim'
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 rounded-sm border border-stone-light bg-white p-6">
          <SectionForm key={activeSection.key} section={activeSection} canUpdate={canUpdate} toast={toast} />
        </div>
      </div>
    </div>
  )
}

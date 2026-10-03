import { useEffect, useRef, useState, useCallback } from 'react'
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '@/api/notificationService'

/**
 * Phase 13C — notification bell + dropdown.
 *
 * Used in both the admin Navbar and the storefront Header. `variant`
 * switches only the color tokens (the admin shell uses ink/bone/stone-*,
 * the storefront uses brand-*) — the data logic is identical since the
 * backend already scopes /api/notifications to whichever user is
 * authenticated.
 */
const THEME = {
  admin: {
    trigger: 'text-ink hover:bg-bone-dim',
    panel: 'border-stone-light bg-white',
    header: 'border-stone-light',
    item: 'border-stone-light hover:bg-bone-dim',
    unreadDot: 'bg-ink',
    title: 'text-ink',
    subtle: 'text-ink/60',
    link: 'text-ink hover:underline',
  },
  customer: {
    trigger: 'text-brand-dark hover:bg-brand-light',
    panel: 'border-brand-border bg-white',
    header: 'border-brand-border',
    item: 'border-brand-border hover:bg-brand-light',
    unreadDot: 'bg-brand-primary',
    title: 'text-brand-dark',
    subtle: 'text-gray-500',
    link: 'text-brand-primary hover:underline',
  },
}

function timeAgo(dateString) {
  const date = new Date(dateString)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

export default function NotificationBell({ variant = 'admin' }) {
  const theme = THEME[variant] || THEME.admin
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const rootRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getNotifications({ per_page: 10 })
      setNotifications(res.data || [])
      setUnreadCount(res.meta?.unread_count ?? 0)
    } catch {
      // Silent — a failed notification fetch shouldn't disrupt the page.
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    // Light polling so the badge stays fresh without needing websockets.
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleMarkRead = async (id, e) => {
    e.stopPropagation()
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnreadCount((c) => Math.max(0, c - 1))
    try {
      await markNotificationRead(id)
    } catch {
      load()
    }
  }

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    try {
      await markAllNotificationsRead()
    } catch {
      load()
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    const wasUnread = notifications.find((n) => n.id === id)?.read === false
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1))
    try {
      await deleteNotification(id)
    } catch {
      load()
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
        className={`relative rounded-full p-2 ${theme.trigger}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-sm rounded-lg border shadow-lg sm:w-96 ${theme.panel}`}
        >
          <div className={`flex items-center justify-between border-b px-4 py-3 ${theme.header}`}>
            <span className={`text-sm font-semibold ${theme.title}`}>Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className={`flex items-center gap-1 text-xs font-medium ${theme.link}`}
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 && (
              <p className={`px-4 py-8 text-center text-sm ${theme.subtle}`}>Loading…</p>
            )}

            {!loading && notifications.length === 0 && (
              <p className={`px-4 py-8 text-center text-sm ${theme.subtle}`}>You're all caught up.</p>
            )}

            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-2 border-b px-4 py-3 last:border-b-0 ${theme.item} ${
                  !n.read ? 'bg-black/[0.02]' : ''
                }`}
              >
                {!n.read && <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${theme.unreadDot}`} />}
                <div className={`flex-1 ${n.read ? 'pl-4' : ''}`}>
                  <p className={`text-sm font-medium ${theme.title}`}>{n.title}</p>
                  <p className={`mt-0.5 text-sm ${theme.subtle}`}>{n.message}</p>
                  <p className={`mt-1 text-xs ${theme.subtle}`}>{timeAgo(n.created_at)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!n.read && (
                    <button
                      onClick={(e) => handleMarkRead(n.id, e)}
                      aria-label="Mark as read"
                      className={`rounded p-1 ${theme.subtle} hover:text-current`}
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(n.id, e)}
                    aria-label="Delete notification"
                    className={`rounded p-1 ${theme.subtle} hover:text-danger`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

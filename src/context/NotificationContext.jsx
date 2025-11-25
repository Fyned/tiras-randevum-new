import React, { createContext, useState, useEffect, useContext } from 'react'
import { supabase } from '../supabase'
import { useAuth } from './AuthContext'

const NotificationContext = createContext()

export function NotificationProvider({ children }) {
  const { session } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [permission, setPermission] = useState(Notification.permission)

  useEffect(() => {
    if (session) {
      fetchNotifications()
      
      // 1. OTOMATİK İZİN İSTE (Site açıldıktan 3 saniye sonra sor)
      if (Notification.permission === 'default') {
        setTimeout(() => {
            requestPermission()
        }, 3000)
      }

      // 2. REALTIME DİNLEME
      const subscription = supabase
        .channel('public:notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, (payload) => {
          handleNewNotification(payload.new)
        })
        .subscribe()

      return () => {
        supabase.removeChannel(subscription)
      }
    }
  }, [session])

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    }
  }

  const handleNewNotification = (newNotif) => {
    setNotifications(prev => [newNotif, ...prev])
    setUnreadCount(prev => prev + 1)

    // Tarayıcı Bildirimi (PC ve Mobile)
    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(newNotif.title, {
          body: newNotif.message,
          icon: '/pwa-192x192.png',
          vibrate: [200, 100, 200],
          tag: 'new-appointment'
        })
        notif.onclick = function() {
          window.open(window.location.origin + (newNotif.link || '/shop-panel'))
        }
      } catch (e) { console.error(e) }
    }
  }

  const requestPermission = async () => {
    const perm = await Notification.requestPermission()
    setPermission(perm)
    if (perm === 'granted') {
      // İsteğe bağlı: Kullanıcıya teşekkür mesajı gösterilebilir
      console.log("Bildirim izni verildi.")
    }
  }

  const markAsRead = async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id)
    setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, permission, requestPermission, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => useContext(NotificationContext)
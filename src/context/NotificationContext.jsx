import React, { createContext, useState, useEffect, useContext } from 'react'
import { supabase } from '../supabase'
import { useAuth } from './AuthContext'

const NotificationContext = createContext()

export function NotificationProvider({ children }) {
  const { session } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  
  // KRİTİK DÜZELTME: iPhone tarayıcıda çökmemesi için güvenli kontrol
  const [permission, setPermission] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission
    }
    return 'denied' // Desteklemiyorsa reddedildi say, çökme yapma
  })

  useEffect(() => {
    if (session) {
      fetchNotifications()
      
      // Sadece destekleyen tarayıcılarda izin iste
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        setTimeout(() => {
            requestPermission()
        }, 3000)
      }

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

    // Güvenli bildirim gönderimi
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        // Titreşim desteği kontrolü
        const vibrate = window.navigator?.vibrate ? [200, 100, 200] : []
        
        if (navigator.serviceWorker && navigator.serviceWorker.ready) {
             navigator.serviceWorker.ready.then(registration => {
                 registration.showNotification(newNotif.title, {
                     body: newNotif.message,
                     icon: '/pwa-192x192.png',
                     vibrate: vibrate,
                     tag: 'new-appointment'
                 })
             })
        } else {
            const notif = new Notification(newNotif.title, {
              body: newNotif.message,
              icon: '/pwa-192x192.png',
              vibrate: vibrate,
              tag: 'new-appointment'
            })
            notif.onclick = function() {
              window.open(window.location.origin + (newNotif.link || '/shop-panel'))
            }
        }
      } catch (e) { console.error("Bildirim hatası:", e) }
    }
  }

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
    } catch (e) { console.error("İzin isteği hatası:", e) }
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
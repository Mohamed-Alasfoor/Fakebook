"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, MessageSquare } from "lucide-react"

interface NotificationProps {
  message: string
  username: string
  onClose?: () => void
}

export default function NotificationPopup({ message, username, onClose }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  const hideNotification = useCallback(() => {
    setIsVisible(false)
    if (onClose) {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    const timer = setTimeout(() => {
      hideNotification()
    }, 5000)

    return () => clearTimeout(timer)
  }, [hideNotification])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg p-4 max-w-sm w-full text-white"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                <MessageSquare size={18} className="text-yellow-300" />
                <h3 className="font-semibold text-lg">{username}</h3>
              </div>
              <button onClick={hideNotification} className="text-white/70 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-white/90 mt-1">{username} sent you a message</p>
            <p className="text-sm font-medium mt-2 bg-white/10 p-2 rounded">"{message}"</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


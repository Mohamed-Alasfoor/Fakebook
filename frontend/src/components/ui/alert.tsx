"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"

interface AlertProps {
  title: string
  message: string
  type: "success" | "error" | "info"
  duration?: number
  onClose?: () => void
}

const Alert: React.FC<AlertProps> = ({
  title,
  message,
  type,
  duration = 5000, 
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(false)
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const handleClose = () => {
    setIsOpen(false)
    onClose?.()
  }

  const getAlertStyle = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-500 text-green-700"
      case "error":
        return "bg-red-50 border-red-500 text-red-700"
      case "info":
      default:
        return "bg-blue-50 border-blue-500 text-blue-700"
    }
  }

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case "error":
        return <AlertCircle className="w-6 h-6 text-red-500" />
      case "info":
      default:
        return <Info className="w-6 h-6 text-blue-500" />
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-[9999] max-w-md"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className={`rounded-lg shadow-xl p-6 w-full relative z-10 border-l-4 ${getAlertStyle()}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                {getIcon()}
                <h2 className="text-xl font-semibold">{title}</h2>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-gray-600 ml-9">{message}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Alert

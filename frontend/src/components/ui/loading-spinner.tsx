import type React from "react"

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large"
  color?: "primary" | "secondary" | "white" | "custom"
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "medium", color = "custom" }) => {
  const sizeClasses = {
    small: "w-4 h-4 border-2",
    medium: "w-8 h-8 border-4",
    large: "w-12 h-12 border-4",
  }

  const colorClasses = {
    primary: "border-blue-500",
    secondary: "border-gray-300",
    white: "border-white",
    custom: "border-[rgb(126,34,206)]",
  }

  return (
    <div className="flex justify-center items-center">
      <div
        className={`
          ${sizeClasses[size]}
          ${colorClasses[color]}
          border-t-transparent
          rounded-full
          animate-spin
        `}
      />
    </div>
  )
}

export default LoadingSpinner


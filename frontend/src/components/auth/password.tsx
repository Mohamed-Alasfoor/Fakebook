"use client"

import { Dispatch, SetStateAction, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PasswordInputProps {
  id: string
  label: string
  placeholder?: string
  required?: boolean
  value?: string
  setValue: Dispatch<SetStateAction<string>> // Ensure type matches setState
}

export function PasswordInput({
  id,
  label,
  placeholder = "Enter your password",
  required = false,
  value,
  setValue,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative group">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          required={required}
          className="pr-10 transition-all border-gray-200 group-hover:border-[#6C5CE7]/50 focus:border-[#6C5CE7] focus:ring-[#6C5CE7]/20"
          value={value}
          onChange={(e) => setValue(e.target.value)} // Ensure setValue is used correctly
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6C5CE7]"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

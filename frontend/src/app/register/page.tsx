"use client"

import { useState } from "react"
import Link from "next/link"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthLayout } from "@/components/auth/auth-layout"
import { PasswordInput } from "@/components/auth/password"
import { LoginButtons } from "@/components/auth/login-buttons"

export default function RegisterPage() {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <AuthLayout
      title="Create an Account 🚀"
      subtitle="Join our community and start sharing your moments"
    >
      <Card className="border-gray-200 text-[#6C5CE7]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl text-[#6C5CE7]">Personal Information</CardTitle>
          <CardDescription className="text-[#6C5CE7]/70">Fill in your details to create your account</CardDescription>
        </CardHeader>
        <CardContent className="pr-4">
          <form className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-[#6C5CE7]">
                  First Name
                </Label>
                <Input id="firstName" placeholder="First Name" required />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-[#6C5CE7]">
                  Last Name
                </Label>
                <Input id="lastName" placeholder="Last Name" required />
              </div>
            </div>
            <div>
              <Label htmlFor="email" className="text-[#6C5CE7]">
                Email
              </Label>
              <Input id="email" type="email" placeholder="Email" required />
            </div>
            <div>
              <Label htmlFor="password" className="text-[#6C5CE7]">
                Password
              </Label>
              <PasswordInput id="password" label="Create a strong password" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dob" className="text-[#6C5CE7]">
                  Date of Birth
                </Label>
                <Input id="dob" type="date" required />
              </div>
              <div>
                <Label htmlFor="nickname" className="text-[#6C5CE7]">
                  Nickname
                </Label>
                <Input id="nickname" placeholder="Nickname (Optional)" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
                {avatarPreview ? (
                  <img
                    src={avatarPreview || "/placeholder.svg"}
                    alt="Avatar preview"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <Upload className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <Input id="avatar" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById("avatar")?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" /> Upload Image
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="about" className="text-[#6C5CE7]">
                About
              </Label>
              <Textarea id="about" placeholder="Tell us about yourself... (Optional)" className="min-h-[80px]" />
            </div>
            <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#6C5CE7] to-[#a598ff] hover:opacity-90 transition-opacity"
          >
            Create Account
          </Button>
          </form>

          <div className="mt-6">
            <LoginButtons />
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-[#6C5CE7] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}


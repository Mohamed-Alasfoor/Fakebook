"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthLayout } from "@/components/auth/auth-layout"
import { LoginButtons } from "@/components/auth/login-buttons"
import { PasswordInput } from "@/components/auth/password"
import { useState } from "react"
import axios from "axios"
export default function LoginPage() {

    const [identifier,setIdentifier] = useState("");
    const [password,setPassword] = useState("");
    const handleLogin = async (e:any) => {
        e.preventDefault();
        try{
          const res = await axios.post('http://localhost:8080/login', { identifier, password });
          alert(res.data.message);
        }catch(err){
            alert(err);
        }
    }





  return (
    <AuthLayout title="Welcome back" subtitle="Enter your credentials to access your account" >
      <div className="space-y-6">
        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              required
              className="transition-all border-gray-200 hover:border-[#6C5CE7]/50 focus:border-[#6C5CE7] focus:ring-[#6C5CE7]/20"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <PasswordInput id="password" label="Password" value={password} setValue={setPassword} required />

          <div className="flex items-center justify-between">
            <Link href="/forgot-password" className="text-sm text-[#6C5CE7] hover:underline">
              Forgot Password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-[#6C5CE7] to-[#a598ff] hover:opacity-90 transition-opacity"
          >
            Sign in
          </Button>
        </form>

        <LoginButtons />

        <p className="text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link href="/register" className="text-[#6C5CE7] hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}


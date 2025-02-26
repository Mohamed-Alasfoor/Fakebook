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
import { useRouter } from "next/navigation"
import Alert from "@/components/ui/alert";
export default function LoginPage() {
    axios.defaults.withCredentials = true;
    const router = useRouter();
    const [identifier,setIdentifier] = useState("");
    const [password,setPassword] = useState("");
    const [alert, setAlert] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      try {
          const res = await axios.post('http://localhost:8080/login', { identifier, password });
          router.push('/');
      } catch (err) {
          if (axios.isAxiosError(err) && err.response) {
              setAlert({ type: "error", message: err.response.data });
          } else {
              setAlert({ type: "error", message: "An unexpected error occurred" });
          }
      }
  }





  return (
   <>
    {alert && (
        <Alert
          title={alert.type === "success" ? "Success" : "Error"}
          message={alert.message}
          type={alert.type}
          duration={5000}
          onClose={() => setAlert(null)}
        />
      )}
     <AuthLayout title="Welcome back" subtitle="Enter your credentials to access your account" >
      <div className="space-y-6">
        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="text"
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
   </>
  )
}


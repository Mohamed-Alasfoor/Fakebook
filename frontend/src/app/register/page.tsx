"use client";

import { useState } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordInput } from "@/components/auth/password";
import { LoginButtons } from "@/components/auth/login-buttons";
import axios from "axios";

export default function RegisterPage() {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nickname, setNickname] = useState("");
  const [about, setAbout] = useState("");

  // Handle avatar file preview
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatar(file); // Store file in state
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("first_name", firstName);
      formData.append("last_name", lastName);
      formData.append("nickname", nickname);
      formData.append("about_me", about);
      formData.append("date_of_birth", dateOfBirth);

      if (avatar) {
        formData.append("avatar", avatar); // Append actual file
      }

      const res = await axios.post("http://localhost:8080/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert(res.data.message || "Account created successfully!");
    } catch (err: any) {
      console.error(err);
      alert(
        err.response?.data?.message || "An error occurred during registration."
      );
    }
  };

  return (
    <AuthLayout
      title="Create an Account 🚀"
      subtitle="Join our community and start sharing your moments"
    >
      <Card className="border-gray-200 text-[#6C5CE7]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl text-[#6C5CE7]">
            Personal Information
          </CardTitle>
          <CardDescription className="text-[#6C5CE7]/70">
            Fill in your details to create your account
          </CardDescription>
        </CardHeader>
        <CardContent className="pr-4">
          <form className="space-y-4" onSubmit={handleRegister}>
            {/* Name fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-[#6C5CE7]">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-[#6C5CE7]">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email field */}
            <div>
              <Label htmlFor="email" className="text-[#6C5CE7]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password field */}
            <div>
              <Label htmlFor="password" className="text-[#6C5CE7]">
                Password
              </Label>
              <PasswordInput
                id="password"
                label="Create a strong password"
                value={password}
                setValue={setPassword}
                required
              />
            </div>

            {/* Date of Birth and Nickname fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dob" className="text-[#6C5CE7]">
                  Date of Birth
                </Label>
                <Input
                  id="dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="nickname" className="text-[#6C5CE7]">
                  Nickname
                </Label>
                <Input
                  id="nickname"
                  placeholder="Nickname (Optional)"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </div>
            </div>

            {/* Avatar upload */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <Upload className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
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

            {/* About field */}
            <div>
              <Label htmlFor="about" className="text-[#6C5CE7]">
                About
              </Label>
              <Textarea
                id="about"
                placeholder="Tell us about yourself... (Optional)"
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            {/* Submit button */}
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
            <Link
              href="/login"
              className="text-[#6C5CE7] hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

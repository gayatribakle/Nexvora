import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

interface AdminLoginProps {
  onLogin: (role: "admin" | "worker") => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple role detection based on email
    const role = email.includes("worker") ? "worker" : "admin";
    onLogin(role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0891B2] flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Illustration */}
        <div className="hidden md:block">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <img
              src="https://images.unsplash.com/photo-1757323148943-2ae82a19ec9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBSSUyMHN1cnZlaWxsYW5jZSUyMG1vbml0b3JpbmclMjBzeXN0ZW18ZW58MXx8fHwxNzcyNzAwNDQ2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="AI Monitoring"
              className="w-full h-auto rounded-lg shadow-2xl"
            />
            <div className="mt-6 text-center">
              <h2 className="text-white text-2xl font-bold mb-2">
                Nexvora
              </h2>
              <p className="text-cyan-200">
                Transforming Worksite Monitoring through Vision Technology
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-[#06B6D4] to-[#0891B2] rounded-xl flex items-center justify-center shadow-lg">
                <div className="w-7 h-7 bg-white rounded-lg"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#0F172A] to-[#0891B2] bg-clip-text text-transparent">Nexvora</h1>
                <p className="text-sm text-gray-500">Vision Technology</p>
              </div>
            </div>
            <h2 className="text-xl text-gray-600">Sign in to your account</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@nexvora.ai"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Use "worker@camp.com" to login as worker
              </p>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 text-[#0891B2] rounded" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-[#0891B2] hover:underline">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#0891B2] to-[#06B6D4] hover:from-[#0e7490] hover:to-[#0891B2] text-white py-6 shadow-lg hover:shadow-xl transition-all"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Protected by Nexvora Security
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
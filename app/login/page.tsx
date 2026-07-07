"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext"; 
import { useRouter } from "next/navigation";
import { Loader2, User, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // 1. Update Context
      login(data);

      // 2. Redirect User based on Role
      if (data.user.role === "admin") {
        router.push("/admin"); 
      } else {
        router.push("/dashboard"); 
      }
      
      router.refresh(); 

    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message || "Invalid username or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden selection:bg-emerald-500/30">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] translate-y-1/2 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Brand/Header */}
        <div className="text-center mb-10 space-y-2">
          <Link href="/" className="inline-block transition-transform hover:scale-105 active:scale-95">
            <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-lg">
              Optimus
            </h1>
          </Link>
          <p className="text-slate-400 font-medium tracking-wide text-sm">
            Sign in to your portal
          </p>
        </div>

        {/* Glassmorphic Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] border border-slate-800/60 p-8 md:p-10">
          
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-slate-200 placeholder-slate-600 transition-all shadow-inner"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-purple-500 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/50 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-slate-200 placeholder-slate-600 transition-all shadow-inner"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full group relative flex items-center justify-center gap-3 py-4 px-4 rounded-2xl font-bold text-white transition-all duration-300 transform active:scale-[0.98]
                ${isSubmitting 
                  ? 'bg-emerald-600/50 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)]'} 
                border border-emerald-500/20`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Secure Login</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Footer Hint */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Restricted Access 
        </div>
      </div>
    </div>
  );
}
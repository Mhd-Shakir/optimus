"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Mic2, LogOut } from "lucide-react";

export default function AnnouncerLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (user.role !== "announcer" && user.role !== "super_admin") {
      router.push("/unauthorized");
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500/30">
      {/* Top Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/announcer')}>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Mic2 className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">Optimus <span className="text-emerald-600 font-normal">Announcer</span></span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end mr-4">
                <span className="text-sm font-bold text-slate-800">{user.username}</span>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Results Presenter</span>
              </div>
              <button
                onClick={() => { logout(); router.push('/login'); }}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}

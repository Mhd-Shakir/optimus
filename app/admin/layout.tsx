"use client";

import { useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/sidebar"; // ✅ സൈഡ്‌ബാർ ഇംപോർട്ട് ചെയ്തു

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    } else if (!isLoading && user?.role !== "super_admin") {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  // ചെക്ക് ചെയ്യുന്ന സമയം ലോഡിംഗ് കാണിക്കുക
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-slate-900" />
      </div>
    );
  }

  // യൂസർ ഇല്ലെങ്കിൽ പേജ് കാണിക്കരുത്
  if (!user) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* ✅ ഇവിടെ സൈഡ്‌ബാർ ചേർത്തു */}
      <Sidebar /> 
      
      <main className="lg:pl-64">
        <div className="p-4 pt-16 lg:p-8 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}
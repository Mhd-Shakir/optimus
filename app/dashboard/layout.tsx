"use client";

import { useEffect } from "react";
import { useAuth } from "../context/AuthContext"; // Path കൃത്യമാണെന്ന് ഉറപ്പാക്കുക
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    } else if (!isLoading && user?.role === "super_admin") {
      router.push("/admin");
    }
  }, [user, isLoading, router]);

  // ചെക്ക് ചെയ്യുന്ന സമയം ലോഡിംഗ് കാണിക്കുക
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  // യൂസർ ഇല്ലെങ്കിൽ പേജ് കാണിക്കരുത്
  if (!user) return null;

  return <>{children}</>;
}
"use client";

import { useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // ചെക്കിംഗ് കഴിഞ്ഞ് യൂസർ ഇല്ലെങ്കിൽ ലോഗിനിലേക്ക് വിടുക
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // ലോഡിംഗ് സ്ക്രീൻ
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm font-bold text-slate-500">Checking Access...</p>
        </div>
      </div>
    );
  }

  // ലോഗിൻ അല്ലെങ്കിൽ ഒന്നും കാണിക്കരുത്
  if (!user) {
    return null;
  }

  // ലോഗിൻ ആണെങ്കിൽ മാത്രം കണ്ടന്റ് കാണിക്കുക
  return <>{children}</>;
}
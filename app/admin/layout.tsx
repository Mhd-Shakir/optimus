"use client";

import { useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/sidebar"; // നിങ്ങളുടെ Sidebar ഇമ്പോർട്ട്

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // ലോഡിംഗ് കഴിഞ്ഞ് യൂസർ ഇല്ലെങ്കിൽ ലോഗിൻ പേജിലേക്ക് വിടുക
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // ചെക്കിംഗ് സമയത്ത് ലോഡിംഗ് സ്ക്രീൻ കാണിക്കുക
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-slate-900" />
      </div>
    );
  }

  // യൂസർ ഇല്ലെങ്കിൽ കണ്ടന്റ് കാണിക്കരുത് (Redirect നടക്കും)
  if (!user) {
    return null; 
  }

  // ലോഗിൻ ആണെങ്കിൽ മാത്രം അഡ്മിൻ ലേഔട്ട് കാണിക്കുക
  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <main className="lg:pl-64">
        <div className="p-4 pt-16 lg:p-8 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}
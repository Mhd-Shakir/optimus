"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Calendar, ClipboardList, Mic2, UserCog, Menu, X, ArrowLeft } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

const sidebarLinks = [
  { href: "/demo-admin", label: "Admin", icon: LayoutDashboard },
  { href: "/demo-team", label: "Team", icon: Users },
  { href: "/demo-students", label: "Students", icon: Users },
  { href: "/demo-events", label: "Events", icon: Calendar },
  { href: "/demo-registration", label: "Registration", icon: ClipboardList },
  { href: "/demo-announcer", label: "Announcer", icon: Mic2 },
  { href: "/demo-judge", label: "Judge", icon: UserCog },
  { href: "/demo-stage-judge", label: "Stage Judge", icon: UserCog },
];

export function DemoSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-white/80 backdrop-blur-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200 transition-transform duration-300 flex flex-col shadow-xl md:shadow-none",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-black text-emerald-600 flex items-center gap-2">Optimus</h1>
          <div className="text-xs font-bold text-yellow-600 mt-1">DEMO MODE</div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all",
                  isActive
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-slate-500 hover:bg-slate-50",
                )}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-200">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-all"
            >
              <ArrowLeft className="h-5 w-5 text-slate-400" />
              Exit Demo
            </Link>
          </div>
      </aside>
    </>
  )
}

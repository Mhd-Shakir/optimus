"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import { 
  LayoutDashboard, ClipboardList, LogOut, Plus, Loader2, Mic, PenTool 
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function RegistrationPage() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"Stage" | "Non-Stage">("Stage");
  const [isRegOpen, setIsRegOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", team: user?.team || "", category: "Alpha" });
  const [events, setEvents] = useState([]);

  useEffect(() => {
    axios.get('/api/events').then(res => setEvents(res.data));
  }, []);

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/registration", label: "Registration", icon: ClipboardList },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 font-black text-2xl text-emerald-600 tracking-tight">Optimus</div>
        <nav className="flex-1 px-4 space-y-1">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold ${pathname === link.href ? "bg-emerald-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}>
              <link.icon className="w-5 h-5" /> {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 md:ml-64 p-6 md:p-10">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Registration</h2>
          <Dialog open={isRegOpen} onOpenChange={setIsRegOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 text-white"><Plus className="w-4 h-4 mr-2" /> New Registration</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Register New Student</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg mb-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">Name</label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Student Name" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">Team</label>
                  <Input value={user?.team} disabled className="bg-slate-100" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500">Category</label>
                  <Select value={formData.category} onValueChange={val => setFormData({...formData, category: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alpha">Alpha</SelectItem>
                      <SelectItem value="Beta">Beta</SelectItem>
                      <SelectItem value="Omega">Omega</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Event selection tabs and buttons will go here based on image_66ee68.jpg logic */}
              <Button className="w-full bg-slate-900 text-white py-6">Complete Registration</Button>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
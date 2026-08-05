"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Search, Loader2, Mic2, Eye, EyeOff, ExternalLink, KeyRound, Copy } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal"

type Announcer = {
  id: string;
  username: string; 
  role: string;
}

export default function AnnouncersPage() {
  const { toast } = useToast()
  
  // State
  const [announcers, setAnnouncers] = useState<Announcer[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Form State
  const [formData, setFormData] = useState({
    username: "", password: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [announcerToDelete, setAnnouncerToDelete] = useState<{ id: string, name: string } | null>(null);

  // View Announcer State for Reset Password
  const [viewAnnouncer, setViewAnnouncer] = useState<Announcer | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    fetchAnnouncers()
  }, [])

  const fetchAnnouncers = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/users')
      // Only keep users with announcer role
      const announcerUsers = res.data.filter((u: any) => u.role === 'announcer')
      setAnnouncers(announcerUsers)
    } catch (error) {
      console.error("Failed to fetch announcers", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post('/api/users', {
        username: formData.username,
        password: formData.password,
        role: 'announcer'
      })
      
      toast({ title: "Success", description: "Announcer created successfully!" })
      setFormData({ username: "", password: "" }); 
      setIsDialogOpen(false)
      fetchAnnouncers() 

    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.response?.data?.error || "Failed to add announcer." })
    }
  }

  const handleDelete = (id: string, announcerName: string) => {
    setAnnouncerToDelete({ id, name: announcerName });
    setDeleteModalOpen(true);
  }

  const confirmDelete = async () => {
    if (!announcerToDelete) return;
    try {
      await axios.delete(`/api/users?id=${announcerToDelete.id}`);
      toast({ title: "Deleted", description: "Announcer removed." });
      fetchAnnouncers(); 
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Delete failed." });
    } finally {
      setDeleteModalOpen(false);
      setAnnouncerToDelete(null);
    }
  }

  const handleResetPassword = async () => {
    if (!viewAnnouncer || !newPassword) return;
    setResettingPassword(true);
    try {
      await axios.patch('/api/users/reset-password', {
        id: viewAnnouncer.id,
        newPassword
      });
      toast({ title: "Success", description: "Password reset successfully!" });
      setNewPassword("");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to reset password." });
    } finally {
      setResettingPassword(false);
    }
  }

  const handleCopyLink = (path: string) => {
    if (typeof window !== "undefined") {
        const url = `${window.location.origin}${path}`;
        navigator.clipboard.writeText(url);
        toast({ title: "Copied!", description: "Link copied to clipboard." });
    }
  }

  const filteredAnnouncers = announcers.filter((announcer) => 
    announcer.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Announcers Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage announcer accounts</p>
        </div>

        <div className="flex gap-2 items-center">
            <div className="flex bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden mr-2">
                <Link href="/announcer" target="_blank" className="flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 border-r border-slate-200">
                    <ExternalLink className="h-4 w-4 mr-2" /> Announcer Portal
                </Link>
                <button 
                    onClick={() => handleCopyLink('/announcer')}
                    className="px-3 py-2 hover:bg-slate-50 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
                    title="Copy Announcer Portal Link"
                >
                    <Copy className="h-4 w-4" />
                </button>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                <Button className="bg-slate-900 text-white shadow-sm hover:bg-slate-800">
                <Plus className="h-4 w-4 mr-2" /> Add Announcer
            </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>Create Announcer Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSingleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label>Username</Label>
                    <Input 
                      placeholder="e.g. stage-1" 
                      value={formData.username} 
                      onChange={(e) => setFormData({...formData, username: e.target.value})} 
                      required 
                    />
                </div>
                <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Secure password" 
                        value={formData.password} 
                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                        required 
                        className="pr-10"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                </div>
                <Button type="submit" className="w-full">Save Announcer</Button>
            </form>
            </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">SI</TableHead> 
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="animate-spin mx-auto h-6 w-6 text-slate-400"/></TableCell></TableRow>
                ) : filteredAnnouncers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No announcers found. Add one to start!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAnnouncers.map((announcer, index) => (
                    <TableRow key={announcer.id}>
                      <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                      
                      <TableCell className="font-mono font-bold flex items-center gap-2">
                        <Mic2 className="w-4 h-4 text-slate-400" />
                        {announcer.username}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 uppercase tracking-widest">
                          {announcer.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mr-2 text-slate-600 bg-white" 
                          onClick={() => {
                            setViewAnnouncer(announcer);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <KeyRound className="w-4 h-4 mr-2" /> Reset Password
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(announcer.id, announcer.username)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      <DeleteConfirmModal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        onConfirm={confirmDelete}
        studentName={announcerToDelete?.name}
      />

      {/* VIEW ANNOUNCER DETAILS DIALOG */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Announcer Details: {viewAnnouncer?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            <div className="pt-2">
              <Label className="text-muted-foreground mb-2 block">Reset Password</Label>
              <p className="text-xs text-slate-500 mb-3">Passwords are securely encrypted and cannot be viewed. You can reset it below if needed.</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input 
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button onClick={handleResetPassword} disabled={!newPassword || resettingPassword} className="shrink-0 bg-slate-900 text-white">
                  {resettingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

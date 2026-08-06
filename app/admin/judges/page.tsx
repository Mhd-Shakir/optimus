"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Search, Loader2, UserCog, ClipboardList, Eye, EyeOff, ExternalLink, Copy } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal"
import { Badge } from "@/components/ui/badge"

type Judge = {
  id: string;
  username: string; // Personal Number
  role: string;
}

type Event = {
  _id: string;
  name: string;
  category: string;
  type?: string;
  judgeId?: string | null;
}

export default function JudgesPage() {
  const { toast } = useToast()
  
  // State
  const [judges, setJudges] = useState<Judge[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Assign Events State
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignedEvents, setAssignedEvents] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [eventSearch, setEventSearch] = useState("");
  const [eventCategoryFilter, setEventCategoryFilter] = useState("All");

  // View Judge State
  const [viewJudge, setViewJudge] = useState<Judge | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    username: "", password: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [judgeToDelete, setJudgeToDelete] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [usersRes, eventsRes] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/events')
      ]);
      const judgeUsers = usersRes.data.filter((u: any) => u.role === 'judge')
      setJudges(judgeUsers)
      setEvents(eventsRes.data)
    } catch (error) {
      console.error("Failed to fetch data", error)
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
        role: 'judge'
      })
      
      toast({ title: "Success", description: "Judge created successfully!" })
      setFormData({ username: "", password: "" }); 
      setIsDialogOpen(false)
      fetchData() 

    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: error.response?.data?.error || "Failed to add judge." })
    }
  }

  const handleDelete = (id: string, judgeName: string) => {
    setJudgeToDelete({ id, name: judgeName });
    setDeleteModalOpen(true);
  }

  const confirmDelete = async () => {
    if (!judgeToDelete) return;
    try {
      await axios.delete(`/api/users?id=${judgeToDelete.id}`);
      toast({ title: "Deleted", description: "Judge removed." });
      fetchData(); 
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Delete failed." });
    } finally {
      setDeleteModalOpen(false);
      setJudgeToDelete(null);
    }
  }

  const openAssignDialog = (judge: Judge) => {
    setSelectedJudge(judge);
    const assigned = events.filter(e => e.judgeId === judge.id).map(e => e._id);
    setAssignedEvents(assigned);
    setEventSearch("");
    setEventCategoryFilter("All");
    setIsAssignDialogOpen(true);
  }

  const handleToggleEvent = (eventId: string, checked: boolean) => {
    if (checked) {
        setAssignedEvents([...assignedEvents, eventId]);
    } else {
        setAssignedEvents(assignedEvents.filter(id => id !== eventId));
    }
  }

  const saveAssignments = async () => {
    if (!selectedJudge) return;
    setAssigning(true);
    try {
        const previouslyAssigned = events.filter(e => e.judgeId === selectedJudge.id).map(e => e._id);
        const added = assignedEvents.filter(id => !previouslyAssigned.includes(id));
        const removed = previouslyAssigned.filter(id => !assignedEvents.includes(id));

        const promises = [];
        for (const eventId of added) {
            promises.push(axios.patch('/api/events', { id: eventId, judgeId: selectedJudge.id }));
        }
        for (const eventId of removed) {
            promises.push(axios.patch('/api/events', { id: eventId, judgeId: null }));
        }
        
        await Promise.all(promises);

        toast({ title: "Success", description: "Assignments updated." });
        setIsAssignDialogOpen(false);
        fetchData(); 
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to update assignments." });
    } finally {
        setAssigning(false);
    }
  }

  const handleResetPassword = async () => {
    if (!viewJudge || !newPassword) return;
    setResettingPassword(true);
    try {
      await axios.patch('/api/users/reset-password', {
        id: viewJudge.id,
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

  const filteredJudges = judges.filter((judge) => 
    judge.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredEvents = events.filter((ev) => {
    // Only show Non-Stage events for assignment
    if (ev.type !== "Non-Stage") return false;

    const matchSearch = ev.name.toLowerCase().includes(eventSearch.toLowerCase()) || ev.category.toLowerCase().includes(eventSearch.toLowerCase());
    const matchCat = eventCategoryFilter === "All" || ev.category === eventCategoryFilter;
    return matchSearch && matchCat;
  })

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Judges Management</h1>
          <p className="text-muted-foreground mt-1">Create judges and assign events to them</p>
        </div>

        <div className="flex gap-2 items-center">
            <div className="flex bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden mr-2">
                <Link href="/judge" target="_blank" className="flex items-center px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 border-r border-slate-200">
                    <ExternalLink className="h-4 w-4 mr-2" /> Judge Portal
                </Link>
                <button 
                    onClick={() => handleCopyLink('/judge')}
                    className="px-3 py-2 hover:bg-slate-50 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
                    title="Copy Judge Portal Link"
                >
                    <Copy className="h-4 w-4" />
                </button>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                <Button className="bg-slate-900 text-white shadow-sm hover:bg-slate-800">
                <Plus className="h-4 w-4 mr-2" /> Add Judge
            </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>Create Judge Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSingleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label>Personal Number (Username)</Label>
                    <Input 
                      placeholder="e.g. J-001" 
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
                <Button type="submit" className="w-full">Save Judge</Button>
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
                placeholder="Search personal number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">SI</TableHead> 
                  <TableHead>Personal Number</TableHead>
                  <TableHead>Assigned Events</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="animate-spin mx-auto h-6 w-6 text-slate-400"/></TableCell></TableRow>
                ) : filteredJudges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No judges found. Add one to start!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJudges.map((judge, index) => {
                    const assignedCount = events.filter(e => e.judgeId === judge.id).length;
                    
                    return (
                    <TableRow key={judge.id}>
                      <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                      
                      <TableCell className="font-mono font-bold flex items-center gap-2">
                        <UserCog className="w-4 h-4 text-slate-400" />
                        {judge.username}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className="bg-blue-50 text-blue-700 border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={() => {
                            setViewJudge(judge);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          {assignedCount} Event{assignedCount !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="mr-2 text-slate-600 bg-white" onClick={() => openAssignDialog(judge)}>
                          <ClipboardList className="w-4 h-4 mr-2" /> Assign Events
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(judge.id, judge.username)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )})
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      <DeleteConfirmModal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        onConfirm={confirmDelete}
        studentName={judgeToDelete?.name}
      />

      {/* ASSIGN EVENTS DIALOG */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Events to {selectedJudge?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search events..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="w-[140px] shrink-0">
                <Select value={eventCategoryFilter} onValueChange={setEventCategoryFilter}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    <SelectItem value="Protons">Protons</SelectItem>
                    <SelectItem value="Nexus">Nexus</SelectItem>
                    <SelectItem value="Cosmos">Cosmos</SelectItem>
                    <SelectItem value="General-A">General-A</SelectItem>
                    <SelectItem value="General-B">General-B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="border rounded-md overflow-hidden bg-slate-50">
              <div className="p-2 border-b bg-slate-100 flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-widest">
                <span>Event Name</span>
                <span>Assigned</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
                {filteredEvents.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">No events found.</div>
                ) : (
                  filteredEvents.map(event => {
                    const isAssignedToThis = assignedEvents.includes(event._id);
                    const isAssignedToOther = event.judgeId && event.judgeId !== selectedJudge?.id && !isAssignedToThis;
                    
                    return (
                      <div key={event._id} className="flex items-center justify-between p-2 hover:bg-slate-100 rounded-md transition-colors group cursor-pointer" onClick={() => handleToggleEvent(event._id, !isAssignedToThis)}>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-slate-900 group-hover:text-blue-600 transition-colors">{event.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{event.category}</span>
                            {isAssignedToOther && (
                              <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">Assigned to another</span>
                            )}
                          </div>
                        </div>
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 cursor-pointer accent-blue-600"
                          checked={isAssignedToThis}
                          onChange={(e) => handleToggleEvent(event._id, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <Button onClick={saveAssignments} className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={assigning}>
              {assigning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Assignments"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* VIEW JUDGE DETAILS DIALOG */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Judge Details: {viewJudge?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            <div>
              <Label className="text-muted-foreground mb-2 block">Assigned Events</Label>
              <div className="bg-slate-50 border rounded-md p-2 max-h-[200px] overflow-y-auto">
                {viewJudge && events.filter(e => e.judgeId === viewJudge.id).length > 0 ? (
                  <ul className="space-y-1">
                    {events.filter(e => e.judgeId === viewJudge.id).map(event => (
                      <li key={event._id} className="text-sm flex justify-between items-center py-1 border-b last:border-0 border-slate-100">
                        <span className="font-medium">{event.name}</span>
                        <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded border">{event.category}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-slate-500 text-center py-4">No events assigned.</div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
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

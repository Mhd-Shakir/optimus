"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Trash2, UserPlus, Loader2, Mic, PenTool } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// --- TYPES ---
type Student = {
  _id: string
  name: string
  team: "Auris" | "Libras"
  category: string
  registeredEvents: { eventId: string, isStar: boolean, name?: string }[]
}

type Event = {
  _id: string
  name: string
  type: "Stage" | "Non-Stage"
  category: string
}

export default function AdminRegistrationsPage() {
  const { toast } = useToast()

  const [students, setStudents] = useState<Student[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTeam, setFilterTeam] = useState<string>("All")

  // Registration Form State
  const [isRegOpen, setIsRegOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<"Stage" | "Non-Stage">("Stage") // Toggle for Events View
  const [formData, setFormData] = useState({
    name: "", team: "Auris", category: "Alpha"
  })
  const [selectedEvents, setSelectedEvents] = useState<{eventId: string, eventName: string, isStar: boolean, type: string}[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [studentsRes, eventsRes] = await Promise.all([
        axios.get('/api/student/list').catch(() => axios.get('/api/students/list')), 
        axios.get('/api/events')
      ])
      setStudents(studentsRes?.data || [])
      setEvents(eventsRes?.data || [])
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not load data." })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure?")) return;
    try {
      await axios.post('/api/student/delete', { id })
      toast({ title: "Deleted", description: "Student removed." })
      fetchData()
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Delete failed." })
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault() 
    if(!formData.name) return toast({ variant: "destructive", title: "Wait!", description: "Name is required." })

    setSubmitting(true)
    try {
      const res = await axios.post("/api/student/register", { ...formData, selectedEvents })
      if(res.status === 201) {
          toast({ title: "Success ✅", description: "Registration complete!" })
          setIsRegOpen(false)
          setFormData({ name: "", team: "Auris", category: "Alpha" })
          setSelectedEvents([])
          fetchData()
      }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed", description: error.response?.data?.error || "Error" })
    } finally {
      setSubmitting(false)
    }
  }

  const toggleEvent = (event: Event) => {
    const exists = selectedEvents.find(e => e.eventId === event._id)
    if (exists) {
        setSelectedEvents(prev => prev.filter(e => e.eventId !== event._id))
    } else {
        setSelectedEvents(prev => [...prev, { eventId: event._id, eventName: event.name, isStar: false, type: event.type }])
    }
  }

  const toggleStar = (eventId: string) => {
    const currentStars = selectedEvents.filter(e => e.isStar).length
    const target = selectedEvents.find(e => e.eventId === eventId)
    if (!target?.isStar && currentStars >= 8) {
       toast({ variant: "destructive", title: "Limit Reached", description: "Max 8 star items allowed!" })
       return
    }
    setSelectedEvents(prev => prev.map(e => e.eventId === eventId ? { ...e, isStar: !e.isStar } : e))
  }

  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchTeam = filterTeam === "All" || s.team === filterTeam
    return matchSearch && matchTeam
  })

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Registrations</h1>
            <p className="text-slate-500">Total Students: {students.length}</p>
        </div>
        
        <Dialog open={isRegOpen} onOpenChange={setIsRegOpen}>
            <DialogTrigger asChild>
                <Button className="bg-slate-900 text-white hover:bg-slate-800">
                    <UserPlus className="w-4 h-4 mr-2" /> New Registration
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Register New Student</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleRegister} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500">Name</label>
                            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Student Name" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500">Team</label>
                            <Select value={formData.team} onValueChange={val => setFormData({...formData, team: val as any})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Auris">Auris (Yellow)</SelectItem>
                                    <SelectItem value="Libras">Libras (Blue)</SelectItem>
                                </SelectContent>
                            </Select>
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

                    {/* EVENT SELECTION TABS */}
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Button 
                                type="button" 
                                variant={activeTab === "Stage" ? "default" : "outline"} 
                                className={`flex-1 ${activeTab === "Stage" ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                                onClick={() => setActiveTab("Stage")}
                            >
                                <Mic className="w-4 h-4 mr-2" /> Stage Items
                            </Button>
                            <Button 
                                type="button" 
                                variant={activeTab === "Non-Stage" ? "default" : "outline"} 
                                className={`flex-1 ${activeTab === "Non-Stage" ? "bg-teal-600 hover:bg-teal-700" : ""}`}
                                onClick={() => setActiveTab("Non-Stage")}
                            >
                                <PenTool className="w-4 h-4 mr-2" /> Non-Stage Items
                            </Button>
                        </div>

                        <div className="border rounded-lg p-4 bg-white">
                            <h3 className={`font-bold mb-3 ${activeTab === "Stage" ? "text-purple-700" : "text-teal-700"}`}>
                                {activeTab} Items Selected: {selectedEvents.filter(e => e.type === activeTab).length}
                            </h3>
                            
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {events.filter(e => e.type === activeTab).map(ev => {
                                    const isSel = selectedEvents.find(s => s.eventId === ev._id)
                                    return (
                                        <div key={ev._id} className={`p-3 border rounded-lg transition-all ${isSel ? (activeTab === "Stage" ? "bg-purple-50 border-purple-500" : "bg-teal-50 border-teal-500") : "hover:bg-slate-50"}`}>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium">{ev.name}</span>
                                                <Button type="button" size="sm" variant={isSel ? "destructive" : "secondary"} className="h-7 px-4" onClick={() => toggleEvent(ev)}>
                                                    {isSel ? "Remove" : "Select"}
                                                </Button>
                                            </div>
                                            {isSel && activeTab === "Non-Stage" && (
                                                <button type="button" onClick={() => toggleStar(ev._id)} className={`w-full mt-2 text-xs py-1.5 rounded border transition-all ${isSel.isStar ? 'bg-yellow-400 text-yellow-900 font-bold border-yellow-500' : 'bg-white hover:bg-slate-100'}`}>
                                                    {isSel.isStar ? "★ Star Marked" : "☆ Mark as Star"}
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <Button type="submit" disabled={submitting} className="w-full bg-slate-900 text-white h-12 text-lg">
                        {submitting ? <Loader2 className="animate-spin mr-2" /> : "Complete Registration"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
      </div>

      {/* STATS & FILTER */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Auris Team</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-yellow-600">{students.filter(s => s.team === "Auris").length}</div></CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Libras Team</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-blue-600">{students.filter(s => s.team === "Libras").length}</div></CardContent>
        </Card>
        <div className="md:col-span-2 flex flex-col md:flex-row gap-4 md:items-end">
             <div className="w-full relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search Student Name..." className="pl-9 bg-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
             <Select value={filterTeam} onValueChange={setFilterTeam}>
                <SelectTrigger className="w-full md:w-40 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Teams</SelectItem>
                    <SelectItem value="Auris">Auris</SelectItem>
                    <SelectItem value="Libras">Libras</SelectItem>
                </SelectContent>
             </Select>
        </div>
      </div>

      {/* STUDENTS TABLE */}
      <Card>
        <Table>
            <TableHeader>
                <TableRow>
                    {/* ADDED: Serial Number Header */}
                    <TableHead className="w-[50px]">SI</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                     <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                ) : filteredStudents.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">No students registered yet.</TableCell></TableRow>
                ) : (
                    // ADDED: index to map
                    filteredStudents.map((student, index) => (
                        <TableRow key={student._id}>
                            {/* ADDED: Serial Number Cell */}
                            <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                            
                            <TableCell className="font-bold">{student.name}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={student.team === "Auris" ? "text-yellow-600 border-yellow-200 bg-yellow-50" : "text-blue-600 border-blue-200 bg-blue-50"}>
                                    {student.team}
                                </Badge>
                            </TableCell>
                            <TableCell><Badge variant="secondary">{student.category}</Badge></TableCell>
                            <TableCell className="text-slate-500">
                                <div className="flex items-center gap-2">
                                    <span>{(student.registeredEvents?.length || 0)} Items</span>
                                    {student.registeredEvents?.some((e: any) => e.isStar) && (
                                        <span className="text-[10px] text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-200 font-bold">
                                            {student.registeredEvents.filter((e:any) => e.isStar).length} ★
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(student._id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
      </Card>
    </div>
  )
}
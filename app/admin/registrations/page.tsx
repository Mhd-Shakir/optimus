"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Trash2, UserPlus, Loader2, Mic, PenTool, Pencil, X, Eye, Star, Users, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminRegistrationsPage() {
  const { toast } = useToast()

  const [students, setStudents] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTeam, setFilterTeam] = useState<string>("All")

  const [isRegOpen, setIsRegOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editId, setEditId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [viewStudent, setViewStudent] = useState<any | null>(null)

  const [activeTab, setActiveTab] = useState<"Stage" | "Non-Stage">("Stage")
  
  const [formData, setFormData] = useState({
    name: "", 
    chestNo: "", 
    team: "Auris", 
    category: "Alpha"
  })
  
  const [selectedEvents, setSelectedEvents] = useState<{eventId: string, eventName: string, isStar: boolean, type: string, category: string, groupEvent: boolean, teamLimit?: number}[]>([])

  useEffect(() => { fetchData() }, [])

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

  const handleEditClick = (student: any) => {
    setEditId(student._id)
    setFormData({
        name: student.name,
        chestNo: student.chestNo || "", 
        team: student.team, 
        category: student.category
    })
    
    const mappedEvents = student.registeredEvents.map((e:any) => {
        const originalEvent = events.find(ev => ev._id === e.eventId)
        return {
            eventId: e.eventId,
            eventName: e.name || originalEvent?.name,
            isStar: e.isStar,
            type: originalEvent?.type || "Stage",
            category: originalEvent?.category || "",
            groupEvent: originalEvent?.groupEvent || false,
            teamLimit: originalEvent?.teamLimit
        }
    })
    setSelectedEvents(mappedEvents)
    setIsEditMode(true)
    setIsRegOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() 
    if(!formData.name || !formData.chestNo) return toast({ variant: "destructive", title: "Wait!", description: "Name and Chest No are required." })

    setSubmitting(true)
    try {
      if (isEditMode) {
         await axios.post("/api/student/update", { id: editId, ...formData, selectedEvents })
         toast({ title: "Updated ✅", description: "Student details updated!" })
      } else {
         await axios.post("/api/student/register", { ...formData, selectedEvents })
         toast({ title: "Success ✅", description: "Registration complete!" })
      }
      closeModal()
      fetchData()
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed", description: error.response?.data?.error || "Error" })
    } finally {
      setSubmitting(false)
    }
  }

  const closeModal = () => {
      setIsRegOpen(false)
      setIsEditMode(false)
      setEditId("")
      setFormData({ name: "", chestNo: "", team: "Auris", category: "Alpha" })
      setSelectedEvents([])
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

  // ✅ UPDATED TOGGLE LOGIC: 3 Participants Limit + 6 Events Limit
  const toggleEvent = (event: any) => {
    const exists = selectedEvents.find(e => e.eventId === event._id)
    if (exists) {
        setSelectedEvents(prev => prev.filter(e => e.eventId !== event._id))
    } else {
        const isGeneral = event.category.toLowerCase().includes("general");
        const isStage = event.type === "Stage";
        const isGroup = event.groupEvent === true;

        // 1️⃣ RULE: Max 3 participants per Team
        // Checks if 'teamLimit' exists in JSON OR if it's a standard Stage Individual item
        if (event.teamLimit || (isStage && !isGroup)) {
            // Count how many existing students in this team are registered for this event
            const teamRegistrations = students.filter(s => 
                s.team === formData.team && // Check Team (Auris/Libras)
                s._id !== editId && // Exclude current student if editing
                s.registeredEvents?.some((re: any) => re.eventId === event._id)
            ).length;

            const limit = event.teamLimit || 3; // Use specific limit or default 3 for stage

            if (teamRegistrations >= limit) {
                return toast({ 
                    variant: "destructive", 
                    title: "Team Limit Reached", 
                    description: `Team ${formData.team} already has ${limit} participants for ${event.name}.` 
                });
            }
        }

        // 2️⃣ RULE: Limit applies ONLY to (Stage + Individual + Not General) - Max 6 Events
        if (isStage && !isGroup && !isGeneral) {
             const currentCount = selectedEvents.filter(e => 
                 e.type === "Stage" && 
                 !e.groupEvent && 
                 !e.category.toLowerCase().includes("general")
             ).length;
             
             if (currentCount >= 6) {
                 return toast({ variant: "destructive", title: "Limit Reached", description: "Maximum 6 Individual Stage events allowed!" })
             }
        }

        setSelectedEvents(prev => [...prev, { 
            eventId: event._id, 
            eventName: event.name, 
            isStar: false, 
            type: event.type,
            category: event.category,
            groupEvent: event.groupEvent || false,
            teamLimit: event.teamLimit
        }])
    }
  }

  const toggleStar = (eventId: string) => {
    const currentStars = selectedEvents.filter(e => e.isStar).length
    const target = selectedEvents.find(e => e.eventId === eventId)
    
    if (target?.category && target.category.toLowerCase().includes("general")) return; 

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

  const filteredEvents = events.filter(e => {
    if (e.type !== activeTab) return false;
    if (e.category === formData.category) return true;
    if (formData.category === "Alpha" && e.category === "General-A") return true;
    if ((formData.category === "Beta" || formData.category === "Omega") && e.category === "General-B") return true;
    return false;
  });

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Registrations</h1>
            <p className="text-slate-500">Total Students: {students.length}</p>
        </div>
        <Button onClick={() => { setIsEditMode(false); setIsRegOpen(true); }} className="bg-slate-900 text-white hover:bg-slate-800">
            <UserPlus className="w-4 h-4 mr-2" /> New Registration
        </Button>

        <Dialog open={isRegOpen} onOpenChange={closeModal}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{isEditMode ? "Edit Student Details" : "Register New Student"}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500">Name</label>
                            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Student Name" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500">Chest No</label>
                            <Input value={formData.chestNo} onChange={e => setFormData({...formData, chestNo: e.target.value})} required placeholder="e.g. 101" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500">Team</label>
                            <Select disabled={isEditMode} value={formData.team} onValueChange={val => setFormData({...formData, team: val})}>
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

                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Button type="button" variant={activeTab === "Stage" ? "default" : "outline"} className={`flex-1 ${activeTab === "Stage" ? "bg-purple-600 hover:bg-purple-700" : ""}`} onClick={() => setActiveTab("Stage")}><Mic className="w-4 h-4 mr-2" /> Stage</Button>
                            <Button type="button" variant={activeTab === "Non-Stage" ? "default" : "outline"} className={`flex-1 ${activeTab === "Non-Stage" ? "bg-teal-600 hover:bg-teal-700" : ""}`} onClick={() => setActiveTab("Non-Stage")}><PenTool className="w-4 h-4 mr-2" /> Non-Stage</Button>
                        </div>
                        
                        <div className="border rounded-lg p-4 bg-white">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className={`font-bold ${activeTab === "Stage" ? "text-purple-700" : "text-teal-700"}`}>
                                    {activeTab} Events
                                </h3>
                                <span className="text-xs text-slate-400">Selected: {selectedEvents.filter(e => e.type === activeTab).length}</span>
                            </div>
                            
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {filteredEvents.length > 0 ? (
                                    filteredEvents.map(ev => {
                                        const isSel = selectedEvents.find(s => s.eventId === ev._id)
                                        const isGeneral = ev.category.toLowerCase().includes("general")
                                        const isGroup = ev.groupEvent === true

                                        return (
                                            <div key={ev._id} className={`p-3 border rounded-lg transition-all ${isSel ? (activeTab === "Stage" ? "bg-purple-50 border-purple-500" : "bg-teal-50 border-teal-500") : "hover:bg-slate-50"}`}>
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium">{ev.name}</span>
                                                            {isGeneral && <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-slate-800 text-white hover:bg-slate-700">General</Badge>}
                                                            {isGroup ? (
                                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-yellow-300 bg-yellow-50 text-yellow-700 gap-1"><Users className="w-3 h-3" /> Group</Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-slate-400 border-slate-200 font-normal"><User className="w-3 h-3 mr-1" /> Single</Badge>
                                                            )}
                                                            {/* Show Limit Badge if exists */}
                                                            {(ev.teamLimit || (!isGroup && ev.type === 'Stage')) && (
                                                              <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 font-bold">Limit: {ev.teamLimit || 3}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button type="button" size="sm" variant={isSel ? "destructive" : "secondary"} className="h-7 px-4" onClick={() => toggleEvent(ev)}>{isSel ? "Remove" : "Select"}</Button>
                                                </div>
                                                
                                                {isSel && activeTab === "Non-Stage" && !isGeneral && (
                                                    <button type="button" onClick={() => toggleStar(ev._id)} className={`w-full mt-2 text-xs py-1.5 rounded border transition-all ${isSel.isStar ? 'bg-yellow-400 text-yellow-900 font-bold border-yellow-500' : 'bg-white hover:bg-slate-100'}`}>{isSel.isStar ? "★ Star Marked" : "☆ Mark as Star"}</button>
                                                )}
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="text-center py-6 text-slate-400 text-sm">
                                        No events found for {formData.category}.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <Button type="submit" disabled={submitting} className="w-full bg-slate-900 text-white h-12 text-lg">
                        {submitting ? <Loader2 className="animate-spin mr-2" /> : (isEditMode ? "Update Student" : "Complete Registration")}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Auris Team</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{students.filter(s => s.team === "Auris").length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-slate-500">Libras Team</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{students.filter(s => s.team === "Libras").length}</div></CardContent></Card>
        <div className="md:col-span-2 flex flex-col md:flex-row gap-4 md:items-end">
             <div className="w-full relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search Student Name..." className="pl-9 bg-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
             <Select value={filterTeam} onValueChange={setFilterTeam}>
                <SelectTrigger className="w-full md:w-40 bg-white"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="All">All Teams</SelectItem><SelectItem value="Auris">Auris</SelectItem><SelectItem value="Libras">Libras</SelectItem></SelectContent>
             </Select>
        </div>
      </div>
      <Card>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]">SI</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Chest No</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> : filteredStudents.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">No students registered.</TableCell></TableRow> : filteredStudents.map((student, index) => (
                        <TableRow key={student._id}>
                            <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                            <TableCell className="font-bold">{student.name}</TableCell>
                            <TableCell className="font-mono text-slate-500">{student.chestNo}</TableCell>
                            <TableCell><Badge variant="outline" className={student.team === "Auris" ? "text-yellow-600 border-yellow-200 bg-yellow-50" : "text-blue-600 border-blue-200 bg-blue-50"}>{student.team}</Badge></TableCell>
                            <TableCell><Badge variant="secondary">{student.category}</Badge></TableCell>
                            <TableCell className="text-slate-500">{(student.registeredEvents?.length || 0)} Items</TableCell>
                            <TableCell className="text-right">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" onClick={() => setViewStudent(student)}>
                                    <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleEditClick(student)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(student._id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
            </TableBody>
        </Table>
      </Card>
      {viewStudent && (
          <Dialog open={!!viewStudent} onOpenChange={(open) => !open && setViewStudent(null)}>
            <DialogContent className="max-w-md w-full p-0 border-none rounded-xl overflow-hidden bg-white" aria-describedby={undefined}>
               <div className="bg-slate-800 px-5 py-4 flex justify-between items-start text-white">
                <div>
                  <DialogTitle className="text-xl font-bold text-white">{viewStudent.name}</DialogTitle>
                  <div className="flex gap-2 mt-1">
                    <Badge className="bg-slate-700 hover:bg-slate-600 text-[10px] uppercase tracking-wider">{viewStudent.category}</Badge>
                    <Badge variant="outline" className="text-slate-300 border-slate-600 text-[10px]">Chest No: {viewStudent.chestNo || "N/A"}</Badge>
                  </div>
                </div>
                <button onClick={() => setViewStudent(null)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 max-h-[60vh] overflow-y-auto">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Registered Events</h4>
                 {viewStudent.registeredEvents && viewStudent.registeredEvents.length > 0 ? (
                  <div className="space-y-2">
                    {viewStudent.registeredEvents.map((ev: any, idx: number) => {
                      const fullEvent = events.find(e => e._id === ev.eventId) || {};
                      const isGeneral = fullEvent.category?.toLowerCase().includes("general");
                      const isGroup = fullEvent.groupEvent === true

                      return (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                            <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${fullEvent.type === 'Stage' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                {fullEvent.type === 'Stage' ? <Mic className="w-3.5 h-3.5" /> : <PenTool className="w-3.5 h-3.5" />}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-700">
                                    {ev.name || fullEvent.name}
                                    {isGeneral && <span className="ml-2 text-[8px] bg-slate-800 text-white px-1 py-0.5 rounded">GENERAL</span>}
                                    {isGroup && <span className="ml-2 text-[8px] bg-yellow-100 text-yellow-800 border border-yellow-200 px-1 py-0.5 rounded font-bold uppercase">GROUP</span>}
                                </p>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">{fullEvent.type || "Unknown"}</p>
                            </div>
                            </div>
                            {ev.isStar && (
                            <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-[10px] font-bold border border-yellow-200 flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" /> Star
                            </div>
                            )}
                        </div>
                      )
                    })}
                  </div>
                 ) : (
                    <div className="text-center py-6 text-slate-400">No events found.</div>
                 )}
              </div>
            </DialogContent>
          </Dialog>
        )}
    </div>
  )
}
"use client"

import { useState, useEffect, useMemo } from "react"
import axios from "axios"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, Users, Eye, Calendar, RefreshCcw, Trash2, AlertTriangle, Code, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

// Types
type Student = {
  _id: string
  name: string
  chestNo: string
  team: string
  category: string
  registeredEvents: { eventId: string, name: string }[]
}

type Event = {
  _id: string
  name: string
  category: string
  type: "Stage" | "Non-Stage"
  status?: string
  groupEvent?: boolean 
}

const categories = ["Alpha", "Beta", "Omega", "General-A", "General-B"]

export default function EventsPage() {
  const { toast } = useToast()
  
  // Data State
  const [events, setEvents] = useState<Event[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // UI State
  const [activeTypeTab, setActiveTypeTab] = useState<"Stage" | "Non-Stage">("Stage")
  const [filterCategory, setFilterCategory] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
  const [bulkJsonData, setBulkJsonData] = useState("")

  // View Participants Dialog
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  
  // View Student Details Dialog
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isStudentViewOpen, setIsStudentViewOpen] = useState(false)

  // Form Data
  const [formData, setFormData] = useState({
    name: "", category: "Alpha", type: "Stage", groupEvent: false
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      
      const [eventsRes, studentsRes] = await Promise.all([
        axios.get('/api/events'),
        axios.get('/api/student/list')
      ])
      setEvents(eventsRes.data)
      setStudents(studentsRes.data)
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load data" })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const participantsMap = useMemo(() => {
    const map: Record<string, Student[]> = {}
    events.forEach(ev => { map[ev._id] = [] })
    students.forEach(student => {
        student.registeredEvents?.forEach(reg => {
            if (map[reg.eventId]) {
                map[reg.eventId].push(student)
            }
        })
    })
    return map
  }, [events, students])

  // 🔥 NEW: CATEGORY WISE STUDENT REPORT PDF
  const downloadStudentReportPDF = () => {
    const doc = new jsPDF();
    
    // Filter students based on currently selected category
    const reportStudents = filterCategory === "All" 
        ? students 
        : students.filter(s => s.category === filterCategory);

    // Sort by Chest No
    reportStudents.sort((a, b) => a.chestNo.localeCompare(b.chestNo));

    doc.setFontSize(18);
    doc.text(`Student Events Report - ${filterCategory}`, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} | Total Students: ${reportStudents.length}`, 14, 26);

    const tableBody = reportStudents.map((s) => [
        s.chestNo,
        s.name,
        s.team,
        s.category,
        s.registeredEvents.map(e => e.name).join(", ") // List all events
    ]);

    autoTable(doc, {
        startY: 35,
        head: [["Chest No", "Name", "Team", "Category", "Registered Events"]],
        body: tableBody,
        theme: "grid",
        headStyles: { fillColor: [15, 23, 42] }, // Slate-900
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
            4: { cellWidth: 80 } // Make events column wider
        }
    });

    doc.save(`Student_Report_${filterCategory}.pdf`);
    toast({ title: "Downloaded", description: `Report for ${filterCategory} generated.` });
  }

  // Add Event
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post('/api/events/bulk', [formData]) 
      toast({ title: "Success", description: "Event added successfully!" })
      setFormData({ name: "", category: "Alpha", type: "Stage", groupEvent: false })
      setIsAddDialogOpen(false)
      fetchData(true) 
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add event" })
    }
  }

  // Bulk Submit
  const handleBulkSubmit = async () => {
    try {
        if (!bulkJsonData.trim()) return
        const parsedData = JSON.parse(bulkJsonData)
        if (!Array.isArray(parsedData)) throw new Error("Invalid Format")

        setRefreshing(true)
        await axios.post('/api/events/bulk', parsedData)
        
        toast({ title: "Success", description: `Added ${parsedData.length} events!` })
        setBulkJsonData("")
        setIsBulkDialogOpen(false)
        fetchData(true)
    } catch (error: any) {
        toast({ variant: "destructive", title: "Invalid JSON", description: error.message })
        setRefreshing(false)
    }
  }

  // Delete Handlers
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm("Are you sure?")) return
    try {
        await axios.delete(`/api/events?id=${id}`)
        toast({ title: "Deleted", description: "Event deleted successfully" })
        fetchData(true)
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete" })
    }
  }

  const handleDeleteAll = async () => {
    try {
        await axios.delete('/api/events/reset') 
        toast({ title: "Reset Complete", description: "All events deleted." })
        fetchData(true)
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to reset events" })
    }
  }

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setIsViewOpen(true)
  }

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student)
    setIsStudentViewOpen(true)
  }

  const filteredEvents = events.filter((ev) => {
    const matchesType = ev.type === activeTypeTab
    const matchesCategory = filterCategory === "All" || ev.category === filterCategory
    const matchesSearch = ev.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Events Management</h1>
            <p className="text-slate-500 text-sm">Manage stage and non-stage items</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
            <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100">
                        <Code className="w-4 h-4 mr-2" /> Bulk JSON
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Import Events (JSON)</DialogTitle>
                        <DialogDescription>Paste your JSON array below.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <textarea 
                                className="w-full h-48 p-3 font-mono text-xs border rounded-md focus:outline-none bg-slate-50 resize-y"
                                placeholder='[{"name": "Essay", "category": "Beta", "type": "Non-Stage"}]'
                                value={bulkJsonData}
                                onChange={(e) => setBulkJsonData(e.target.value)}
                            ></textarea>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleBulkSubmit} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">Import Data</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete All
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600">Delete All Events?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete <b>ALL EVENTS</b>. Cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAll} className="bg-red-600 hover:bg-red-700">Yes, Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Button variant="outline" size="icon" onClick={() => fetchData(true)} disabled={refreshing}>
                <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
                <Button className="bg-slate-900 text-white hover:bg-slate-800">+ Add Event</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Add New Event</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Event Name</label>
                    <Input placeholder="e.g. Mappilapattu" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Type</label>
                        <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v as any})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Stage">Stage</SelectItem>
                                <SelectItem value="Non-Stage">Non-Stage</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Category</label>
                        <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex items-center gap-2 border p-3 rounded-md bg-slate-50">
                    <input type="checkbox" id="isGroup" className="w-4 h-4" checked={formData.groupEvent} onChange={e => setFormData({...formData, groupEvent: e.target.checked})} />
                    <label htmlFor="isGroup" className="text-sm font-medium">Is Group Event?</label>
                </div>
                <Button type="submit" className="w-full">Save Event</Button>
                </form>
            </DialogContent>
            </Dialog>
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-col gap-4 bg-slate-50/50 p-1 rounded-xl">
        <div className="flex p-1 bg-white rounded-lg border w-fit shadow-sm self-start">
            <button onClick={() => setActiveTypeTab("Stage")} className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${activeTypeTab === "Stage" ? "bg-purple-100 text-purple-700 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}>🎤 Stage Events</button>
            <button onClick={() => setActiveTypeTab("Non-Stage")} className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${activeTypeTab === "Non-Stage" ? "bg-teal-100 text-teal-700 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}>✍️ Non-Stage Items</button>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex gap-2 overflow-x-auto pb-2 w-full sm:w-auto no-scrollbar">
                <Button variant={filterCategory === "All" ? "default" : "outline"} onClick={() => setFilterCategory("All")} size="sm" className="rounded-full">All</Button>
                {categories.map(c => (
                    <Button key={c} variant={filterCategory === c ? "default" : "outline"} onClick={() => setFilterCategory(c)} size="sm" className="rounded-full">{c}</Button>
                ))}
            </div>
            
            {/* 🔥 SEARCH & PDF BUTTON AREA */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search events..." className="pl-9 bg-white" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                {/* PDF BUTTON FOR ADMIN */}
                <Button onClick={downloadStudentReportPDF} variant="outline" size="icon" className="bg-white border-slate-300 hover:bg-slate-100" title="Download Student List PDF">
                    <Download className="w-4 h-4 text-slate-700" />
                </Button>
            </div>
        </div>
      </div>

      {/* EVENTS GRID */}
      {loading ? (
        <div className="py-20 text-center"><Loader2 className="animate-spin h-10 w-10 mx-auto text-slate-400" /></div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 text-slate-500 bg-white rounded-xl border border-dashed"><p>No events found.</p></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredEvents.map((event) => {
                const participants = participantsMap[event._id] || []
                return (
                    <Card key={event._id} className="hover:shadow-md transition-all cursor-pointer group border-slate-200 relative overflow-hidden" onClick={() => handleEventClick(event)}>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start gap-2">
                                <CardTitle className="text-base font-bold group-hover:text-blue-600 transition-colors line-clamp-1 pr-6" title={event.name}>{event.name}</CardTitle>
                                <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={(e) => handleDelete(e, event._id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                                <Badge variant="outline" className="text-[10px] shrink-0">{event.category}</Badge>
                                {event.groupEvent && <Badge variant="secondary" className="text-[9px] bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Group</Badge>}
                            </div>
                        </CardHeader>
                        <CardFooter className="pt-3 text-xs text-slate-500 border-t bg-slate-50/50 rounded-b-xl flex justify-between items-center">
                            <div className="flex items-center gap-1.5 font-medium"><Users className="w-3.5 h-3.5" /> {participants.length} Participants</div>
                            <span className="text-blue-600 font-medium text-[10px] opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">View</span>
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
      )}

      {/* VIEW DIALOG (REMOVED OLD PDF BUTTON) */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b mb-2">
                <div>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        {selectedEvent?.name} <Badge variant="secondary">{selectedEvent?.category}</Badge>
                    </DialogTitle>
                    <p className="text-sm text-slate-500 mt-1">
                        Total Registrations: {selectedEvent ? (participantsMap[selectedEvent._id]?.length || 0) : 0}
                    </p>
                </div>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-2">
                    {selectedEvent && (!participantsMap[selectedEvent._id] || participantsMap[selectedEvent._id].length === 0) ? (
                        <div className="text-center py-12 text-slate-500 border border-dashed rounded-lg bg-slate-50">No students registered yet.</div>
                    ) : (
                        selectedEvent && participantsMap[selectedEvent._id]?.map((student) => (
                            <div key={student._id} onClick={() => handleStudentClick(student)} className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-slate-50 cursor-pointer transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${student.team === 'Auris' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{student.chestNo}</div>
                                    <div><p className="font-semibold text-sm text-slate-900">{student.name}</p><p className="text-xs text-slate-500">{student.team} • {student.category}</p></div>
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400"><Eye className="w-4 h-4" /></Button>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* STUDENT DETAILS DIALOG */}
      <Dialog open={isStudentViewOpen} onOpenChange={setIsStudentViewOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Student Details</DialogTitle></DialogHeader>
            {selectedStudent && (
                <div className="space-y-6">
                    <div className="flex flex-col items-center p-6 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-xl font-bold border shadow-sm mb-3">{selectedStudent.chestNo}</div>
                        <h2 className="text-xl font-bold text-slate-900">{selectedStudent.name}</h2>
                        <div className="flex gap-2 mt-2"><Badge variant="secondary">{selectedStudent.team}</Badge><Badge variant="secondary">{selectedStudent.category}</Badge></div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-3">Registered Events ({selectedStudent.registeredEvents?.length || 0})</h4>
                        <ScrollArea className="h-[200px] border rounded-md p-2">
                            {selectedStudent.registeredEvents?.map((ev, i) => (
                                <div key={i} className="p-2 border-b last:border-0 text-sm font-medium text-slate-700">{ev.name}</div>
                            ))}
                        </ScrollArea>
                    </div>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
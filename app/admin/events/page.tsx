"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, Users, Eye, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

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
}

const categories = ["Alpha", "Beta", "Omega", "General-A", "General-B"]

export default function EventsPage() {
  const { toast } = useToast()
  
  // Data State
  const [events, setEvents] = useState<Event[]>([])
  const [students, setStudents] = useState<Student[]>([]) // Need students to find participants
  const [loading, setLoading] = useState(true)
  
  // UI State
  const [activeTypeTab, setActiveTypeTab] = useState<"Stage" | "Non-Stage">("Stage")
  const [filterCategory, setFilterCategory] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  
  // View Participants Dialog
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  
  // View Student Details Dialog
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isStudentViewOpen, setIsStudentViewOpen] = useState(false)

  // Form Data
  const [formData, setFormData] = useState({
    name: "", category: "Alpha", type: "Stage",
  })

  // 1. Fetch Data (Events + Students)
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [eventsRes, studentsRes] = await Promise.all([
        axios.get('/api/events'),
        axios.get('/api/student/list')
      ])
      setEvents(eventsRes.data)
      setStudents(studentsRes.data)
    } catch (error) {
      console.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  // 2. Add Event
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post('/api/events/bulk', [formData])
      toast({ title: "Success", description: "Event added!" })
      setFormData({ name: "", category: "Alpha", type: "Stage" })
      setIsAddDialogOpen(false)
      fetchData()
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add event" })
    }
  }

  // Helper: Get Participants for an Event
  const getParticipants = (eventId: string) => {
    return students.filter(s => s.registeredEvents?.some((e: any) => e.eventId === eventId))
  }

  // Open Event Details
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setIsViewOpen(true)
  }

  // Open Student Details (Nested)
  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student)
    setIsStudentViewOpen(true) // Open second dialog
  }

  // Filter Logic
  const filteredEvents = events.filter((ev) => {
    const matchesType = ev.type === activeTypeTab
    const matchesCategory = filterCategory === "All" || ev.category === filterCategory
    const matchesSearch = ev.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Events Management</h1>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 text-white">+ Add Event</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Event</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label>Event Name</label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label>Type</label>
                    <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Stage">Stage</SelectItem>
                            <SelectItem value="Non-Stage">Non-Stage</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <label>Category</label>
                    <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* TABS */}
      <div className="flex p-1 bg-white rounded-lg border w-fit shadow-sm">
        <button onClick={() => setActiveTypeTab("Stage")} className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${activeTypeTab === "Stage" ? "bg-purple-100 text-purple-700 shadow-sm" : "text-slate-500"}`}>
            🎤 Stage Events
        </button>
        <button onClick={() => setActiveTypeTab("Non-Stage")} className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${activeTypeTab === "Non-Stage" ? "bg-teal-100 text-teal-700 shadow-sm" : "text-slate-500"}`}>
            ✍️ Non-Stage Items
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
            <Button variant={filterCategory === "All" ? "default" : "outline"} onClick={() => setFilterCategory("All")} size="sm">All</Button>
            {categories.map(c => (
                <Button key={c} variant={filterCategory === c ? "default" : "outline"} onClick={() => setFilterCategory(c)} size="sm">{c}</Button>
            ))}
        </div>
        <div className="relative flex-1 max-w-sm ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search..." className="pl-9 bg-white" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {/* EVENTS GRID */}
      {loading ? (
        <div className="py-10 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-slate-400" /></div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 text-slate-500 bg-white rounded-xl border border-dashed">
            No {activeTypeTab} events found in {filterCategory}.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredEvents.map((event) => {
                const participantCount = getParticipants(event._id).length
                return (
                    <Card key={event._id} className="hover:shadow-md transition-all cursor-pointer group" onClick={() => handleEventClick(event)}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-bold group-hover:text-blue-600 transition-colors">{event.name}</CardTitle>
                            <div className="flex gap-2 mt-1">
                                <Badge variant="secondary">{event.category}</Badge>
                                <Badge variant="outline">{event.type}</Badge>
                            </div>
                        </CardHeader>
                        <CardFooter className="pt-2 text-xs text-slate-500 border-t bg-slate-50/50 rounded-b-xl flex justify-between items-center">
                            <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" /> {participantCount} Participants
                            </div>
                            <span className="text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">View &rarr;</span>
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
      )}

      {/* DIALOG 1: VIEW PARTICIPANTS */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                    Participants List <Badge>{selectedEvent?.name}</Badge>
                </DialogTitle>
                <p className="text-sm text-slate-500">
                    Total: {selectedEvent ? getParticipants(selectedEvent._id).length : 0} Students
                </p>
            </DialogHeader>
            <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2 mt-2">
                    {selectedEvent && getParticipants(selectedEvent._id).length === 0 ? (
                        <div className="text-center py-10 text-slate-500 border rounded-lg bg-slate-50">
                            No registrations yet.
                        </div>
                    ) : (
                        selectedEvent && getParticipants(selectedEvent._id).map((student) => (
                            <div 
                                key={student._id} 
                                onClick={() => handleStudentClick(student)}
                                className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 cursor-pointer transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs">
                                        {student.chestNo}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm group-hover:text-blue-600">{student.name}</p>
                                        <p className="text-xs text-slate-500">{student.team} • {student.category}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="text-xs opacity-50 group-hover:opacity-100">
                                    View Events <Eye className="w-3 h-3 ml-1" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: STUDENT DETAILS (Nested) */}
      <Dialog open={isStudentViewOpen} onOpenChange={setIsStudentViewOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    Student Profile <Badge variant="outline">{selectedStudent?.chestNo}</Badge>
                </DialogTitle>
            </DialogHeader>
            {selectedStudent && (
                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-lg text-center">
                        <h2 className="text-xl font-bold">{selectedStudent.name}</h2>
                        <div className="flex justify-center gap-2 mt-2 text-sm">
                            <Badge className={selectedStudent.team === "Auris" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}>
                                {selectedStudent.team}
                            </Badge>
                            <Badge variant="secondary">{selectedStudent.category}</Badge>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Registered Events ({selectedStudent.registeredEvents?.length || 0})
                        </h4>
                        <ScrollArea className="h-[200px]">
                            <div className="space-y-2">
                                {selectedStudent.registeredEvents?.map((ev, i) => (
                                    <div key={i} className="p-2 border rounded text-sm flex justify-between items-center bg-white">
                                        <span>{ev.name || "Unknown Event"}</span>
                                        {/* You can add 'isStar' badge here if you have that data in registeredEvents */}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
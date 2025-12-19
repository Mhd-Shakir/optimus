"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trophy, Medal, Trash2, Loader2, Check, ChevronsUpDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

// --- TYPES ---
type Student = {
  _id: string
  name: string
  chestNo: string
  team: string
  category: string
  // eventId is crucial for filtering
  registeredEvents: { eventId: string, name: string }[]
}

type Event = {
  _id: string
  name: string
  category: string
  type: string
  status?: "upcoming" | "completed"
  results?: { first: string, second: string, third: string, firstMark: string, secondMark: string, thirdMark: string }
}

// --- SEARCHABLE SELECT COMPONENT ---
function SearchableSelect({ options, value, onChange, placeholder }: any) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredOptions = options.filter((opt:any) => opt.label.toLowerCase().includes(search.toLowerCase()))
  const selectedLabel = options.find((opt:any) => opt.value === value)?.label

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center justify-between w-full px-3 py-2 text-sm border rounded-md cursor-pointer bg-white hover:bg-slate-50"
      >
        <span className={value ? "text-black font-medium" : "text-slate-500"}>
          {selectedLabel || placeholder}
        </span>
        <ChevronsUpDown className="w-4 h-4 text-slate-400 opacity-50" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 flex flex-col">
          <div className="p-2 border-b sticky top-0 bg-white z-10">
            <input 
              type="text" 
              className="w-full px-2 py-1.5 text-xs border rounded bg-slate-50 outline-none focus:ring-1 focus:ring-slate-200"
              placeholder="Type to search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1 p-1">
            {filteredOptions.length === 0 ? (
              <div className="text-xs text-center text-slate-400 py-3">No participants found</div>
            ) : (
              filteredOptions.map((opt:any) => (
                <div 
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                    setSearch("")
                  }}
                  className={`px-2 py-2 text-sm rounded cursor-pointer flex items-center justify-between ${value === opt.value ? "bg-slate-100 font-medium text-slate-900" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  {opt.label}
                  {value === opt.value && <Check className="w-3 h-3 text-green-600" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ResultsPage() {
  const { toast } = useToast()
  
  // Data State
  const [events, setEvents] = useState<Event[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Form State
  const [selectedEventId, setSelectedEventId] = useState("")
  const [winners, setWinners] = useState({ first: "", second: "", third: "" })
  const [marks, setMarks] = useState({ first: "", second: "", third: "" })
  const [submitting, setSubmitting] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>("All")

  // Fetch Data
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
      console.error("Failed to fetch data", error)
    } finally {
      setLoading(false)
    }
  }

  // --- FILTER PARTICIPANTS LOGIC ---
  const getParticipantOptions = () => {
    if (!selectedEventId) return []
    
    // Filter students who have the selectedEventId in their registeredEvents array
    const participants = students.filter(s => 
        s.registeredEvents?.some((e: any) => e.eventId === selectedEventId)
    )

    return participants.map(s => ({
        value: s._id,
        label: `${s.chestNo} - ${s.name} (${s.team})`
    }))
  }

  const participantOptions = getParticipantOptions()

  // Submit Result Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!selectedEventId) {
        return toast({ variant: "destructive", title: "Error", description: "Please select an event." })
    }
    if (!winners.first) {
        return toast({ variant: "destructive", title: "Error", description: "First Place winner is required!" })
    }

    setSubmitting(true)

    try {
        const payload = {
            eventId: selectedEventId,
            results: {
                first: winners.first,
                firstMark: marks.first || "0", 
                second: winners.second || null,
                secondMark: marks.second || "0",
                third: winners.third || null,
                thirdMark: marks.third || "0"
            }
        }

        await axios.post('/api/events/result', payload)
        
        toast({ title: "Success 🏆", description: "Result published successfully!" })
        setIsDialogOpen(false)
        setWinners({ first: "", second: "", third: "" })
        setMarks({ first: "", second: "", third: "" })
        setSelectedEventId("")
        fetchData() 

    } catch (error: any) {
        console.error("Publish Error:", error.response?.data || error)
        toast({ variant: "destructive", title: "Publish Failed", description: "Check console for details." })
    } finally {
        setSubmitting(false)
    }
  }

  // Delete Result
  const handleDeleteResult = async (eventId: string) => {
    if(!confirm("Are you sure? This will delete the result.")) return;
    try {
        await axios.post('/api/events/result/delete', { eventId })
        toast({ title: "Deleted", description: "Result removed." })
        fetchData()
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Delete failed." })
    }
  }

  // Helpers
  const getStudentName = (id: string) => {
    const s = students.find(st => st._id === id)
    return s ? `${s.chestNo} - ${s.name} (${s.team})` : "-"
  }
  
  // Event Options
  const eventOptions = events
    .filter(e => e.status !== 'completed')
    .map(e => ({ value: e._id, label: `${e.name} (${e.category})` }))

  const completedEvents = events.filter(e => e.status === "completed" && (filterCategory === "All" || e.category === filterCategory))
  const categories = ["Alpha", "Beta", "Omega", "General-A", "General-B"]

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Results & Marks</h1>
          <p className="text-muted-foreground mt-1">Record winners and their marks</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 text-white">
              <Plus className="h-4 w-4 mr-2" /> Record Result
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg overflow-visible"> 
            <DialogHeader><DialogTitle>Record Result & Marks</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 py-2">
                
                {/* Event Selection */}
                <div className="space-y-2">
                    <Label>Select Event</Label>
                    <SearchableSelect 
                      options={eventOptions} 
                      value={selectedEventId} 
                      onChange={(val: string) => {
                        setSelectedEventId(val)
                        setWinners({ first: "", second: "", third: "" }) 
                      }}
                      placeholder="Search event..." 
                    />
                </div>

                {selectedEventId && (
                    <div className="space-y-4 p-4 bg-slate-50 rounded border">
                        {participantOptions.length === 0 ? (
                             <div className="text-center py-4 bg-red-50 rounded border border-red-100">
                                <p className="text-sm text-red-600 font-bold">⚠️ No Participants Found</p>
                                <p className="text-xs text-red-500 mt-1">No students have registered for this specific event yet.</p>
                             </div>
                        ) : (
                            <>
                                {/* 1st Place */}
                                <div className="grid grid-cols-4 gap-3 items-end">
                                    <div className="col-span-3 space-y-1">
                                        <Label className="text-yellow-600 font-bold flex gap-1"><Trophy className="w-3 h-3"/> 1st Place</Label>
                                        <SearchableSelect 
                                            options={participantOptions} 
                                            value={winners.first} 
                                            onChange={(v: string) => setWinners({...winners, first: v})} 
                                            placeholder="Select Winner..." 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-500">Mark</Label>
                                        <Input placeholder="0" value={marks.first} onChange={e => setMarks({...marks, first: e.target.value})} />
                                    </div>
                                </div>

                                {/* 2nd Place */}
                                <div className="grid grid-cols-4 gap-3 items-end">
                                    <div className="col-span-3 space-y-1">
                                        <Label className="text-slate-500 font-bold flex gap-1"><Medal className="w-3 h-3"/> 2nd Place</Label>
                                        <SearchableSelect 
                                            options={participantOptions} 
                                            value={winners.second} 
                                            onChange={(v: string) => setWinners({...winners, second: v})} 
                                            placeholder="Select Runner up..." 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-500">Mark</Label>
                                        <Input placeholder="0" value={marks.second} onChange={e => setMarks({...marks, second: e.target.value})} />
                                    </div>
                                </div>

                                {/* 3rd Place */}
                                <div className="grid grid-cols-4 gap-3 items-end">
                                    <div className="col-span-3 space-y-1">
                                        <Label className="text-orange-600 font-bold flex gap-1"><Medal className="w-3 h-3"/> 3rd Place</Label>
                                        <SearchableSelect 
                                            options={participantOptions} 
                                            value={winners.third} 
                                            onChange={(v: string) => setWinners({...winners, third: v})} 
                                            placeholder="Select Third..." 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-500">Mark</Label>
                                        <Input placeholder="0" value={marks.third} onChange={e => setMarks({...marks, third: e.target.value})} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={submitting || !selectedEventId} className="bg-slate-900 text-white">
                        {submitting ? <Loader2 className="animate-spin mr-2" /> : "Publish Result"}
                    </Button>
                </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button variant={filterCategory === "All" ? "default" : "outline"} size="sm" onClick={() => setFilterCategory("All")}>All</Button>
        {categories.map((cat) => (
            <Button key={cat} variant={filterCategory === cat ? "default" : "outline"} size="sm" onClick={() => setFilterCategory(cat)}>{cat}</Button>
        ))}
      </div>

      {/* RESULTS TABLE */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
            <TableHeader>
                <TableRow>
                    {/* --- ADDED: Serial Number Header --- */}
                    <TableHead className="w-[50px]">SI</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-yellow-600">1st Place</TableHead>
                    <TableHead className="text-slate-500">2nd Place</TableHead>
                    <TableHead className="text-orange-600">3rd Place</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="animate-spin mx-auto text-slate-400" /></TableCell></TableRow>
                ) : completedEvents.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-500">No results recorded yet.</TableCell></TableRow>
                ) : (
                    // --- ADDED: index to map ---
                    completedEvents.map((event, index) => (
                        <TableRow key={event._id}>
                            {/* --- ADDED: Serial Number Cell --- */}
                            <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                            
                            <TableCell className="font-bold">{event.name}</TableCell>
                            <TableCell><Badge variant="secondary">{event.category}</Badge></TableCell>
                            <TableCell>
                                <div className="font-medium text-slate-900">{getStudentName(event.results?.first || "")}</div>
                                <div className="text-xs text-slate-400">Mark: {event.results?.firstMark || "-"}</div>
                            </TableCell>
                            <TableCell>
                                <div className="text-slate-700">{getStudentName(event.results?.second || "")}</div>
                                <div className="text-xs text-slate-400">Mark: {event.results?.secondMark || "-"}</div>
                            </TableCell>
                            <TableCell>
                                <div className="text-slate-700">{getStudentName(event.results?.third || "")}</div>
                                <div className="text-xs text-slate-400">Mark: {event.results?.thirdMark || "-"}</div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteResult(event._id)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
      </div>
    </div>
  )
}
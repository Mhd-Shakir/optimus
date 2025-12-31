"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Trophy, Medal, Loader2, Edit, Save, Trash2, Users, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// ✅ HELPER: Normalize strings for robust matching
const normalizeString = (str: string) => {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
};

export default function AdminResultsPage() {
  const { toast } = useToast()

  const [events, setEvents] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  
  const [activeTab, setActiveTab] = useState("All")

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  const [resultData, setResultData] = useState({
    first: "", firstGrade: "",
    second: "", secondGrade: "",
    third: "", thirdGrade: ""
  })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [eventsRes, studentsRes] = await Promise.all([
        axios.get('/api/events'),
        axios.get('/api/student/list')
      ])
      
      const sortedEvents = eventsRes.data.sort((a: any, b: any) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      setEvents(sortedEvents)
      setStudents(studentsRes.data)
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load data" })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (event: any) => {
    setEditingEvent(event)
    setResultData({
        first: event.results?.first || "",
        firstGrade: event.results?.firstGrade || "",
        second: event.results?.second || "",
        secondGrade: event.results?.secondGrade || "",
        third: event.results?.third || "",
        thirdGrade: event.results?.thirdGrade || ""
    })
    setIsEditOpen(true)
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this result?")) return;

    try {
        await axios.delete('/api/events/result', { data: { eventId } });
        toast({ title: "Deleted 🗑️", description: "Result removed successfully!" });
        fetchData();
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete result." });
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resultData.first) return toast({ variant: "destructive", title: "Wait!", description: "First Place is required." })

    setSubmitting(true)
    try {
        await axios.post('/api/events/result', {
            eventId: editingEvent._id,
            results: resultData
        })
        toast({ title: "Success 🏆", description: "Result published successfully!" })
        setIsEditOpen(false)
        fetchData()
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed", description: error.response?.data?.error || "Update failed" })
    } finally {
        setSubmitting(false)
    }
  }

  const getStudentName = (id: string) => {
      const s = students.find(std => std._id === id)
      return s ? `${s.name} (${s.team})` : "Unknown"
  }

  // ✅ UPDATED POINTS LOGIC
  const getPoints = (grade: string, event: any) => {
    if (!grade || !event) return 0;
    
    const eventName = normalizeString(event.name);

    // 1. Identify Group Events (Includes Histoart, Dictionary Making, Swaraf Debate)
    const isGroupEvent = event.groupEvent === true || 
                         eventName === "histoart" || 
                         eventName === "dictionarymaking" || 
                         eventName === "swarafdebate" || 
                         eventName === "swarfdebate";

    // 2. Identify Exceptions: Group Events that get Individual Points (10, 7, 5, 3)
    const individualPointExceptions = [
        "speechtranslation", 
        "dictionarymaking", 
        "swarafdebate", 
        "swarfdebate"
    ];

    // 3. Determine if High Points (25, 20...) should be used
    const useGroupPoints = isGroupEvent && !individualPointExceptions.includes(eventName);
    
    if (useGroupPoints) {
      // Group Points
      if (grade === "A+") return 25;
      if (grade === "A") return 20;
      if (grade === "B") return 13;
      if (grade === "C") return 7;
    } else {
      // Individual Points (also for Speech Trans, Dictionary Making, Swaraf Debate)
      if (grade === "A+") return 10;
      if (grade === "A") return 7;
      if (grade === "B") return 5;
      if (grade === "C") return 3;
    }
    return 0;
  }

  const filteredEvents = events.filter(ev => {
    const matchSearch = ev.name.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchSearch) return false;

    if (activeTab === "All") return true;
    return ev.category === activeTab; 
  })

  // ✅ FILTER: Only show students registered for the selected event
  const registeredStudents = students.filter(student => 
    student.registeredEvents?.some((r: any) => r.eventId === editingEvent?._id)
  );

  const tabs = ["All", "Alpha", "Beta", "Omega", "General-A", "General-B"];

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Results Management</h1>
            <p className="text-slate-500">Manage and publish event results.</p>
        </div>
      </div>

      <div className="space-y-4">
         <div className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search Event..." className="pl-9 bg-slate-50 border-slate-200" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
         </div>

         <div className="flex p-1 bg-slate-200/50 rounded-lg overflow-x-auto w-full md:w-fit custom-scrollbar">
            {tabs.map((cat) => (
                <button
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`px-5 py-2 text-sm font-bold rounded-md transition-all whitespace-nowrap ${
                        activeTab === cat 
                        ? "bg-white text-emerald-600 shadow-sm" 
                        : "text-slate-500 hover:text-emerald-600"
                    }`}
                >
                    {cat}
                </button>
            ))}
         </div>
      </div>

      <Card>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px]">SI</TableHead>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Winners</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow> : filteredEvents.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">No events found in {activeTab}.</TableCell></TableRow> : filteredEvents.map((ev, index) => {
                    const eventName = normalizeString(ev.name);
                    const isGroup = ev.groupEvent || eventName === "histoart" || eventName === "dictionarymaking" || eventName === "swarafdebate" || eventName === "swarfdebate";
                    
                    return (
                    <TableRow key={ev._id}>
                        <TableCell className="font-medium text-slate-500">{index + 1}</TableCell>
                        <TableCell className="font-bold text-slate-700">
                            {ev.name}
                        </TableCell>
                        <TableCell><Badge variant="secondary">{ev.category}</Badge></TableCell>
                        <TableCell>
                            {isGroup ? 
                                <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-700"><Users className="w-3 h-3 mr-1" /> Group</Badge> : 
                                <Badge variant="outline" className="border-slate-200 text-slate-500"><User className="w-3 h-3 mr-1" /> Single</Badge>
                            }
                        </TableCell>
                        <TableCell>
                            <Badge className={ev.status === "completed" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"}>
                                {ev.status === "completed" ? "Published" : "Pending"}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                            {ev.status === "completed" ? (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1"><Trophy className="w-3 h-3 text-yellow-500" /> 1st: {getStudentName(ev.results.first)} <span className="font-bold text-emerald-600">({ev.results.firstGrade})</span></div>
                                    {ev.results.second && <div className="flex items-center gap-1"><Medal className="w-3 h-3 text-slate-400" /> 2nd: {getStudentName(ev.results.second)} <span className="font-bold text-slate-600">({ev.results.secondGrade})</span></div>}
                                    {ev.results.third && <div className="flex items-center gap-1"><Medal className="w-3 h-3 text-amber-600" /> 3rd: {getStudentName(ev.results.third)} <span className="font-bold text-amber-700">({ev.results.thirdGrade})</span></div>}
                                </div>
                            ) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                           <div className="flex justify-end gap-2">
                                <Button size="sm" onClick={() => handleEdit(ev)} className="bg-slate-900 text-white hover:bg-slate-700">
                                    <Edit className="w-4 h-4 mr-2" /> {ev.status === "completed" ? "Edit" : "Add"}
                                </Button>
                                {ev.status === "completed" && (
                                    <Button size="icon" variant="destructive" className="h-9 w-9 bg-red-100 text-red-600 hover:bg-red-200 shadow-none border-none" onClick={() => handleDelete(ev._id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                           </div>
                        </TableCell>
                    </TableRow>
                )})}
            </TableBody>
        </Table>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
            <DialogHeader>
                <DialogTitle>Publish Result: {editingEvent?.name}</DialogTitle>
                {editingEvent && (
                    <div className="flex gap-2">
                        {(() => {
                            const nName = normalizeString(editingEvent.name);
                            const isGrp = editingEvent.groupEvent || nName === "histoart" || nName === "dictionarymaking" || nName === "swarafdebate" || nName === "swarfdebate";
                            return (
                                <Badge variant="outline" className={isGrp ? "bg-yellow-50 text-yellow-700" : "bg-slate-50 text-slate-700"}>
                                    {isGrp ? "Group Item" : "Individual Item"}
                                </Badge>
                            )
                        })()}
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200">{registeredStudents.length} Participants</Badge>
                    </div>
                )}
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
                
                {/* FIRST PLACE */}
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl space-y-2">
                    <div className="flex justify-between">
                        <label className="text-xs font-bold text-yellow-800 uppercase flex items-center gap-2"><Trophy className="w-4 h-4" /> First Place</label>
                        <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-yellow-200 text-yellow-700">
                            Points: {getPoints(resultData.firstGrade, editingEvent)}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Select value={resultData.first} onValueChange={val => setResultData({...resultData, first: val})}>
                            <SelectTrigger className="flex-1 bg-white border-yellow-200"><SelectValue placeholder="Select Winner" /></SelectTrigger>
                            <SelectContent className="max-h-60">
                                {registeredStudents.map(s => <SelectItem key={s._id} value={s._id}>{s.name} ({s.team})</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={resultData.firstGrade} onValueChange={val => setResultData({...resultData, firstGrade: val})}>
                            <SelectTrigger className="w-24 bg-white border-yellow-200"><SelectValue placeholder="Grade" /></SelectTrigger>
                            <SelectContent>
                                {["A+", "A", "B", "C"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* SECOND PLACE */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex justify-between">
                        <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-2"><Medal className="w-4 h-4" /> Second Place</label>
                        <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500">
                             Points: {getPoints(resultData.secondGrade, editingEvent)}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Select value={resultData.second || "_none"} onValueChange={val => setResultData({...resultData, second: val === "_none" ? "" : val})}>
                            <SelectTrigger className="flex-1 bg-white"><SelectValue placeholder="Select Second" /></SelectTrigger>
                            <SelectContent className="max-h-60">
                                <SelectItem value="_none">None</SelectItem> 
                                {registeredStudents.map(s => <SelectItem key={s._id} value={s._id}>{s.name} ({s.team})</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={resultData.secondGrade} onValueChange={val => setResultData({...resultData, secondGrade: val})}>
                            <SelectTrigger className="w-24 bg-white"><SelectValue placeholder="Grade" /></SelectTrigger>
                            <SelectContent>
                                {["A+", "A", "B", "C"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* THIRD PLACE */}
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-2">
                    <div className="flex justify-between">
                        <label className="text-xs font-bold text-orange-800 uppercase flex items-center gap-2"><Medal className="w-4 h-4" /> Third Place</label>
                        <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-orange-200 text-orange-700">
                             Points: {getPoints(resultData.thirdGrade, editingEvent)}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Select value={resultData.third || "_none"} onValueChange={val => setResultData({...resultData, third: val === "_none" ? "" : val})}>
                            <SelectTrigger className="flex-1 bg-white border-orange-200"><SelectValue placeholder="Select Third" /></SelectTrigger>
                            <SelectContent className="max-h-60">
                                <SelectItem value="_none">None</SelectItem>
                                {registeredStudents.map(s => <SelectItem key={s._id} value={s._id}>{s.name} ({s.team})</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={resultData.thirdGrade} onValueChange={val => setResultData({...resultData, thirdGrade: val})}>
                            <SelectTrigger className="w-24 bg-white border-orange-200"><SelectValue placeholder="Grade" /></SelectTrigger>
                            <SelectContent>
                                {["A+", "A", "B", "C"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={submitting} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">
                        {submitting ? <Loader2 className="animate-spin mr-2" /> : <><Save className="w-4 h-4 mr-2" /> Publish Results</>}
                    </Button>
                </div>
            </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
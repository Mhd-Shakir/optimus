"use client"

import { useState, useEffect, useMemo } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Trophy, Medal, Loader2, Edit, Save, Trash2, Users, User, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// ✅ HELPER: Normalize strings
const normalizeString = (str: string) => {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
};

// Types
type ResultData = {
    first: string; firstGrade: string;
    second: string; secondGrade: string;
    third: string; thirdGrade: string;
    others: Record<string, string>; // Store other grades as { studentId: grade }
}

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

  // Result State
  const [resultData, setResultData] = useState<ResultData>({
    first: "", firstGrade: "",
    second: "", secondGrade: "",
    third: "", thirdGrade: "",
    others: {} 
  })

  // Filter state inside modal
  const [gradeSearch, setGradeSearch] = useState("")

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
        thirdGrade: event.results?.thirdGrade || "",
        others: event.results?.others || {} 
    })
    setIsEditOpen(true)
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this result?")) return;
    try {
        await axios.delete('/api/events/result', { data: { eventId } });
        toast({ title: "Deleted", description: "Result removed successfully!" });
        fetchData();
    } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete result." });
    }
  }

  const handleSubmit = async () => {
    if (!resultData.first && !editingEvent.status) return toast({ variant: "destructive", title: "Wait!", description: "First Place is required to publish." })

    setSubmitting(true)
    try {
        await axios.post('/api/events/result', {
            eventId: editingEvent._id,
            results: resultData
        })
        toast({ title: "Success", description: "Result published successfully!" })
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

  // ✅ NEW POINTS LOGIC
  const getPoints = (grade: string, event: any, isPosition: boolean = false) => {
    if (!grade || !event) return 0;
    
    const eventName = normalizeString(event.name);

    // 1. Check if Group Event
    const isGroupEvent = event.groupEvent === true || 
                         eventName === "histoart" || 
                         eventName === "dictionarymaking" || 
                         eventName === "swarafdebate" || 
                         eventName === "swarfdebate";

    // 2. Exceptions (Group events with individual marks)
    const individualPointExceptions = ["speechtranslation", "dictionarymaking", "swarafdebate", "swarfdebate"];

    // 3. Determine Mode
    const useGroupPoints = isGroupEvent && !individualPointExceptions.includes(eventName);
    
    if (useGroupPoints) {
      // Group Points (Standard)
      if (grade === "A+") return 25;
      if (grade === "A") return 20;
      if (grade === "B") return 13;
      if (grade === "C") return 7;
    } else {
      // Individual Points
      if (isPosition) {
          // Winners (1st, 2nd, 3rd)
          if (grade === "A+") return 11;
          if (grade === "A") return 10;
          if (grade === "B") return 7;
          if (grade === "C") return 5;
      } else {
          // Other Grades (Participation)
          if (grade === "A+") return 6;
          if (grade === "A") return 4;
          if (grade === "B") return 3;
          if (grade === "C") return 1;
      }
    }
    return 0;
  }

  // Handle setting grade for "Others"
  const setOtherGrade = (studentId: string, grade: string) => {
      setResultData(prev => ({
          ...prev,
          others: { ...prev.others, [studentId]: grade }
      }))
  }

  const filteredEvents = events.filter(ev => {
    const matchSearch = ev.name.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchSearch) return false;
    if (activeTab === "All") return true;
    return ev.category === activeTab; 
  })

  // Get participants for selected event
  const registeredStudents = useMemo(() => {
      return students.filter(student => 
        student.registeredEvents?.some((r: any) => r.eventId === editingEvent?._id)
      );
  }, [students, editingEvent]);

  // Filter students for "Grades" tab (Exclude winners)
  const studentsForGrading = registeredStudents.filter(s => 
      s._id !== resultData.first && 
      s._id !== resultData.second && 
      s._id !== resultData.third
  ).filter(s => s.name.toLowerCase().includes(gradeSearch.toLowerCase()) || s.chestNo.includes(gradeSearch));

  const tabs = ["All", "Alpha", "Beta", "Omega", "General-A", "General-B"];

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Results</h1>
            <p className="text-slate-500">Manage event results and grades.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
         <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search Event..." className="pl-9 bg-slate-50 border-slate-200" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
         </div>
         <div className="flex p-1 bg-slate-200/50 rounded-lg overflow-x-auto w-full md:w-fit custom-scrollbar">
            {tabs.map((cat) => (
                <button key={cat} onClick={() => setActiveTab(cat)} className={`px-5 py-2 text-sm font-bold rounded-md transition-all whitespace-nowrap ${activeTab === cat ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-emerald-600"}`}>{cat}</button>
            ))}
         </div>
      </div>

      {/* Events Table */}
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
                        <TableCell className="font-bold text-slate-700">{ev.name}</TableCell>
                        <TableCell><Badge variant="secondary">{ev.category}</Badge></TableCell>
                        <TableCell>{isGroup ? <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Group</Badge> : <Badge variant="outline" className="text-slate-500">Single</Badge>}</TableCell>
                        <TableCell><Badge className={ev.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}>{ev.status === "completed" ? "Published" : "Pending"}</Badge></TableCell>
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
                                <Button size="sm" onClick={() => handleEdit(ev)} className="bg-slate-900 text-white hover:bg-slate-700"><Edit className="w-4 h-4 mr-2" /> {ev.status === "completed" ? "Edit" : "Add"}</Button>
                                {ev.status === "completed" && (<Button size="icon" variant="destructive" className="h-9 w-9 bg-red-100 text-red-600 hover:bg-red-200 shadow-none border-none" onClick={() => handleDelete(ev._id)}><Trash2 className="w-4 h-4" /></Button>)}
                           </div>
                        </TableCell>
                    </TableRow>
                )})}
            </TableBody>
        </Table>
      </Card>

      {/* ✅ IMPROVED EDIT RESULT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b bg-slate-50">
                <DialogTitle>Publish Result: {editingEvent?.name}</DialogTitle>
                {editingEvent && (
                    <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="bg-white">{editingEvent.category}</Badge>
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">{registeredStudents.length} Participants</Badge>
                    </div>
                )}
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-6 py-4">
                <Tabs defaultValue="winners" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="winners">🏆 Winners (Positions)</TabsTrigger>
                        <TabsTrigger value="grades">📝 All Grades (Others)</TabsTrigger>
                    </TabsList>

                    {/* TAB 1: WINNERS */}
                    <TabsContent value="winners" className="space-y-4">
                        {/* 1st Place */}
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl space-y-3 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10"><Trophy className="w-16 h-16 text-yellow-600" /></div>
                            <div className="flex justify-between relative z-10">
                                <label className="text-sm font-bold text-yellow-800 uppercase flex items-center gap-2"><Trophy className="w-4 h-4" /> First Place</label>
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Points: {getPoints(resultData.firstGrade, editingEvent, true)}</Badge>
                            </div>
                            <div className="flex gap-3 relative z-10">
                                <Select value={resultData.first} onValueChange={val => setResultData({...resultData, first: val})}>
                                    <SelectTrigger className="flex-1 bg-white border-yellow-300"><SelectValue placeholder="Select Winner" /></SelectTrigger>
                                    <SelectContent className="max-h-60">{registeredStudents.map(s => <SelectItem key={s._id} value={s._id}>{s.chestNo} - {s.name} ({s.team})</SelectItem>)}</SelectContent>
                                </Select>
                                <Select value={resultData.firstGrade} onValueChange={val => setResultData({...resultData, firstGrade: val})}>
                                    <SelectTrigger className="w-24 bg-white border-yellow-300"><SelectValue placeholder="Grade" /></SelectTrigger>
                                    <SelectContent>{["A+", "A", "B", "C"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* 2nd Place */}
                        <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl space-y-3 relative overflow-hidden">
                            <div className="flex justify-between relative z-10">
                                <label className="text-sm font-bold text-slate-700 uppercase flex items-center gap-2"><Medal className="w-4 h-4" /> Second Place</label>
                                <Badge className="bg-slate-200 text-slate-800 border-slate-400">Points: {getPoints(resultData.secondGrade, editingEvent, true)}</Badge>
                            </div>
                            <div className="flex gap-3 relative z-10">
                                <Select value={resultData.second || "_none"} onValueChange={val => setResultData({...resultData, second: val === "_none" ? "" : val})}>
                                    <SelectTrigger className="flex-1 bg-white border-slate-300"><SelectValue placeholder="Select Second" /></SelectTrigger>
                                    <SelectContent className="max-h-60"><SelectItem value="_none">None</SelectItem>{registeredStudents.map(s => <SelectItem key={s._id} value={s._id}>{s.chestNo} - {s.name} ({s.team})</SelectItem>)}</SelectContent>
                                </Select>
                                <Select value={resultData.secondGrade} onValueChange={val => setResultData({...resultData, secondGrade: val})}>
                                    <SelectTrigger className="w-24 bg-white border-slate-300"><SelectValue placeholder="Grade" /></SelectTrigger>
                                    <SelectContent>{["A+", "A", "B", "C"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* 3rd Place */}
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3 relative overflow-hidden">
                            <div className="flex justify-between relative z-10">
                                <label className="text-sm font-bold text-orange-800 uppercase flex items-center gap-2"><Medal className="w-4 h-4" /> Third Place</label>
                                <Badge className="bg-orange-100 text-orange-800 border-orange-300">Points: {getPoints(resultData.thirdGrade, editingEvent, true)}</Badge>
                            </div>
                            <div className="flex gap-3 relative z-10">
                                <Select value={resultData.third || "_none"} onValueChange={val => setResultData({...resultData, third: val === "_none" ? "" : val})}>
                                    <SelectTrigger className="flex-1 bg-white border-orange-300"><SelectValue placeholder="Select Third" /></SelectTrigger>
                                    <SelectContent className="max-h-60"><SelectItem value="_none">None</SelectItem>{registeredStudents.map(s => <SelectItem key={s._id} value={s._id}>{s.chestNo} - {s.name} ({s.team})</SelectItem>)}</SelectContent>
                                </Select>
                                <Select value={resultData.thirdGrade} onValueChange={val => setResultData({...resultData, thirdGrade: val})}>
                                    <SelectTrigger className="w-24 bg-white border-orange-300"><SelectValue placeholder="Grade" /></SelectTrigger>
                                    <SelectContent>{["A+", "A", "B", "C"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                    </TabsContent>

                    {/* TAB 2: GRADES */}
                    <TabsContent value="grades">
                        <div className="mb-4 relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input placeholder="Search students..." className="pl-9" value={gradeSearch} onChange={e => setGradeSearch(e.target.value)} />
                        </div>
                        <ScrollArea className="h-[400px] border rounded-lg bg-white">
                            <Table>
                                <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                    <TableRow>
                                        <TableHead>Chest No</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Team</TableHead>
                                        <TableHead>Grade</TableHead>
                                        <TableHead className="text-right">Points</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {studentsForGrading.length === 0 ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-10 text-slate-400">No other students found.</TableCell></TableRow>
                                    ) : studentsForGrading.map(student => {
                                        const currentGrade = resultData.others[student._id] || "";
                                        return (
                                            <TableRow key={student._id}>
                                                <TableCell className="font-mono font-bold">{student.chestNo}</TableCell>
                                                <TableCell>{student.name}</TableCell>
                                                <TableCell><Badge variant="outline">{student.team}</Badge></TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        {["A+", "A", "B", "C"].map(g => (
                                                            <button 
                                                                key={g}
                                                                type="button"
                                                                onClick={() => setOtherGrade(student._id, currentGrade === g ? "" : g)}
                                                                className={`w-8 h-8 rounded text-xs font-bold transition-all border ${
                                                                    currentGrade === g 
                                                                    ? "bg-slate-900 text-white border-slate-900" 
                                                                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                                                                }`}
                                                            >
                                                                {g}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-emerald-600">
                                                    {currentGrade ? `+${getPoints(currentGrade, editingEvent, false)}` : "-"}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </div>

            <DialogFooter className="px-6 py-4 border-t bg-slate-50">
                <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[150px]">
                    {submitting ? <Loader2 className="animate-spin mr-2" /> : <><Save className="w-4 h-4 mr-2" /> Publish All Results</>}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
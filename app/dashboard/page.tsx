"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import { 
  LayoutDashboard, ClipboardList, LogOut, Plus, Loader2, Mic, PenTool, 
  CheckCircle2, X, Star, Users, Trash2, Pencil, Lock, User, Send, Search, ArrowLeft, Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// 👇 POINT SYSTEM CONFIGURATION
const INDIVIDUAL_POINTS: any = { "A+": 10, "A": 7, "B": 5, "C": 3 };
const GROUP_POINTS: any = { "A+": 25, "A": 20, "B": 13, "C": 7 };

export default function TeamDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [activeView, setActiveView] = useState("dashboard");

  const [events, setEvents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  
  // Registration States
  const [isRegOpen, setIsRegOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); 
  const [editId, setEditId] = useState(""); 
  const [submitting, setSubmitting] = useState(false);
  const [activeRegTab, setActiveRegTab] = useState<"Stage" | "Non-Stage">("Stage");
  const [activeCategory, setActiveCategory] = useState("All"); 
  const [viewStudent, setViewStudent] = useState<any | null>(null);
  const [isSystemRegOpen, setIsSystemRegOpen] = useState(true); 

  // Stage Control States
  const [stageEventId, setStageEventId] = useState("");
  const [stageSearch, setStageSearch] = useState("");
  const [stageTab, setStageTab] = useState("All");
  const [updatingStatus, setUpdatingStatus] = useState("");

  const [formData, setFormData] = useState({ name: "", team: "", category: "Alpha" });
  const [selectedEvents, setSelectedEvents] = useState<{eventId: string, name: string, isStar: boolean, type: string, category: string, groupEvent: boolean, teamLimit?: number}[]>([]);

  useEffect(() => {
    if (user?.team) {
      setFormData(prev => ({ ...prev, team: user.team }));
      fetchData();
      axios.get('/api/settings').then(res => setIsSystemRegOpen(res.data.registrationOpen));
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsRes, studentsRes] = await Promise.all([
        axios.get('/api/events'),
        axios.get('/api/student/list')
      ]);
      setEvents(eventsRes.data);
      const teamStudents = studentsRes.data.filter((s: any) => s.team === user?.team);
      setStudents(teamStudents);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  // --- SCORE CALCULATION HELPERS ---
  const getEventResult = (studentId: string, eventId: string) => {
      const event = events.find(e => e._id === eventId);
      if (!event || !event.results) return { rank: null, grade: null, points: 0 };

      const { first, second, third, firstGrade, secondGrade, thirdGrade } = event.results;
      let grade = "";
      let rank = "";

      if (first === studentId) { rank = "1st"; grade = firstGrade; }
      else if (second === studentId) { rank = "2nd"; grade = secondGrade; }
      else if (third === studentId) { rank = "3rd"; grade = thirdGrade; }

      if (!grade) return { rank: null, grade: null, points: 0 };

      // Point Calculation Logic
      // Speech Translation is a Group Event but gets INDIVIDUAL points
      const isSpeechTrans = event.name.trim().toLowerCase() === "speech translation";
      const isGroup = event.groupEvent === true && !isSpeechTrans;
      
      const pointMap = isGroup ? GROUP_POINTS : INDIVIDUAL_POINTS;
      const points = pointMap[grade] || 0;

      return { rank, grade, points };
  };

  const calculateTotalPoints = (student: any) => {
      let total = 0;
      student.registeredEvents.forEach((reg: any) => {
          const { points } = getEventResult(student._id, reg.eventId);
          total += points;
      });
      return total;
  };

  // --- STAGE CONTROL LOGIC ---
  const updateStatus = async (studentId: string, eventId: string, status: string) => {
    setUpdatingStatus(studentId);
    try {
        await axios.post('/api/stage/update', { studentId, eventId, status });
        toast({ title: "Updated", description: `Student marked as ${status}` });
        fetchData();
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to update status" });
    } finally { setUpdatingStatus(""); }
  }

  const getStageStudents = () => {
      if (!stageEventId) return [];
      return students.filter(s => s.registeredEvents.some((e:any) => e.eventId === stageEventId));
  }

  // Filter Logic for Stage Events (Search + Category Tabs)
  const filteredStageEvents = events.filter(ev => {
      const matchSearch = ev.name.toLowerCase().includes(stageSearch.toLowerCase());
      const matchTab = stageTab === "All" || ev.category === stageTab;
      return matchSearch && matchTab;
  });

  // --- REGISTRATION LOGIC ---
  const handleEdit = (e: any, s: any) => { 
    e.stopPropagation(); 
    if(!isSystemRegOpen) return toast({variant:"destructive",title:"Closed", description: "Registration closed by admin."}); 
    setEditId(s._id); 
    setFormData({name:s.name,team:s.team,category:s.category}); 
    const mapped=s.registeredEvents.map((ev:any)=>{
        const orig=events.find(x=>x._id===ev.eventId);
        return{eventId:ev.eventId,name:ev.name||orig?.name,type:orig?.type||"Stage",isStar:ev.isStar,category:orig?.category||"",groupEvent:orig?.groupEvent||false,teamLimit:orig?.teamLimit}
    }); 
    setSelectedEvents(mapped); 
    setIsEditMode(true); 
    setIsRegOpen(true); 
  };
  
  const toggleEvent = (event: any) => {
    const exists = selectedEvents.find(e => e.eventId === event._id);
    if (exists) { 
        setSelectedEvents(prev => prev.filter(e => e.eventId !== event._id)); 
    } else {
      const isGeneral = event.category.toLowerCase().includes("general"), isStage = event.type === "Stage", isGroup = event.groupEvent === true;
      
      // Rule 1: Team Limit
      if (event.teamLimit || (isStage && !isGroup)) {
        const count = students.filter(s => s._id !== editId && s.registeredEvents?.some((re: any) => re.eventId === event._id)).length;
        if (count >= (event.teamLimit || 3)) return toast({ variant: "destructive", title: "Limit Reached", description: `Team already has ${event.teamLimit || 3} participants.` });
      }
      // Rule 2: Individual Stage Limit (Max 6)
      if (isStage && !isGroup && !isGeneral) {
          if (selectedEvents.filter(e => e.type === "Stage" && !e.groupEvent && !e.category.toLowerCase().includes("general")).length >= 6) return toast({ variant: "destructive", title: "Limit Reached", description: "Max 6 Individual Stage events." });
      }
      setSelectedEvents(prev => [...prev, { eventId: event._id, name: event.name, isStar: false, type: event.type, category: event.category, groupEvent: event.groupEvent || false, teamLimit: event.teamLimit }]);
    }
  };

  // ✅ UPDATED TOGGLE STAR LOGIC (Case Insensitive)
  const toggleStar = (id:string) => { 
      const target=selectedEvents.find(e=>e.eventId===id); 
      if(!target) return;
      if(target.category.toLowerCase().includes("general")) return; 

      // 🚫 EXCEPTION: Speech Translation (Omega) - No Star Allowed
      const isSpeechTrans = target.name.toLowerCase() === "speech translation" && target.category === "Omega";
      if (isSpeechTrans) {
          return toast({variant:"destructive",title:"No Star Needed", description: "Speech Translation counts automatically."});
      }

      // Limit Rule: Alpha = 6, Others = 8 for Non-Stage items
      const limit = formData.category === "Alpha" ? 6 : 8;
      
      // Count only Non-Stage stars because that's where the limit applies
      const currentStars = selectedEvents.filter(e => e.isStar && e.type === "Non-Stage").length;

      if(!target.isStar && currentStars >= limit) {
          return toast({variant:"destructive",title:"Limit Reached", description: `Max ${limit} stars allowed for ${formData.category} category.`}); 
      }
      setSelectedEvents(prev=>prev.map(e=>e.eventId===id?{...e,isStar:!e.isStar}:e)); 
  };
  
  const closeModal = () => { setIsRegOpen(false); setIsEditMode(false); setEditId(""); setFormData({ name: "", team: user?.team || "", category: "Alpha" }); setSelectedEvents([]); };
  
  const handleDelete = async (e:any, id:string) => { e.stopPropagation(); if(!confirm("Sure?")) return; await axios.post('/api/student/delete', { id }); toast({title:"Deleted"}); fetchData(); };
  
  const handleRegister = async (e:any) => { 
      e.preventDefault(); 
      if(!formData.name) return; 
      setSubmitting(true); 
      try { 
          await axios.post(isEditMode?"/api/student/update":"/api/student/register", { ...formData, id:editId, chestNo:Math.floor(1000+Math.random()*9000).toString(), selectedEvents }); 
          toast({title:"Success"}); 
          closeModal(); 
          fetchData(); 
      } catch(err:any){ 
          toast({variant:"destructive",title:"Error",description:err.response?.data?.error}); 
      } finally{ 
          setSubmitting(false); 
      } 
  };

  const filteredStudents = activeCategory==="All"?students:students.filter((s:any)=>s.category===activeCategory);
  const categories = ["All", "Alpha", "Beta", "Omega", "General-A", "General-B"];

  // Filter events for Registration Modal
  const regModalEvents = events.filter(e => {
    if(e.type !== activeRegTab) return false;
    if(e.category === formData.category) return true;
    if(formData.category === "Alpha" && e.category === "General-A") return true;
    if((formData.category === "Beta" || formData.category === "Omega") && e.category === "General-B") return true;
    return false;
  });

  // ✅ DEFINE STAR COUNT HERE
  const starCount = selectedEvents.filter(e => e.isStar && e.type === "Non-Stage").length;
  const starLimit = formData.category === "Alpha" ? 6 : 8;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-50"><h1 className="text-2xl font-black text-emerald-600">Optimus</h1><p className="text-[10px] text-slate-400 font-bold uppercase">Team Portal</p></div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          <button onClick={() => setActiveView("dashboard")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeView === "dashboard" ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "text-slate-500 hover:bg-slate-50"}`}><LayoutDashboard className="w-5 h-5" /> Dashboard</button>
          <button onClick={() => setActiveView("stage")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeView === "stage" ? "bg-purple-600 text-white shadow-md shadow-purple-200" : "text-slate-500 hover:bg-slate-50"}`}><Send className="w-5 h-5" /> Stage Control</button>
          {isSystemRegOpen && <button onClick={() => { setIsEditMode(false); setIsRegOpen(true); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50"><ClipboardList className="w-5 h-5" /> Registration</button>}
        </nav>
        <div className="p-4 border-t border-slate-100"><button onClick={() => { logout(); router.push("/login"); }} className="flex items-center gap-3 px-4 py-3 text-red-500 font-bold text-sm"><LogOut className="w-5 h-5" /> Logout</button></div>
      </aside>

      <main className="flex-1 md:ml-64 p-6 md:p-10 flex flex-col min-h-screen">
        {activeView === "stage" ? (
            // --- STAGE CONTROL VIEW ---
            <div className="max-w-4xl mx-auto w-full pt-10">
                <div className="mb-8 flex justify-between items-end">
                    <div><h2 className="text-3xl font-black text-slate-900 tracking-tight">Stage Control</h2><p className="text-slate-500 mt-1">Send your team students to the stage.</p></div>
                    {stageEventId && <Button variant="outline" onClick={() => setStageEventId("")}><ArrowLeft className="w-4 h-4 mr-2" /> Change Event</Button>}
                </div>

                {!stageEventId ? (
                    <div className="space-y-6">
                        {/* Search & Tabs */}
                        <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
                            <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input placeholder="Search Event Name..." className="pl-9 h-10" value={stageSearch} onChange={e => setStageSearch(e.target.value)} /></div>
                            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">{categories.map(cat => (<button key={cat} onClick={() => setStageTab(cat)} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${stageTab === cat ? "bg-purple-600 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{cat}</button>))}</div>
                        </div>
                        
                        {/* Event List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                            {filteredStageEvents.length === 0 ? <div className="col-span-full text-center py-10 text-slate-400">No events match your search.</div> : filteredStageEvents.map(ev => (
                                <div key={ev._id} onClick={() => setStageEventId(ev._id)} className="bg-white p-5 rounded-xl border border-slate-200 hover:border-purple-500 hover:shadow-md cursor-pointer transition-all group">
                                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-purple-700">{ev.name}</h3><Badge variant="secondary" className="text-[10px] mt-2">{ev.category}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    // Selected Event View
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 bg-slate-50 border-b font-bold flex justify-between items-center">
                            <span className="text-slate-700">Participants from {user?.team}</span>
                            <Badge variant="outline" className="bg-white">{getStageStudents().length}</Badge>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {getStageStudents().length === 0 ? (
                                <div className="p-10 text-center text-slate-400">No students registered for this event from your team.</div>
                            ) : getStageStudents().map(student => {
                                const eventData = student.registeredEvents.find((e:any) => e.eventId === stageEventId);
                                const status = eventData?.status || "registered"; // registered | sent | reported

                                return (
                                    <div key={student._id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200">
                                                {student.chestNo}
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg text-slate-900">{student.name}</p>
                                                <p className="text-xs text-slate-500 font-medium uppercase">{student.category}</p>
                                            </div>
                                        </div>
                                        <div>
                                            {status === "registered" && (
                                                <Button 
                                                    onClick={() => updateStatus(student._id, stageEventId, "sent")} 
                                                    disabled={updatingStatus === student._id}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100 shadow-lg transition-all active:scale-95"
                                                >
                                                    {updatingStatus === student._id ? <Loader2 className="animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Send to Stage</>}
                                                </Button>
                                            )}
                                            {status === "sent" && (
                                                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 px-3 py-1.5 text-xs font-bold animate-pulse flex items-center gap-2">
                                                    <Loader2 className="w-3 h-3 animate-spin" /> SENT & WAITING
                                                </Badge>
                                            )}
                                            {status === "reported" && (
                                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-3 py-1.5 text-xs font-bold flex items-center gap-2">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> REPORTED ON STAGE
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        ) : (
            
        // --- DASHBOARD VIEW (Existing) ---
        <>
            <div className="flex flex-col items-center justify-center text-center space-y-4 mb-10 pt-10">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl ${user?.team === 'Auris' ? 'bg-yellow-500 shadow-yellow-100' : 'bg-blue-600 shadow-blue-100'}`}>
                {user?.team?.charAt(0)}
            </div>
            <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Team {user?.team}</h2>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Total Students: {students.length}</p>
            </div>
            
            {isSystemRegOpen ? (
                <Button onClick={() => { setIsEditMode(false); setIsRegOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-12 rounded-xl text-sm font-black shadow-lg shadow-emerald-100">
                    <Plus className="w-4 h-4 mr-2" /> NEW REGISTRATION
                </Button>
            ) : (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-6 py-3 rounded-xl font-bold text-sm shadow-sm">
                    <Lock className="w-4 h-4" /> REGISTRATION IS CLOSED BY ADMIN
                </div>
            )}
            </div>

            {/* STUDENTS TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-10">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-500" /><h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Registered Students</h3></div>
                <div className="flex p-1 bg-slate-200/50 rounded-lg overflow-x-auto">
                {['All', 'Alpha', 'Beta', 'Omega'].map((cat) => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${activeCategory === cat ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-emerald-600"}`}>{cat}</button>
                ))}
                </div>
            </div>
            
            <Table>
                <TableHeader>
                <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[200px] text-xs font-bold uppercase text-slate-400">Name</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-slate-400">Chest No</TableHead>
                    <TableHead className="text-xs font-bold uppercase text-slate-400">Events</TableHead>
                    <TableHead className="text-right text-xs font-bold uppercase text-slate-400">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="animate-spin w-6 h-6 mx-auto text-slate-300"/></TableCell></TableRow> : filteredStudents.length === 0 ? <TableRow><TableCell colSpan={4} className="h-32 text-center text-slate-400 text-sm font-medium">No students found.</TableCell></TableRow> : filteredStudents.map((student: any) => (
                    <TableRow key={student._id} className="hover:bg-slate-50 cursor-pointer group" onClick={() => setViewStudent(student)}>
                        <td className="p-4 font-bold text-slate-700">{student.name}</td>
                        <td className="p-4"><span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{student.chestNo || "N/A"}</span></td>
                        <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                            {student.registeredEvents?.length > 0 ? <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{student.registeredEvents.length} Items</span> : <span className="text-xs text-slate-300">None</span>}
                            {student.registeredEvents?.some((e: any) => e.isStar) && <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-[10px] px-1.5">{student.registeredEvents.filter((e:any) => e.isStar).length} ★</Badge>}
                        </div>
                        </td>
                        <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:text-blue-500 hover:bg-blue-50" onClick={(e) => handleEdit(e, student)}>
                                <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={(e) => handleDelete(e, student._id)}>
                            <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                        </td>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
            </div>
        </>
        )}

        {/* REGISTRATION & EDIT MODAL */}
        <Dialog open={isRegOpen} onOpenChange={closeModal}>
          <DialogContent className="max-w-xl w-full p-0 border-none shadow-2xl rounded-xl overflow-hidden bg-white" aria-describedby={undefined}>
            <div className="bg-emerald-600 px-5 py-3 flex justify-between items-center text-white shrink-0">
              <div>
                <DialogTitle className="text-lg font-bold text-white">{isEditMode ? "Edit Student" : "Student Registration"}</DialogTitle>
                <p className="text-[10px] opacity-90">Assign events and stars.</p>
              </div>
              <button onClick={closeModal} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleRegister}>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3 border border-slate-100 bg-slate-50/50 p-3 rounded-lg">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Name</label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Student Name" className="h-9 text-sm border-emerald-500 focus:ring-emerald-500 bg-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Team</label>
                    <div className="h-9 px-3 flex items-center bg-slate-200 text-slate-600 text-sm font-bold rounded-md border border-slate-300 cursor-not-allowed">{user?.team || "Loading..."}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Category</label>
                    <Select value={formData.category} onValueChange={val => setFormData({...formData, category: val})}>
                      <SelectTrigger className="h-9 text-sm bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alpha">Alpha</SelectItem>
                        <SelectItem value="Beta">Beta</SelectItem>
                        <SelectItem value="Omega">Omega</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex border rounded-lg overflow-hidden h-9">
                  <button type="button" onClick={() => setActiveRegTab("Stage")} className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold transition-all ${activeRegTab === "Stage" ? "bg-purple-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50 border-r"}`}><Mic className="w-3 h-3" /> Stage</button>
                  <button type="button" onClick={() => setActiveRegTab("Non-Stage")} className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold transition-all ${activeRegTab === "Non-Stage" ? "bg-white border-l shadow-inner" : "bg-white text-slate-500 hover:bg-slate-50"}`}><PenTool className="w-3 h-3" /> Non-Stage</button>
                </div>

                <div className="border border-purple-600 rounded-lg p-3 relative bg-purple-50/10">
                  <div className="flex justify-between items-center mb-2">
                      <p className="text-purple-700 font-bold text-[10px] uppercase">
                          {activeRegTab} Items
                          <span className="ml-2 text-slate-400 font-normal">
                              (Selected: {selectedEvents.filter(e => e.type === activeRegTab).length})
                          </span>
                      </p>
                      {activeRegTab === "Non-Stage" && (<div className="flex items-center gap-1 bg-yellow-100 px-2 py-0.5 rounded text-[10px] font-black text-yellow-700 border border-yellow-200"><Star className="w-3 h-3 fill-current" />{starCount}/{starLimit} Stars Used</div>)}
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {regModalEvents.map(ev => {
                      const isSel = selectedEvents.find(s => s.eventId === ev._id);
                      
                      // ✅ FIX: Case-Insensitive Check for Speech Translation
                      const isSpeechTrans = ev.name.toLowerCase() === "speech translation" && ev.category === "Omega";
                      const isGeneral = ev.category.toLowerCase().includes("general");
                      const isGroup = ev.groupEvent === true;

                      return (
                        <div key={ev._id} className={`flex justify-between items-center p-2 border rounded-md transition-all ${isSel ? 'bg-white border-purple-200 shadow-sm' : 'border-slate-100 hover:bg-slate-50'}`}>
                          <div className="flex items-center">
                              <span className="text-xs font-medium text-slate-700 truncate mr-2">{ev.name}</span>
                              
                              {/* ✅ BADGES */}
                              {isGeneral && <span className="text-[8px] bg-slate-800 text-white px-1 py-0.5 rounded font-bold uppercase mr-1">Gen</span>}
                              {isGroup ? (
                                <span className="text-[8px] bg-yellow-100 text-yellow-800 border border-yellow-200 px-1 py-0.5 rounded font-bold uppercase mr-1">Group</span>
                              ) : (
                                <span className="text-[8px] bg-white text-slate-400 border border-slate-200 px-1 py-0.5 rounded font-bold uppercase flex items-center gap-0.5 mr-1"><User className="w-2 h-2" /> Single</span>
                              )}
                              {(ev.teamLimit || (!isGroup && ev.type === 'Stage')) && (
                                <span className="text-[8px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 font-bold">Limit: {ev.teamLimit || 3}</span>
                              )}
                          </div>
                          <div className="flex gap-1">
                              {/* ✅ HIDE STAR BUTTON IF SPEECH TRANSLATION */}
                              {isSel && activeRegTab === "Non-Stage" && !isGeneral && !isSpeechTrans && (
                                  <Button type="button" onClick={(e) => { e.stopPropagation(); toggleStar(ev._id); }} size="icon" variant="ghost" className={`h-7 w-7 rounded-full ${isSel.isStar ? 'text-yellow-500 bg-yellow-50 shadow-sm border border-yellow-200' : 'text-slate-300 hover:text-yellow-400'}`}><Star className={`w-3.5 h-3.5 ${isSel.isStar ? 'fill-current' : ''}`} /></Button>
                              )}
                              <Button type="button" onClick={() => toggleEvent(ev)} size="sm" variant={isSel ? "default" : "outline"} className={`h-7 px-3 rounded-md text-[10px] font-bold ${isSel ? 'bg-purple-600 text-white border-none' : 'text-slate-500 border-slate-200'}`}>{isSel ? <CheckCircle2 className="w-3.5 h-3.5" /> : "Add"}</Button>
                          </div>
                        </div>
                      )
                    })}
                    {regModalEvents.length === 0 && <div className="text-center py-4 text-slate-400 text-xs">No events found.</div>}
                  </div>
                </div>

                <div className="flex justify-between items-center gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={closeModal} className="text-slate-400 hover:text-slate-600 h-10 text-xs font-bold">Cancel</Button>
                  <Button type="submit" disabled={submitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 shadow-lg shadow-emerald-100 rounded-lg text-sm">
                    {submitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : (isEditMode ? "Update Student" : "Complete Registration")}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* ✅ STUDENT SCORE CARD MODAL */}
        {viewStudent && (
          <Dialog open={!!viewStudent} onOpenChange={(open) => !open && setViewStudent(null)}>
            <DialogContent className="max-w-md w-full p-0 border-none rounded-xl overflow-hidden bg-white" aria-describedby={undefined}>
                <div className="bg-slate-800 px-5 py-6 flex justify-between items-start text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <DialogTitle className="text-2xl font-black tracking-tight">{viewStudent.name}</DialogTitle>
                    <p className="text-slate-300 text-xs font-bold mt-1 uppercase tracking-wide opacity-80">{viewStudent.team} | {viewStudent.category} | {viewStudent.chestNo}</p>
                  </div>
                  <div className="text-right relative z-10">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Score</div>
                      <div className="text-4xl font-black text-yellow-400 leading-none">{calculateTotalPoints(viewStudent)}</div>
                  </div>
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy className="w-32 h-32 text-white" /></div>
                  <button onClick={() => setViewStudent(null)} className="absolute top-2 right-2 p-2 text-white/50 hover:text-white z-20"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-0 max-h-[60vh] overflow-y-auto bg-slate-50">
                    {viewStudent.registeredEvents?.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">No events registered.</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {viewStudent.registeredEvents?.map((e:any, idx:number) => {
                                const { rank, grade, points } = getEventResult(viewStudent._id, e.eventId);
                                const original = events.find(ev => ev._id === e.eventId);
                                const isGrp = original?.groupEvent === true;

                                return (
                                  <div key={idx} className="px-5 py-3 bg-white flex justify-between items-center hover:bg-slate-50 transition-colors">
                                      <div className="flex-1 pr-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-800">{e.name}</span>
                                            {isGrp && <span className="text-[9px] bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded uppercase font-bold border border-yellow-200">Group</span>}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            {e.status === 'sent' && <Badge variant="outline" className="text-[9px] h-4 px-1 text-yellow-600 border-yellow-300 bg-yellow-50">Sent to Stage</Badge>}
                                            {e.status === 'reported' && <Badge variant="outline" className="text-[9px] h-4 px-1 text-emerald-600 border-emerald-300 bg-emerald-50">Completed</Badge>}
                                            {e.isStar && <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"><Star className="w-2 h-2 fill-current"/> Star</span>}
                                        </div>
                                      </div>
                                      
                                      <div className="text-right min-w-[60px]">
                                          {grade ? (
                                              <div>
                                                  <div className="text-lg font-black text-slate-900">{grade}</div>
                                                  <div className="text-[10px] font-bold text-emerald-600">+{points} pts</div>
                                              </div>
                                          ) : (
                                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Pending</span>
                                          )}
                                      </div>
                                  </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
          </Dialog>
        )}

      </main>
    </div>
  );
}
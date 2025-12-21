"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import { 
  LayoutDashboard, 
  ClipboardList, 
  LogOut, 
  Plus, 
  Loader2, 
  Mic, 
  PenTool, 
  CheckCircle2,
  X,
  Star,
  Users,
  Trash2,
  Pencil,
  Lock,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function TeamDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [events, setEvents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  
  // Registration & Edit States
  const [isRegOpen, setIsRegOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); 
  const [editId, setEditId] = useState(""); 

  const [submitting, setSubmitting] = useState(false);
  const [activeRegTab, setActiveRegTab] = useState<"Stage" | "Non-Stage">("Stage");

  const [activeCategory, setActiveCategory] = useState("All"); 
  const [viewStudent, setViewStudent] = useState<any | null>(null);
  const [isSystemRegOpen, setIsSystemRegOpen] = useState(true); 

  const [formData, setFormData] = useState({
    name: "", 
    team: "", 
    category: "Alpha"
  });
  
  // ✅ UPDATED: Added groupEvent to type definition
  const [selectedEvents, setSelectedEvents] = useState<{eventId: string, name: string, isStar: boolean, type: string, category: string, groupEvent: boolean}[]>([]);

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
    } catch (error) {
      console.error("Data load error:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLE EDIT ---
  const handleEdit = (e: React.MouseEvent, student: any) => {
    e.stopPropagation();
    if (!isSystemRegOpen) return toast({ variant: "destructive", title: "Closed", description: "Registration is closed by Admin." });

    setEditId(student._id);
    setFormData({
        name: student.name,
        team: student.team,
        category: student.category
    });
    
    // ✅ UPDATED: Load groupEvent status correctly
    const mappedEvents = student.registeredEvents.map((ev: any) => {
        const original = events.find((e:any) => e._id === ev.eventId);
        return {
            eventId: ev.eventId,
            name: ev.name || original?.name,
            type: original?.type || "Stage",
            isStar: ev.isStar,
            category: original?.category || "",
            groupEvent: original?.groupEvent || false // Load group status
        };
    });
    
    setSelectedEvents(mappedEvents);
    setIsEditMode(true);
    setIsRegOpen(true);
  };

  // ✅ UPDATED: Toggle Event with Unlimited General & Limited Individual Stage
  const toggleEvent = (event: any) => {
    const exists = selectedEvents.find(e => e.eventId === event._id);
    if (exists) {
      setSelectedEvents(prev => prev.filter(e => e.eventId !== event._id));
    } else {
      const isGeneral = event.category.toLowerCase().includes("general");
      const isStage = event.type === "Stage";
      const isGroup = event.groupEvent === true;

      // 🛑 RULE: Limit applies ONLY to (Stage + Individual + Not General)
      if (isStage && !isGroup && !isGeneral) {
          const currentCount = selectedEvents.filter(e => 
              e.type === "Stage" && 
              !e.groupEvent && 
              !e.category.toLowerCase().includes("general")
          ).length;

          if (currentCount >= 6) {
              return toast({ variant: "destructive", title: "Limit Reached", description: "Maximum 6 Individual Stage events allowed!" });
          }
      }

      setSelectedEvents(prev => [...prev, { 
          eventId: event._id, 
          name: event.name, 
          isStar: false, 
          type: event.type,
          category: event.category,
          groupEvent: event.groupEvent || false // Store group status
      }]);
    }
  };

  const toggleStar = (eventId: string) => {
    const currentStars = selectedEvents.filter(e => e.isStar).length;
    const target = selectedEvents.find(e => e.eventId === eventId);
    
    // Safety: General/Group events shouldn't be starred usually
    if (target?.category && target.category.toLowerCase().includes("general")) return;

    if (!target?.isStar && currentStars >= 8) {
       toast({ variant: "destructive", title: "Limit Reached", description: "Max 8 star items allowed!" });
       return;
    }
    setSelectedEvents(prev => prev.map(e => e.eventId === eventId ? { ...e, isStar: !e.isStar } : e));
  };

  const closeModal = () => {
    setIsRegOpen(false);
    setIsEditMode(false);
    setEditId("");
    setFormData({ name: "", team: user?.team || "", category: "Alpha" });
    setSelectedEvents([]);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(!confirm("Are you sure?")) return;
    try {
      await axios.post('/api/student/delete', { id });
      toast({ title: "Deleted", description: "Student removed." });
      fetchData(); 
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete student." });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!formData.name) return toast({ variant: "destructive", title: "Required", description: "Name is required." });
    
    setSubmitting(true);
    try {
      if (isEditMode) {
          await axios.post("/api/student/update", { id: editId, ...formData, selectedEvents });
          toast({ title: "Updated ✅", description: "Student updated successfully!" });
      } else {
          const autoChestNo = Math.floor(1000 + Math.random() * 9000).toString();
          await axios.post("/api/student/register", { 
             ...formData, 
             chestNo: autoChestNo,
             selectedEvents 
          });
          toast({ title: "Success ✅", description: "Student registered!" });
      }
      closeModal();
      fetchData(); 
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed", description: error.response?.data?.error || "Error" });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter events based on active tab & category
  const filteredEvents = events.filter(e => {
      // 1. Check Tab (Stage/Non-Stage)
      if (e.type !== activeRegTab) return false;

      // 2. Category Match
      if (e.category === formData.category) return true;
      if (formData.category === "Alpha" && e.category === "General-A") return true;
      if ((formData.category === "Beta" || formData.category === "Omega") && e.category === "General-B") return true;
      
      return false;
  });

  const starCount = selectedEvents.filter(e => e.isStar).length;
  const filteredStudents = activeCategory === "All" ? students : students.filter((s: any) => s.category === activeCategory);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-50">
          <h1 className="text-2xl font-black tracking-tight text-emerald-600">Optimus</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Team Portal</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold bg-emerald-600 text-white shadow-md shadow-emerald-200">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          
          {isSystemRegOpen ? (
              <button onClick={() => { setIsEditMode(false); setIsRegOpen(true); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50">
                <ClipboardList className="w-5 h-5" /> Registration
              </button>
          ) : (
              <div className="px-4 py-3 flex items-center gap-3 text-slate-300 text-sm font-semibold cursor-not-allowed">
                  <Lock className="w-5 h-5" /> Registration Closed
              </div>
          )}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button onClick={() => { logout(); router.push("/login"); }} className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-semibold text-red-500 hover:bg-red-50">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-64 p-6 md:p-10 flex flex-col min-h-screen">
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
                      {activeRegTab === "Non-Stage" && (<div className="flex items-center gap-1 bg-yellow-100 px-2 py-0.5 rounded text-[10px] font-black text-yellow-700 border border-yellow-200"><Star className="w-3 h-3 fill-current" />{starCount}/8 Stars Used</div>)}
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {filteredEvents.length > 0 ? filteredEvents.map(ev => {
                      const isSel = selectedEvents.find(s => s.eventId === ev._id);
                      const isGeneral = ev.category.toLowerCase().includes("general");
                      const isGroup = ev.groupEvent === true;

                      return (
                        <div key={ev._id} className={`flex justify-between items-center p-2 border rounded-md transition-all ${isSel ? 'bg-white border-purple-200 shadow-sm' : 'border-slate-100 hover:bg-slate-50'}`}>
                          <div className="flex items-center">
                              <span className="text-xs font-medium text-slate-700 truncate mr-2">{ev.name}</span>
                              
                              {/* ✅ BADGES: General / Group / Single */}
                              {isGeneral && <span className="text-[8px] bg-slate-800 text-white px-1 py-0.5 rounded font-bold uppercase mr-1">Gen</span>}
                              {isGroup ? (
                                <span className="text-[8px] bg-yellow-100 text-yellow-800 border border-yellow-200 px-1 py-0.5 rounded font-bold uppercase mr-1">Group</span>
                              ) : (
                                // Show "Single" badge if not group (and usually not general, but showing everywhere for clarity as requested)
                                <span className="text-[8px] bg-white text-slate-400 border border-slate-200 px-1 py-0.5 rounded font-bold uppercase flex items-center gap-0.5 mr-1"><User className="w-2 h-2" /> Single</span>
                              )}

                          </div>
                          <div className="flex gap-1">
                              {/* Star Button only for Non-Stage & Non-General */}
                              {isSel && activeRegTab === "Non-Stage" && !isGeneral && (
                                  <Button type="button" onClick={(e) => { e.stopPropagation(); toggleStar(ev._id); }} size="icon" variant="ghost" className={`h-7 w-7 rounded-full ${isSel.isStar ? 'text-yellow-500 bg-yellow-50 shadow-sm border border-yellow-200' : 'text-slate-300 hover:text-yellow-400'}`}><Star className={`w-3.5 h-3.5 ${isSel.isStar ? 'fill-current' : ''}`} /></Button>
                              )}
                              <Button type="button" onClick={() => toggleEvent(ev)} size="sm" variant={isSel ? "default" : "outline"} className={`h-7 px-3 rounded-md text-[10px] font-bold ${isSel ? 'bg-purple-600 text-white border-none' : 'text-slate-500 border-slate-200'}`}>{isSel ? <CheckCircle2 className="w-3.5 h-3.5" /> : "Add"}</Button>
                          </div>
                        </div>
                      )
                    }) : <div className="text-center py-4 text-slate-400 text-xs">No events available.</div>}
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
        
        {/* VIEW DETAILS MODAL */}
        {viewStudent && (
          <Dialog open={!!viewStudent} onOpenChange={(open) => !open && setViewStudent(null)}>
            <DialogContent className="max-w-md w-full p-0 border-none rounded-xl overflow-hidden bg-white" aria-describedby={undefined}>
                <div className="bg-slate-800 px-5 py-4 flex justify-between items-start text-white">
                  <div>
                    <DialogTitle className="text-lg font-bold">{viewStudent.name}</DialogTitle>
                    <p className="text-slate-300 text-xs">{viewStudent.team} | {viewStudent.category}</p>
                  </div>
                  <button onClick={() => setViewStudent(null)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
                </div>
                <div className="p-4 max-h-60 overflow-y-auto">
                    {viewStudent.registeredEvents?.map((e:any, idx:number) => {
                        const original = events.find(ev => ev._id === e.eventId);
                        const isGrp = original?.groupEvent === true;
                        return (
                          <div key={idx} className="border-b py-2 text-sm text-slate-700 flex justify-between items-center">
                              <div>
                                <span>{e.name}</span>
                                {isGrp && <span className="ml-2 text-[9px] bg-yellow-100 text-yellow-800 px-1 rounded uppercase font-bold">Group</span>}
                              </div>
                              {e.isStar && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded">Star</span>}
                          </div>
                        )
                    })}
                </div>
            </DialogContent>
          </Dialog>
        )}

      </main>
    </div>
  );
}
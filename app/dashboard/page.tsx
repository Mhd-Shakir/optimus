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
  Eye 
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

  const [events, setEvents] = useState([]);
  const [students, setStudents] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // Registration Modal State
  const [isRegOpen, setIsRegOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeRegTab, setActiveRegTab] = useState<"Stage" | "Non-Stage">("Stage");

  // Dashboard View State
  const [activeCategory, setActiveCategory] = useState("All"); // Default to "All"
  const [viewStudent, setViewStudent] = useState<any | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "", 
    team: "", 
    category: "Alpha"
  });
  const [selectedEvents, setSelectedEvents] = useState<any[]>([]);

  // Load Data
  useEffect(() => {
    if (user?.team) {
      setFormData(prev => ({ ...prev, team: user.team }));
      fetchData();
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
      // Filter for logged-in team
      const teamStudents = studentsRes.data.filter((s: any) => s.team === user?.team);
      setStudents(teamStudents);

    } catch (error) {
      console.error("Data load error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Event Selection
  const toggleEvent = (event: any) => {
    const exists = selectedEvents.find(e => e.eventId === event._id);
    if (exists) {
      setSelectedEvents(prev => prev.filter(e => e.eventId !== event._id));
    } else {
      setSelectedEvents(prev => [...prev, { 
        eventId: event._id, 
        name: event.name, 
        isStar: false, 
        type: event.type 
      }]);
    }
  };

  // Toggle Star Mark
  const toggleStar = (eventId: string) => {
    const currentStars = selectedEvents.filter(e => e.isStar).length;
    const target = selectedEvents.find(e => e.eventId === eventId);
    
    if (!target?.isStar && currentStars >= 8) {
       toast({ variant: "destructive", title: "Limit Reached", description: "Max 8 star items allowed!" });
       return;
    }
    
    setSelectedEvents(prev => prev.map(e => e.eventId === eventId ? { ...e, isStar: !e.isStar } : e));
  };

  // Delete Student
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(!confirm("Are you sure you want to delete this student?")) return;
    try {
      await axios.post('/api/student/delete', { id });
      toast({ title: "Deleted", description: "Student removed successfully." });
      fetchData(); 
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete student." });
    }
  };

  // Registration Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!formData.name) return toast({ variant: "destructive", title: "Required", description: "Student Name is required." });
    
    setSubmitting(true);
    try {
      const autoChestNo = Math.floor(1000 + Math.random() * 9000).toString();
      const payload = {
        name: formData.name,
        team: user?.team || formData.team,
        category: formData.category,
        chestNo: autoChestNo,
        selectedEvents: selectedEvents.map(e => ({
            eventId: e.eventId,
            name: e.name,
            type: e.type,
            isStar: e.isStar
        }))
      };

      await axios.post("/api/student/register", payload);
      toast({ title: "Success ✅", description: `${formData.name} registered successfully!` });
      setIsRegOpen(false);
      setFormData({ name: "", team: user?.team || "", category: "Alpha" });
      setSelectedEvents([]);
      fetchData(); 

    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Registration failed.";
      toast({ variant: "destructive", title: "Failed", description: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const starCount = selectedEvents.filter(e => e.isStar).length;
  
  // --- UPDATED FILTER LOGIC FOR "ALL" ---
  const filteredStudents = activeCategory === "All" 
    ? students 
    : students.filter((s: any) => s.category === activeCategory);

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
          <button onClick={() => setIsRegOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50">
            <ClipboardList className="w-5 h-5" /> Registration
          </button>
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button onClick={() => { logout(); router.push("/login"); }} className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-semibold text-red-500 hover:bg-red-50">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-64 p-6 md:p-10 flex flex-col min-h-screen">
        
        {/* TEAM HEADER */}
        <div className="flex flex-col items-center justify-center text-center space-y-4 mb-10 pt-10">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-xl ${user?.team === 'Auris' ? 'bg-yellow-500 shadow-yellow-100' : 'bg-blue-600 shadow-blue-100'}`}>
            {user?.team?.charAt(0)}
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Team {user?.team}</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
              Total Students: {students.length}
            </p>
          </div>
          
          <Button onClick={() => setIsRegOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-12 rounded-xl text-sm font-black shadow-lg shadow-emerald-100">
            <Plus className="w-4 h-4 mr-2" /> NEW REGISTRATION
          </Button>
        </div>

        {/* STUDENTS LIST SECTION */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-10">
          
          {/* Header & Tabs */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Registered Students</h3>
            </div>
            
            {/* Category Tabs (Added 'All') */}
            <div className="flex p-1 bg-slate-200/50 rounded-lg overflow-x-auto">
              {['All', 'Alpha', 'Beta', 'Omega'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${
                    activeCategory === cat 
                      ? "bg-white text-emerald-600 shadow-sm" 
                      : "text-slate-500 hover:text-emerald-600"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          {/* Table */}
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
              {loading ? (
                 <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="animate-spin w-6 h-6 mx-auto text-slate-300"/></TableCell></TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-32 text-center text-slate-400 text-sm font-medium">
                  No students found in {activeCategory === "All" ? "any category" : activeCategory}.
                </TableCell></TableRow>
              ) : (
                filteredStudents.map((student: any) => (
                  <TableRow 
                    key={student._id} 
                    className="hover:bg-slate-50 cursor-pointer group"
                    onClick={() => setViewStudent(student)} 
                  >
                    <td className="p-4 font-bold text-slate-700">{student.name}</td>
                    <td className="p-4">
                       <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{student.chestNo || "N/A"}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {student.registeredEvents?.length > 0 ? (
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                            {student.registeredEvents.length} Items
                          </span>
                        ) : <span className="text-xs text-slate-300">None</span>}
                        {student.registeredEvents?.some((e: any) => e.isStar) && (
                           <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-[10px] px-1.5">
                             {student.registeredEvents.filter((e:any) => e.isStar).length} ★
                           </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 group-hover:text-emerald-500 group-hover:bg-emerald-50">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={(e) => handleDelete(e, student._id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* --- MODAL 1: REGISTRATION (Existing) --- */}
        <Dialog open={isRegOpen} onOpenChange={setIsRegOpen}>
          <DialogContent className="max-w-xl w-full p-0 border-none shadow-2xl rounded-xl overflow-hidden bg-white">
            <div className="bg-emerald-600 px-5 py-3 flex justify-between items-center text-white shrink-0">
              <div>
                <DialogTitle className="text-lg font-bold text-white">Student Registration</DialogTitle>
                <p className="text-[10px] opacity-90">Assign events and stars.</p>
              </div>
              <button onClick={() => setIsRegOpen(false)} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
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
                      <p className="text-purple-700 font-bold text-[10px] uppercase">{activeRegTab} Items</p>
                      {activeRegTab === "Non-Stage" && (<div className="flex items-center gap-1 bg-yellow-100 px-2 py-0.5 rounded text-[10px] font-black text-yellow-700 border border-yellow-200"><Star className="w-3 h-3 fill-current" />{starCount}/8 Stars Used</div>)}
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {events.filter(e => e.type === activeRegTab).map(ev => {
                      const isSel = selectedEvents.find(s => s.eventId === ev._id);
                      return (
                        <div key={ev._id} className={`flex justify-between items-center p-2 border rounded-md transition-all ${isSel ? 'bg-white border-purple-200 shadow-sm' : 'border-slate-100 hover:bg-slate-50'}`}>
                          <span className="text-xs font-medium text-slate-700 truncate mr-2">{ev.name}</span>
                          <div className="flex gap-1">
                              {isSel && activeRegTab === "Non-Stage" && (
                                  <Button type="button" onClick={(e) => { e.stopPropagation(); toggleStar(ev._id); }} size="icon" variant="ghost" className={`h-7 w-7 rounded-full ${isSel.isStar ? 'text-yellow-500 bg-yellow-50 shadow-sm border border-yellow-200' : 'text-slate-300 hover:text-yellow-400'}`}><Star className={`w-3.5 h-3.5 ${isSel.isStar ? 'fill-current' : ''}`} /></Button>
                              )}
                              <Button type="button" onClick={() => toggleEvent(ev)} size="sm" variant={isSel ? "default" : "outline"} className={`h-7 px-3 rounded-md text-[10px] font-bold ${isSel ? 'bg-purple-600 text-white border-none' : 'text-slate-500 border-slate-200'}`}>{isSel ? <CheckCircle2 className="w-3.5 h-3.5" /> : "Add"}</Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex justify-between items-center gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setIsRegOpen(false)} className="text-slate-400 hover:text-slate-600 h-10 text-xs font-bold">Cancel</Button>
                  <Button type="submit" disabled={submitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 shadow-lg shadow-emerald-100 rounded-lg text-sm">
                    {submitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : "Complete Registration"}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* --- MODAL 2: VIEW DETAILS (Existing) --- */}
        {viewStudent && (
          <Dialog open={!!viewStudent} onOpenChange={(open) => !open && setViewStudent(null)}>
            <DialogContent className="max-w-md w-full p-0 border-none rounded-xl overflow-hidden bg-white">
              <div className="bg-slate-800 px-5 py-4 flex justify-between items-start text-white">
                <div>
                  <h3 className="text-xl font-bold">{viewStudent.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge className="bg-slate-700 hover:bg-slate-600 text-[10px] uppercase tracking-wider">{viewStudent.category}</Badge>
                    <Badge variant="outline" className="text-slate-300 border-slate-600 text-[10px]">Chest No: {viewStudent.chestNo}</Badge>
                  </div>
                </div>
                <button onClick={() => setViewStudent(null)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 max-h-[60vh] overflow-y-auto">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Registered Events</h4>
                
                {viewStudent.registeredEvents && viewStudent.registeredEvents.length > 0 ? (
                  <div className="space-y-2">
                    {viewStudent.registeredEvents.map((ev: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${ev.type === 'Stage' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                             {ev.type === 'Stage' ? <Mic className="w-3.5 h-3.5" /> : <PenTool className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{ev.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">{ev.type}</p>
                          </div>
                        </div>
                        {ev.isStar && (
                          <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-[10px] font-bold border border-yellow-200 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" /> Star
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-sm">No events registered yet.</p>
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-slate-50 border-t flex justify-end">
                 <Button variant="outline" size="sm" onClick={() => setViewStudent(null)}>Close</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

      </main>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Users, Search, Plus, Pencil, Trash2, Loader2, X, Star, CheckCircle2, Mic, PenTool, User 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ✅ HELPER: Normalize strings for fuzzy matching
const normalizeString = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "");

// 👇 RESTRICTED EVENTS (Normalized Names)
const RESTRICTED_LIMIT_EVENTS = [
  "qiraath", 
  "bookaliphs", 
  "alfiyarecitation", 
  "hadeesrecitation", 
  "paperpresentationenglish", // ✅ Fixed (Matches "Paper Presentation English")
  "idealdialogue", 
  "hifzulmuthoon", 
  "hiqaya", 
  "maashira", 
  "qiraathulibara", // ✅ Fixed (Matches "Qira'athul Ibara")
  "thadrees", 
  "poemlecturingmal", 
  "poemlecturingeng", 
  "poemlectureringenglish", 
  "poemlectureringmalayalam",
  "vlogmaking", 
  "hifz", 
  "azan"
];

export default function AdminRegistrations() {
  const { toast } = useToast();

  const [students, setStudents] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTeam, setFilterTeam] = useState("All");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({ name: "", team: "Auris", category: "Alpha" });
  const [selectedEvents, setSelectedEvents] = useState<any[]>([]);
  const [activeRegTab, setActiveRegTab] = useState<"Stage" | "Non-Stage">("Stage");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsRes, studentsRes] = await Promise.all([
        axios.get("/api/events"),
        axios.get("/api/student/list"),
      ]);
      setEvents(eventsRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student: any) => {
    setEditId(student._id);
    setFormData({ name: student.name, team: student.team, category: student.category });
    
    // Map existing events
    const mappedEvents = student.registeredEvents.map((ev: any) => {
        const original = events.find(e => e._id === ev.eventId);
        return {
            eventId: ev.eventId,
            name: ev.name || original?.name,
            isStar: ev.isStar,
            type: original?.type || "Stage",
            category: original?.category || "",
            groupEvent: original?.groupEvent || false,
            teamLimit: original?.teamLimit
        };
    });

    setSelectedEvents(mappedEvents);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    try {
        await axios.post("/api/student/delete", { id });
        toast({ title: "Deleted", description: "Student removed successfully" });
        fetchData();
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete" });
    }
  };

  // ✅ SYNCED LOGIC: Matches Team Dashboard Rules exactly
  const toggleEvent = (event: any) => {
    const exists = selectedEvents.find(e => e.eventId === event._id);
    
    if (exists) {
        // Remove Event
        setSelectedEvents(prev => prev.filter(e => e.eventId !== event._id));
    } else {
        // Add Event - LOGIC CHECKS
        const isGeneral = event.category.toLowerCase().includes("general");
        const isStage = event.type === "Stage";
        const isGroup = event.groupEvent === true;

        // ✅ SMART CHECK: Uses normalized string matching
        const eventNameNormalized = normalizeString(event.name);
        const isRestricted = RESTRICTED_LIMIT_EVENTS.includes(eventNameNormalized);

        // 1️⃣ TEAM LIMIT CHECK (Applies to Stage Events OR Restricted Non-Stage Events)
        if (event.teamLimit || (isStage && !isGroup) || isRestricted) {
            const limit = event.teamLimit || 3;
            
            // ✅ LOGIC: Count students in same TEAM AND same CATEGORY
            const count = students.filter(s => 
                s.team === formData.team && 
                s.category === formData.category && // <-- Counts only within the category
                s._id !== editId && 
                s.registeredEvents?.some((re: any) => re.eventId === event._id)
            ).length;

            if (count >= limit) {
                return toast({ 
                    variant: "destructive", 
                    title: "Team Limit Reached", 
                    description: `${formData.category} category already has ${limit} participants for ${event.name}.` 
                });
            }
        }

        // 2️⃣ INDIVIDUAL STUDENT LIMIT (Max 6 Stage Events)
        // Excludes Group events and General events from the count
        if (isStage && !isGroup && !isGeneral) {
            const currentStageCount = selectedEvents.filter(e => 
                e.type === "Stage" && 
                !e.groupEvent && 
                !e.category.toLowerCase().includes("general")
            ).length;

            if (currentStageCount >= 6) {
                return toast({ 
                    variant: "destructive", 
                    title: "Student Limit Reached", 
                    description: "Max 6 Individual Stage events allowed per student." 
                });
            }
        }

        // If all checks pass, Add Event
        setSelectedEvents(prev => [...prev, { 
            eventId: event._id, 
            name: event.name, 
            isStar: false, 
            type: event.type, 
            category: event.category, 
            groupEvent: event.groupEvent || false,
            teamLimit: event.teamLimit
        }]);
    }
  };

  // ✅ SYNCED STAR LOGIC
  const toggleStar = (id: string) => {
      const target = selectedEvents.find(e => e.eventId === id);
      if (!target) return;
      
      // General Category items cannot have stars
      if(target.category.toLowerCase().includes("general")) return;

      // 🚫 EXCEPTION: Omega Speech Translation - NO STAR
      const isSpeechTrans = normalizeString(target.name) === "speechtranslation" && target.category === "Omega";
      if (isSpeechTrans) {
          return toast({ variant: "destructive", title: "Action Not Allowed", description: "Speech Translation does not need a star." });
      }

      // Limit Rule
      const limit = formData.category === "Alpha" ? 6 : 8;
      const currentStars = selectedEvents.filter(e => e.isStar && e.type === "Non-Stage").length;

      if (!target.isStar && currentStars >= limit) {
          return toast({ variant: "destructive", title: "Limit Reached", description: `Max ${limit} stars allowed.` });
      }

      setSelectedEvents(prev => prev.map(e => e.eventId === id ? { ...e, isStar: !e.isStar } : e));
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
          const endpoint = isEditMode ? "/api/student/update" : "/api/student/register";
          const chestNo = isEditMode ? undefined : Math.floor(1000 + Math.random() * 9000).toString();
          
          await axios.post(endpoint, { ...formData, id: editId, chestNo, selectedEvents });
          
          toast({ title: "Success", description: isEditMode ? "Student updated" : "Student registered" });
          setIsModalOpen(false);
          fetchData();
      } catch (error: any) {
          toast({ variant: "destructive", title: "Error", description: error.response?.data?.error || "Operation failed" });
      } finally {
          setSubmitting(false);
      }
  };

  const closeModal = () => {
      setIsModalOpen(false);
      setIsEditMode(false);
      setFormData({ name: "", team: "Auris", category: "Alpha" });
      setSelectedEvents([]);
  };

  // Filtering
  const filteredStudents = students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.chestNo?.includes(searchTerm);
      const matchTeam = filterTeam === "All" || s.team === filterTeam;
      return matchSearch && matchTeam;
  });

  const regModalEvents = events.filter(e => {
      if (e.type !== activeRegTab) return false;
      if (e.category === formData.category) return true;
      if (formData.category === "Alpha" && e.category === "General-A") return true;
      if ((formData.category === "Beta" || formData.category === "Omega") && e.category === "General-B") return true;
      return false;
  });

  const starCount = selectedEvents.filter(e => e.isStar && e.type === "Non-Stage").length;
  const starLimit = formData.category === "Alpha" ? 6 : 8;

  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-50/50">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Registrations</h1>
            <p className="text-slate-500">Manage all student registrations here.</p>
        </div>
        <Button onClick={() => { setIsEditMode(false); setIsModalOpen(true); }} className="bg-slate-900 hover:bg-slate-800 text-white">
            <Plus className="w-4 h-4 mr-2" /> New Registration
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input placeholder="Search Student Name or Chest No..." className="pl-9 bg-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger className="w-[180px] bg-white"><SelectValue placeholder="Filter Team" /></SelectTrigger>
              <SelectContent>
                  <SelectItem value="All">All Teams</SelectItem>
                  <SelectItem value="Auris">Auris</SelectItem>
                  <SelectItem value="Libras">Libras</SelectItem>
              </SelectContent>
          </Select>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <Table>
              <TableHeader>
                  <TableRow className="bg-slate-50">
                      <TableHead>Name</TableHead>
                      <TableHead>Chest No</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Events</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {loading ? <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow> : 
                   filteredStudents.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center text-slate-500">No students found.</TableCell></TableRow> :
                   filteredStudents.map(student => (
                      <TableRow key={student._id}>
                          <TableCell className="font-bold">{student.name}</TableCell>
                          <TableCell><Badge variant="outline">{student.chestNo}</Badge></TableCell>
                          <TableCell>
                              <Badge className={student.team === "Auris" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}>
                                  {student.team}
                              </Badge>
                          </TableCell>
                          <TableCell>{student.category}</TableCell>
                          <TableCell>{student.registeredEvents.length} Items</TableCell>
                          <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                  <Button size="icon" variant="ghost" onClick={() => handleEdit(student)}><Pencil className="w-4 h-4 text-slate-500" /></Button>
                                  <Button size="icon" variant="ghost" onClick={() => handleDelete(student._id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                              </div>
                          </TableCell>
                      </TableRow>
                  ))}
              </TableBody>
          </Table>
      </div>

      {/* REGISTRATION MODAL */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogTitle>{isEditMode ? "Edit Student" : "New Registration"}</DialogTitle>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-slate-500">Student Name</label>
                          <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="e.g. John Doe" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-slate-500">Chest No</label>
                          <Input value={isEditMode ? "Auto-Generated" : "Auto-Generated"} disabled className="bg-slate-100" />
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-slate-500">Team</label>
                          <Select value={formData.team} onValueChange={val => setFormData({...formData, team: val})}>
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

                  {/* EVENT SELECTION */}
                  <div className="flex border rounded-lg overflow-hidden h-9 mt-4">
                      <button type="button" onClick={() => setActiveRegTab("Stage")} className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold transition-all ${activeRegTab === "Stage" ? "bg-purple-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50 border-r"}`}><Mic className="w-3 h-3" /> Stage</button>
                      <button type="button" onClick={() => setActiveRegTab("Non-Stage")} className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold transition-all ${activeRegTab === "Non-Stage" ? "bg-teal-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}><PenTool className="w-3 h-3" /> Non-Stage</button>
                  </div>

                  <div className="border border-purple-600 rounded-lg p-3 relative bg-purple-50/10">
                      <div className="flex justify-between items-center mb-2">
                          <p className="text-purple-700 font-bold text-[10px] uppercase">
                              {activeRegTab} Items <span className="ml-1 text-slate-400 font-normal">({selectedEvents.filter(e => e.type === activeRegTab).length})</span>
                          </p>
                          {activeRegTab === "Non-Stage" && <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200"><Star className="w-3 h-3 mr-1 fill-current" /> {starCount}/{starLimit} Stars Used</Badge>}
                      </div>
                      
                      <div className="h-48 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                          {regModalEvents.map(ev => {
                              const isSel = selectedEvents.find(s => s.eventId === ev._id);
                              // ✅ CHECK: Case-Insensitive Speech Translation
                              const isSpeechTrans = normalizeString(ev.name) === "speechtranslation" && ev.category === "Omega";
                              const isGeneral = ev.category.toLowerCase().includes("general");
                              const isGroup = ev.groupEvent === true;

                              return (
                                  <div key={ev._id} className={`flex justify-between items-center p-2 border rounded-md transition-all ${isSel ? 'bg-white border-purple-300 shadow-sm' : 'border-slate-100 hover:bg-slate-50'}`}>
                                      <div className="flex items-center gap-2 overflow-hidden">
                                          <span className="text-xs font-medium text-slate-700 truncate max-w-[150px]">{ev.name}</span>
                                          {isGeneral && <Badge className="text-[8px] h-4 px-1 bg-slate-800">Gen</Badge>}
                                          {ev.groupEvent ? <Badge className="text-[8px] h-4 px-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">Group</Badge> : <Badge variant="outline" className="text-[8px] h-4 px-1 text-slate-400"><User className="w-2 h-2 mr-0.5"/> Single</Badge>}
                                          {(ev.teamLimit || (!isGroup && ev.type === 'Stage')) && (
                                              <span className="text-[8px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 font-bold">Limit: {ev.teamLimit || 3}</span>
                                          )}
                                      </div>
                                      
                                      <div className="flex gap-1">
                                          {/* ✅ HIDE STAR BUTTON IF SPEECH TRANSLATION */}
                                          {isSel && activeRegTab === "Non-Stage" && !isGeneral && !isSpeechTrans && (
                                              <Button type="button" onClick={(e) => { e.stopPropagation(); toggleStar(ev._id); }} size="icon" variant="ghost" className={`h-7 w-7 rounded-full ${isSel.isStar ? 'text-yellow-500 bg-yellow-50 shadow-sm border border-yellow-200' : 'text-slate-300 hover:text-yellow-400'}`}><Star className={`w-3.5 h-3.5 ${isSel.isStar ? 'fill-current' : ''}`} /></Button>
                                          )}
                                          <Button type="button" onClick={() => toggleEvent(ev)} size="sm" variant={isSel ? "destructive" : "secondary"} className={`h-7 px-3 rounded-md text-[10px] font-bold ${isSel ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                              {isSel ? "Remove" : "Select"}
                                          </Button>
                                      </div>
                                  </div>
                              )
                          })}
                      </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                      <Button type="button" variant="ghost" onClick={closeModal} className="flex-1">Cancel</Button>
                      <Button type="submit" disabled={submitting} className="flex-1 bg-slate-900 text-white hover:bg-slate-800">
                          {submitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : "Complete Registration"}
                      </Button>
                  </div>

              </form>
          </DialogContent>
      </Dialog>
    </div>
  );
}
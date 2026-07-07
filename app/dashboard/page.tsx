"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  LayoutDashboard, ClipboardList, LogOut, Plus, Loader2, Mic, PenTool,
  CheckCircle2, X, Star, Users, Trash2, Pencil, Lock, User, Send, Search, ArrowLeft, Trophy, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const normalizeString = (str: string) => str ? str.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
const RESTRICTED_LIMIT_EVENTS = ["qiraath", "bookaliphs", "alfiyarecitation", "hadeesrecitation", "paperpresentationenglish", "idealdialogue", "hifzulmuthoon", "hiqaya", "maashira", "qiraathulibara", "thadrees", "poemlecturingmal", "poemlecturingeng", "poemlectureringenglish", "poemlectureringmalayalam", "vlogmaking", "hifz", "azan", "swarafdebate", "swarfdebate"];

export default function TeamDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [activeView, setActiveView] = useState("dashboard");
  const [events, setEvents] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isRegOpen, setIsRegOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeRegTab, setActiveRegTab] = useState<"Stage" | "Non-Stage">("Stage");
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewStudent, setViewStudent] = useState<any | null>(null);
  const [isSystemRegOpen, setIsSystemRegOpen] = useState(true);
  const [regSearchQuery, setRegSearchQuery] = useState("");



  const [formData, setFormData] = useState({ name: "", team: "", category: "Protons", studentClass: "" });
  const [selectedEvents, setSelectedEvents] = useState<any[]>([]);

  // ✅ UPDATED POINTS CALCULATION - Matches Admin Results Logic
  const getGradePoints = (grade: string, isGroup: boolean) => {
    if (isGroup) {
      if (grade === 'A+') return 15;
      if (grade === 'A') return 10;
      if (grade === 'B') return 5;
      if (grade === 'C') return 2;
      return 0;
    } else {
      if (grade === 'A+') return 6;
      if (grade === 'A') return 5;
      if (grade === 'B') return 3;
      if (grade === 'C') return 1;
      return 0;
    }
  };

  const getPoints = (grade: string, event: any, position: string) => {
    if (!event || !grade) return 0;

    const eventName = normalizeString(event?.name || "");

    const isGroupEvent = event.groupEvent === true ||
      eventName === "histoart" ||
      eventName === "dictionarymaking" ||
      eventName === "swarafdebate" ||
      eventName === "swarfdebate";

    const individualPointExceptions = [
      "speechtranslation",
      "dictionarymaking",
      "swarafdebate",
      "swarfdebate"
    ];

    const useGroupPoints = isGroupEvent && !individualPointExceptions.includes(eventName);
    const gradePoints = getGradePoints(grade, useGroupPoints);

    if (useGroupPoints) {
      // Group points: position + grade for top 3, grade-based for others
      if (position === 'first') return 10 + gradePoints;
      if (position === 'second') return 6 + gradePoints;
      if (position === 'third') return 3 + gradePoints;
      return gradePoints;
    } else {
      // Individual points: position + grade for top 3, grade-based for others
      if (position === 'first') return 5 + gradePoints;
      if (position === 'second') return 3 + gradePoints;
      if (position === 'third') return 1 + gradePoints;
      return gradePoints;
    }
  }

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

  const filteredStudents = activeCategory === "All" ? students : students.filter((s: any) => s.category === activeCategory);

  const downloadCategoryPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = (await import("jspdf-autotable")) as any;

    const doc = new jsPDF();
    const categoryName = activeCategory === "All" ? "All Categories" : `${activeCategory} Category`;

    doc.setFontSize(16);
    doc.text(`${user?.team} - ${categoryName} Report`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Total Students: ${filteredStudents.length}`, 14, 26);

    const tableBody = filteredStudents.map(s => [
      s.chestNo,
      s.name,
      s.category,
      s.registeredEvents.map((e: any) => e.name).join(", ")
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["Chest No", "Name", "Category", "Registered Events"]],
      body: tableBody,
      theme: "grid",
      headStyles: { fillColor: [147, 51, 234] },
      styles: { fontSize: 9 },
      columnStyles: { 3: { cellWidth: 80 } }
    });
    doc.save(`Team_${user?.team}_${activeCategory}_Report.pdf`);
  }

  // ✅ UPDATED: Get result with new points logic including "others" and array-based positions
  const getEventResult = (studentId: string, eventId: string) => {
    const event = events.find(e => e._id === eventId);
    if (!event || !event.results) return { rank: null, grade: null, points: 0, mark: null };

    const { first, second, third, others } = event.results;

    let grade = "";
    let rank = "";
    let mark = null;
    let position = "";

    // Handle new array format for first, second, third
    // Check first place (array or single value)
    if (Array.isArray(first)) {
      const firstIndex = first.findIndex((w: any) => w.studentId === studentId);
      if (firstIndex !== -1) {
        rank = first.length > 1 ? `1st(${firstIndex + 1})` : "1st";
        grade = first[firstIndex].grade;
        mark = first[firstIndex].mark;
        position = "first";
      }
    } else if (first === studentId) {
      // Old format compatibility
      rank = "1st";
      grade = event.results.firstGrade;
      mark = event.results.firstMark;
      position = "first";
    }

    // Check second place (array or single value)
    if (!grade && Array.isArray(second)) {
      const secondIndex = second.findIndex((w: any) => w.studentId === studentId);
      if (secondIndex !== -1) {
        rank = second.length > 1 ? `2nd(${secondIndex + 1})` : "2nd";
        grade = second[secondIndex].grade;
        mark = second[secondIndex].mark;
        position = "second";
      }
    } else if (!grade && second === studentId) {
      // Old format compatibility
      rank = "2nd";
      grade = event.results.secondGrade;
      mark = event.results.secondMark;
      position = "second";
    }

    // Check third place (array or single value)
    if (!grade && Array.isArray(third)) {
      const thirdIndex = third.findIndex((w: any) => w.studentId === studentId);
      if (thirdIndex !== -1) {
        rank = third.length > 1 ? `3rd(${thirdIndex + 1})` : "3rd";
        grade = third[thirdIndex].grade;
        mark = third[thirdIndex].mark;
        position = "third";
      }
    } else if (!grade && third === studentId) {
      // Old format compatibility
      rank = "3rd";
      grade = event.results.thirdGrade;
      mark = event.results.thirdMark;
      position = "third";
    }

    // Check others
    if (!grade && others && Array.isArray(others)) {
      const otherEntry = others.find((o: any) => o.studentId === studentId);
      if (otherEntry) {
        grade = otherEntry.grade;
        mark = otherEntry.mark;
        position = "other";
      }
    }

    if (!grade) return { rank: null, grade: null, points: 0, mark: null };

    const points = getPoints(grade, event, position);

    return { rank, grade, points, mark };
  };

  const calculateTotalPoints = (student: any) => {
    let total = 0;
    student.registeredEvents.forEach((reg: any) => {
      const { points } = getEventResult(student._id, reg.eventId);
      total += points;
    });
    return total;
  };



  const handleEdit = (e: any, s: any) => { e.stopPropagation(); if (!isSystemRegOpen) return toast({ variant: "destructive", title: "Closed", description: "Registration closed." }); setEditId(s._id); setFormData({ name: s.name, team: s.team, category: s.category }); const mapped = s.registeredEvents.map((ev: any) => { const orig = events.find(x => x._id === ev.eventId); return { eventId: ev.eventId, name: ev.name || orig?.name, type: orig?.type || "Stage", isStar: ev.isStar, category: orig?.category || "", groupEvent: orig?.groupEvent || false, teamLimit: orig?.teamLimit } }); setSelectedEvents(mapped); setIsEditMode(true); setIsRegOpen(true); };

  const toggleEvent = (event: any) => {
    const exists = selectedEvents.find(e => e.eventId === event._id);
    if (exists) { setSelectedEvents(prev => prev.filter(e => e.eventId !== event._id)); } else {
      const isGeneral = event.category.toLowerCase().includes("general"); const isStage = event.type === "Stage";
      const eventName = normalizeString(event.name);
      const isGroup = event.groupEvent === true || eventName === "histoart" || eventName === "dictionarymaking" || eventName === "swarafdebate" || eventName === "swarfdebate" || (eventName === "essay" && event.category === "Nexus");
      const isRestricted = RESTRICTED_LIMIT_EVENTS.includes(eventName);
      if (event.teamLimit || (isStage && !isGroup) || isRestricted) {
        const limit = event.teamLimit || 3;
        const count = students.filter(s => s.team === formData.team && s.category === formData.category && s._id !== editId && s.registeredEvents?.some((re: any) => re.eventId === event._id)).length;
        if (count >= limit) { return toast({ variant: "destructive", title: "Limit Reached", description: `${formData.category} category already has ${limit} participants.` }); }
      }
      if (isStage && !isGroup && !isGeneral) {
        const maxStageEvents = formData.category === "Protons" ? 4 : 6;
        if (selectedEvents.filter(e => { const nName = normalizeString(e.name); const eIsGrp = e.groupEvent === true || nName === "histoart" || nName === "dictionarymaking" || nName === "swarafdebate" || nName === "swarfdebate" || (nName === "essay" && e.category === "Nexus"); return e.type === "Stage" && !eIsGrp && !e.category.toLowerCase().includes("general") }).length >= maxStageEvents) return toast({ variant: "destructive", title: "Limit Reached", description: `Max ${maxStageEvents} Individual Stage events for ${formData.category}.` });
      }
      setSelectedEvents(prev => [...prev, { eventId: event._id, name: event.name, isStar: false, type: event.type, category: event.category, groupEvent: isGroup, teamLimit: event.teamLimit }]);
    }
  };

  const toggleStar = (id: string) => {
    const target = selectedEvents.find(e => e.eventId === id); if (!target) return; if (target.category.toLowerCase().includes("general")) return;
    const name = normalizeString(target.name);
    if (name === "speechtranslation" || name === "dictionarymaking" || name === "swarafdebate" || name === "swarfdebate") { return toast({ variant: "destructive", title: "No Star Needed", description: "No star required." }); }
    const limit = formData.category === "Protons" ? 6 : 9; const currentStars = selectedEvents.filter(e => e.isStar && e.type === "Non-Stage").length;
    if (!target.isStar && currentStars >= limit) { return toast({ variant: "destructive", title: "Limit Reached", description: `Max ${limit} stars allowed.` }); }
    setSelectedEvents(prev => prev.map(e => e.eventId === id ? { ...e, isStar: !e.isStar } : e));
  };

  const closeModal = () => { setIsRegOpen(false); setIsEditMode(false); setEditId(""); setFormData({ name: "", team: user?.team || "", category: "Protons", studentClass: "" }); setSelectedEvents([]); setRegSearchQuery(""); };
  const handleDelete = async (e: any, id: string) => { 
    e.stopPropagation(); 
    try {
      await axios.post('/api/student/delete', { id });
      toast({ title: "Student Deleted", description: "The student has been successfully removed." });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete student." });
    }
  };
  const handleRegister = async (e: any) => { e.preventDefault(); if (!formData.name) return toast({ variant: "destructive", title: "Missing Field", description: "Name is required." }); if (!formData.studentClass) return toast({ variant: "destructive", title: "Missing Field", description: "Class is required." }); setSubmitting(true); try { await axios.post(isEditMode ? "/api/student/update" : "/api/student/register", { ...formData, id: editId, chestNo: Math.floor(1000 + Math.random() * 9000).toString(), selectedEvents }); toast({ title: "Success" }); closeModal(); fetchData(); } catch (err: any) { toast({ variant: "destructive", title: "Error", description: err.response?.data?.error }); } finally { setSubmitting(false); } };

  const regModalEvents = events.filter(e => {
    if (e.type !== activeRegTab) return false;
    let categoryMatch = false;
    if (e.category === formData.category) categoryMatch = true;
    
    if (e.category === "General-A" && ["8", "9", "10"].includes(formData.studentClass)) categoryMatch = true;
    if (e.category === "General-B" && ["HS1", "HS2", "BS1", "BS2", "BS3", "BS4", "BS5"].includes(formData.studentClass)) categoryMatch = true;
    
    if (!formData.studentClass) {
        if (formData.category === "Protons" && e.category === "General-A") categoryMatch = true; 
        if (formData.category === "Nexus" && (e.category === "General-A" || e.category === "General-B")) categoryMatch = true;
        if (formData.category === "Cosmos" && e.category === "General-B") categoryMatch = true;
    }
    if (!categoryMatch) return false;
    if (regSearchQuery && !e.name.toLowerCase().includes(regSearchQuery.toLowerCase())) return false;
    return true;
  });
  const starCount = selectedEvents.filter(e => e.isStar && e.type === "Non-Stage").length; const starLimit = formData.category === "Protons" ? 6 : 9;

  return (
    <div className="flex h-[100dvh] w-full bg-slate-50 font-sans overflow-hidden">
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col h-full z-20 shrink-0">
        <div className="p-6 border-b border-slate-50"><h1 className="text-2xl font-black text-emerald-600">Optimus</h1><p className="text-[10px] text-slate-400 font-bold uppercase">Team Portal</p></div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          <button onClick={() => setActiveView("dashboard")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeView === "dashboard" ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "text-slate-500 hover:bg-slate-50"}`}><LayoutDashboard className="w-5 h-5" /> Dashboard</button>
          {isSystemRegOpen && <button onClick={() => { setIsEditMode(false); setIsRegOpen(true); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-slate-500 hover:bg-slate-50"><ClipboardList className="w-5 h-5" /> Registration</button>}
        </nav>
        <div className="p-4 border-t border-slate-100"><button onClick={() => { logout(); router.push("/login"); }} className="flex items-center gap-3 px-4 py-3 text-red-500 font-bold text-sm"><LogOut className="w-5 h-5" /> Logout</button></div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-6 custom-scrollbar">
            <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8 pt-2 md:pt-4">
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center text-white text-2xl md:text-3xl font-black shadow-xl ${user?.team === 'Team A' ? 'bg-yellow-500 shadow-yellow-100' : 'bg-blue-600 shadow-blue-100'}`}>{user?.team?.split(' ')[1] || user?.team?.charAt(0)}</div>
              <div><h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">{user?.team}</h2><p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Total Students: {students.length}</p></div>
              {isSystemRegOpen ? (<Button onClick={() => { setIsEditMode(false); setIsRegOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-12 rounded-xl text-sm font-black shadow-lg shadow-emerald-100 w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" /> NEW REGISTRATION</Button>) : (<div className="flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 px-6 py-3 rounded-xl font-bold text-sm shadow-sm w-full sm:w-auto"><Lock className="w-4 h-4" /> REGISTRATION CLOSED</div>)}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-10">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-500" /><h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Registered Students</h3></div>
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-hidden">
                  <div className="flex p-1 bg-slate-200/50 rounded-lg overflow-x-auto w-full no-scrollbar">{['All', 'Protons', 'Nexus', 'Cosmos'].map((cat) => (<button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${activeCategory === cat ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-emerald-600"}`}>{cat}</button>))}</div>
                </div>
              </div>
              <div className="overflow-x-auto w-full">
                <Table className="min-w-[600px]">
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Chest No</TableHead><TableHead>Events</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="animate-spin w-6 h-6 mx-auto text-slate-300" /></TableCell></TableRow> : filteredStudents.length === 0 ? <TableRow><TableCell colSpan={4} className="h-32 text-center text-slate-400">No students found.</TableCell></TableRow> : filteredStudents.map((student: any) => (
                    <TableRow key={student._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setViewStudent(student)}>
                      <td className="p-4 font-bold text-slate-700">{student.name}</td>
                      <td className="p-4"><span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{student.chestNo || "N/A"}</span></td>
                      <td className="p-4"><div className="flex flex-wrap gap-1">{student.registeredEvents?.length > 0 ? <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{student.registeredEvents.length} Items</span> : <span className="text-xs text-slate-300">None</span>}{student.registeredEvents?.some((e: any) => e.isStar) && <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-[10px] px-1.5">{student.registeredEvents.filter((e: any) => e.isStar).length} ★</Badge>}</div></td>
                      <td className="p-4 text-right"><div className="flex justify-end gap-2"><Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:text-blue-500" onClick={(e) => handleEdit(e, student)}><Pencil className="w-4 h-4" /></Button><Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:text-red-500" onClick={(e) => handleDelete(e, student._id)}><Trash2 className="w-4 h-4" /></Button></div></td>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            </div>

        <Dialog open={isRegOpen} onOpenChange={closeModal}>
          <DialogContent className="max-w-xl p-0 border-none shadow-2xl rounded-xl overflow-hidden bg-white">
            <div className="bg-emerald-600 px-5 py-3 flex justify-between items-center text-white shrink-0">
              <div><DialogTitle className="text-lg font-bold text-white">{isEditMode ? "Edit Student" : "Student Registration"}</DialogTitle><p className="text-[10px] opacity-90">Assign events and stars.</p></div>
            </div>
            <form onSubmit={handleRegister}>
              <div className="p-4 md:p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 border border-slate-100 bg-slate-50/50 p-3 rounded-lg">
                  <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Name <span className="text-red-500">*</span></label><Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Student Name" className="h-9 text-sm" /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Team <span className="text-red-500">*</span></label><div className="h-9 px-3 flex items-center bg-slate-200 text-slate-600 text-sm font-bold rounded-md border border-slate-300 cursor-not-allowed">{user?.team || "Loading..."}</div></div>
                  <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Category <span className="text-red-500">*</span></label><Select value={formData.category} onValueChange={val => setFormData({ ...formData, category: val, studentClass: "" })}><SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Protons">Protons</SelectItem><SelectItem value="Nexus">Nexus</SelectItem><SelectItem value="Cosmos">Cosmos</SelectItem></SelectContent></Select></div>
                  <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Class <span className="text-red-500">*</span></label><Select value={formData.studentClass} onValueChange={val => setFormData({ ...formData, studentClass: val })}><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{(formData.category === "Protons" ? ['8', '9'] : formData.category === "Nexus" ? ['10', 'HS1', 'HS2', 'BS1'] : formData.category === "Cosmos" ? ['BS2', 'BS3', 'BS4', 'BS5'] : formData.category === "General-A" ? ['8', '9', '10'] : formData.category === "General-B" ? ['HS1', 'HS2', 'BS1', 'BS2', 'BS3', 'BS4', 'BS5'] : []).map(cls => (<SelectItem key={cls} value={cls}>{cls}</SelectItem>))}</SelectContent></Select></div>
                </div>
                <div className="flex border rounded-lg overflow-hidden h-9">
                  <button type="button" onClick={() => setActiveRegTab("Stage")} className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold transition-all ${activeRegTab === "Stage" ? "bg-purple-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50 border-r"}`}><Mic className="w-3 h-3" /> Stage</button>
                  <button type="button" onClick={() => setActiveRegTab("Non-Stage")} className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold transition-all ${activeRegTab === "Non-Stage" ? "bg-white border-l shadow-inner" : "bg-white text-slate-500 hover:bg-slate-50"}`}><PenTool className="w-3 h-3" /> Non-Stage</button>
                </div>
                <div className="border border-purple-600 rounded-lg p-3 relative bg-purple-50/10">
                  <div className="flex justify-between items-center mb-2"><p className="text-purple-700 font-bold text-[10px] uppercase">{activeRegTab} Items<span className="ml-2 text-slate-400 font-normal">(Selected: {selectedEvents.filter(e => e.type === activeRegTab).length})</span></p>{activeRegTab === "Non-Stage" && (<div className="flex items-center gap-1 bg-yellow-100 px-2 py-0.5 rounded text-[10px] font-black text-yellow-700 border border-yellow-200"><Star className="w-3 h-3 fill-current" />{starCount}/{starLimit} Stars Used</div>)}</div>

                  <div className="relative mb-2">
                    <Search className="absolute left-2 top-2 h-3 w-3 text-slate-400" />
                    <Input placeholder="Search events..." className="pl-7 h-7 text-xs bg-white border-slate-200" value={regSearchQuery} onChange={(e) => setRegSearchQuery(e.target.value)} />
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {regModalEvents.map(ev => {
                      const isSel = selectedEvents.find(s => s.eventId === ev._id);
                      const isSpeechTrans = normalizeString(ev.name) === "speechtranslation" && ev.category === "Cosmos";
                      const isGeneral = ev.category.toLowerCase().includes("general");
                      const isGroup = ev.groupEvent === true || normalizeString(ev.name) === "histoart" || normalizeString(ev.name) === "dictionarymaking" || normalizeString(ev.name) === "swarafdebate" || normalizeString(ev.name) === "swarfdebate" || (normalizeString(ev.name) === "essay" && ev.category === "Nexus");
                      return (
                        <div key={ev._id} className={`flex justify-between items-center p-2 border rounded-md transition-all ${isSel ? 'bg-white border-purple-200 shadow-sm' : 'border-slate-100 hover:bg-slate-50'}`}>
                          <div className="flex items-center"><span className="text-xs font-medium text-slate-700 truncate mr-2">{ev.name}</span>{isGeneral && <span className="text-[8px] bg-slate-800 text-white px-1 py-0.5 rounded font-bold uppercase mr-1">Gen</span>}{isGroup ? (<span className="text-[8px] bg-yellow-100 text-yellow-800 border border-yellow-200 px-1 py-0.5 rounded font-bold uppercase mr-1">Group</span>) : (<span className="text-[8px] bg-white text-slate-400 border border-slate-200 px-1 py-0.5 rounded font-bold uppercase flex items-center gap-0.5 mr-1"><User className="w-2 h-2" /> Single</span>)}{(ev.teamLimit || (!isGroup && ev.type === 'Stage')) && (<span className="text-[8px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 font-bold">Limit: {ev.teamLimit || 3}</span>)}</div>
                          <div className="flex gap-1">{isSel && activeRegTab === "Non-Stage" && !isGeneral && !isSpeechTrans && (<Button type="button" onClick={(e) => { e.stopPropagation(); toggleStar(ev._id); }} size="icon" variant="ghost" className={`h-7 w-7 rounded-full ${isSel.isStar ? 'text-yellow-500 bg-yellow-50 shadow-sm border border-yellow-200' : 'text-slate-300 hover:text-yellow-400'}`}><Star className={`w-3.5 h-3.5 ${isSel.isStar ? 'fill-current' : ''}`} /></Button>)}<Button type="button" onClick={() => toggleEvent(ev)} size="sm" variant={isSel ? "default" : "outline"} className={`h-7 px-3 rounded-md text-[10px] font-bold ${isSel ? 'bg-purple-600 text-white border-none' : 'text-slate-500 border-slate-200'}`}>{isSel ? <CheckCircle2 className="w-3.5 h-3.5" /> : "Add"}</Button></div>
                        </div>
                      )
                    })}
                    {regModalEvents.length === 0 && <div className="text-center py-4 text-slate-400 text-xs">No events found.</div>}
                  </div>
                </div>
                <div className="flex justify-between items-center gap-3 pt-2"><Button type="button" variant="ghost" onClick={closeModal} className="text-slate-400 hover:text-slate-600 h-10 text-xs font-bold">Cancel</Button><Button type="submit" disabled={submitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 shadow-lg shadow-emerald-100 rounded-lg text-sm">{submitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : (isEditMode ? "Update Student" : "Complete Registration")}</Button></div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {viewStudent && (
          <Dialog open={!!viewStudent} onOpenChange={(open) => !open && setViewStudent(null)}>
            <DialogContent className="max-w-md w-full p-0 border-none rounded-xl overflow-hidden bg-white">
              <div className="bg-slate-800 px-5 py-6 flex justify-between items-start text-white relative overflow-hidden">
                <div className="relative z-10"><DialogTitle className="text-2xl font-black tracking-tight">{viewStudent.name}</DialogTitle><p className="text-slate-300 text-xs font-bold mt-1 uppercase tracking-wide opacity-80">{viewStudent.team} | {viewStudent.category} | {viewStudent.chestNo}</p></div>
                
                <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy className="w-32 h-32 text-white" /></div><button onClick={() => setViewStudent(null)} className="absolute top-2 right-2 p-2 text-white/50 hover:text-white z-20"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-0 max-h-[60vh] overflow-y-auto bg-slate-50">{viewStudent.registeredEvents?.length === 0 ? (<div className="p-8 text-center text-slate-400 text-sm">No events registered.</div>) : (<div className="divide-y divide-slate-100">{viewStudent.registeredEvents?.map((e: any, idx: number) => { const { rank, grade, points, mark } = getEventResult(viewStudent._id, e.eventId); const original = events.find(ev => ev._id === e.eventId); const isGrp = original?.groupEvent === true; return (<div key={idx} className="px-5 py-3 bg-white flex justify-between items-center hover:bg-slate-50 transition-colors"><div className="flex-1 pr-4"><div className="flex items-center gap-2"><span className="text-sm font-bold text-slate-800">{e.name || original?.name || "Unknown Event"}</span>{isGrp && <span className="text-[9px] bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded uppercase font-bold border border-yellow-200">Group</span>}</div><div className="flex items-center gap-2 mt-1">{e.status === 'sent' && <Badge variant="outline" className="text-[9px] h-4 px-1 text-yellow-600 border-yellow-300 bg-yellow-50">Sent to Stage</Badge>}{e.status === 'reported' && <Badge variant="outline" className="text-[9px] h-4 px-1 text-emerald-600 border-emerald-300 bg-emerald-50">Completed</Badge>}{e.isStar && <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"><Star className="w-2 h-2 fill-current" /> Star</span>}</div></div><div className="text-right min-w-[80px]">{grade ? (<div><div className="text-lg font-black text-slate-900">{grade}{mark && <span className="text-xs text-slate-500 ml-1">({mark})</span>}</div><div className="text-[10px] font-bold text-emerald-600">+{points} pts</div></div>) : (<span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Pending</span>)}</div></div>) })}</div>)}</div>
            </DialogContent>
          </Dialog>
        )}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden shrink-0 w-full bg-white border-t border-slate-200 flex justify-around items-center p-2 pb-4 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.1)] z-30">
          <button onClick={() => setActiveView("dashboard")} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${activeView === "dashboard" ? "text-emerald-600" : "text-slate-400"}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-bold">Dashboard</span>
          </button>
          {isSystemRegOpen && (
            <button onClick={() => { setIsEditMode(false); setIsRegOpen(true); }} className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-slate-400 hover:text-emerald-600">
              <ClipboardList className="w-5 h-5" />
              <span className="text-[10px] font-bold">Register</span>
            </button>
          )}
          <button onClick={() => { logout(); router.push("/login"); }} className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-slate-400 hover:text-red-500">
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] font-bold">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
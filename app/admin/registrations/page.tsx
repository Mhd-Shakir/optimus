"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Users, Search, Plus, Pencil, Trash2, Loader2, X, Star, CheckCircle2, Mic, PenTool, User, Download 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ✅ HELPER: Normalize strings
const normalizeString = (str: string) => {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
};

// 👇 RESTRICTED EVENTS (Updated with 'swarfdebate')
const RESTRICTED_LIMIT_EVENTS = [
  "qiraath", 
  "bookaliphs", 
  "alfiyarecitation", 
  "hadeesrecitation", 
  "paperpresentationenglish", 
  "idealdialogue", 
  "hifzulmuthoon", 
  "hiqaya", 
  "maashira", 
  "qiraathulibara", 
  "thadrees", 
  "poemlecturingmal", 
  "poemlecturingeng", 
  "poemlectureringenglish", 
  "poemlectureringmalayalam",
  "vlogmaking", 
  "hifz", 
  "azan",
  "swarafdebate", 
  "swarfdebate"
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
  const [formData, setFormData] = useState({ name: "", team: "Ignis", category: "Protons", studentClass: "" });
  const [selectedEvents, setSelectedEvents] = useState<any[]>([]);
  const [activeRegTab, setActiveRegTab] = useState<"Stage" | "Non-Stage">("Stage");
  const [activeRegView, setActiveRegView] = useState<"Individual" | "Group">("Individual");
  
  // 🔥 NEW: Search State for Registration Modal
  const [regSearchQuery, setRegSearchQuery] = useState("");

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

        const eventNameNormalized = normalizeString(event.name);
        // ✅ Updated Group Logic for Swarf Debate
        const isSpecialGroup = event.groupEvent === true || 
                        eventNameNormalized === "histoart" || 
                        eventNameNormalized === "dictionarymaking" || 
                        eventNameNormalized === "swarafdebate" || 
                        eventNameNormalized === "swarfdebate" ||
                        (eventNameNormalized === "essay" && event.category === "Nexus"); 

        const isRestricted = RESTRICTED_LIMIT_EVENTS.includes(eventNameNormalized);

        // 1️⃣ TEAM LIMIT CHECK (Applies to Stage Events OR Restricted Non-Stage Events)
        if (event.teamLimit || (isStage && !isSpecialGroup) || isRestricted) {
            const limit = event.teamLimit || 3;
            
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

        // 2️⃣ INDIVIDUAL STUDENT LIMIT (Max 4 for Protons, 6 for others)
        // Excludes Group events and General events from the count
        if (isStage && !isSpecialGroup && !isGeneral) {
            const maxStageEvents = formData.category === "Protons" ? 4 : 6;
            const currentStageCount = selectedEvents.filter(e => {
                const nName = normalizeString(e.name);
                const eIsGrp = e.groupEvent === true || nName === "histoart" || nName === "dictionarymaking" || nName === "swarafdebate" || nName === "swarfdebate" || (nName === "essay" && e.category === "Nexus");
                return e.type === "Stage" && !eIsGrp && !e.category.toLowerCase().includes("general")
            }).length;

            if (currentStageCount >= maxStageEvents) {
                return toast({ 
                    variant: "destructive", 
                    title: "Student Limit Reached", 
                    description: `Max ${maxStageEvents} Individual Stage events allowed for ${formData.category}.` 
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
            groupEvent: isSpecialGroup,
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

      const name = normalizeString(target.name);
      
      // 🚫 Block Stars for Special Events
      if (name === "speechtranslation" || name === "dictionarymaking" || name === "swarafdebate" || name === "swarfdebate") {
          return toast({ variant: "destructive", title: "Action Not Allowed", description: "This event does not need a star." });
      }

      // Limit Rule
      const limit = formData.category === "Protons" ? 6 : 8;
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
      setFormData({ name: "", team: "Ignis", category: "Protons", studentClass: "" });
      setSelectedEvents([]);
      setRegSearchQuery(""); // Clear search
  };

  const downloadTeamCallListPDF = async () => {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = (await import("jspdf-autotable")) as any;
      
      const doc = new jsPDF();
      
      // Get unique teams based on current filter
      let teams = Array.from(new Set(students.map(s => s.team))).filter(Boolean);
      if (filterTeam !== "All") {
          teams = [filterTeam];
      }
      
      const categoryOrder = ["Protons", "Nexus", "Cosmos"];
      
      let isFirstPage = true;

      teams.forEach((team) => {
          if (!isFirstPage) doc.addPage();
          isFirstPage = false;
          
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text(`Team Call List - ${team}`, 14, 20);
          
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 26);
          
          let currentY = 35;

          categoryOrder.forEach(category => {
              // Get students for this team and category
              const teamCategoryStudents = students.filter(s => s.team === team && s.category === category);
              
              if (teamCategoryStudents.length === 0) return;

              // Build rows: Competition | Chest No | Participant
              const tableRows: any[] = [];
              teamCategoryStudents.forEach(student => {
                  student.registeredEvents?.forEach((re: any) => {
                      const eventDetails = events.find(ev => ev._id === re.eventId);
                      tableRows.push({
                          competition: eventDetails?.name || "Unknown Event",
                          chestNo: student.chestNo,
                          participant: student.name
                      });
                  });
              });

              // Sort by Competition name alphabetically
              tableRows.sort((a, b) => a.competition.localeCompare(b.competition));
              
              const body = tableRows.map(row => [row.competition, row.chestNo, row.participant]);

              if (body.length > 0) {
                  doc.setFontSize(12);
                  doc.setFont("helvetica", "bold");
                  doc.text(`${category} (${body.length})`, 14, currentY);
                  
                  autoTable(doc, {
                      startY: currentY + 4,
                      head: [["Competition", "Chest No", "Participant"]],
                      body: body,
                      theme: "grid",
                      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
                      styles: { fontSize: 9, cellPadding: 3, textColor: [0, 0, 0] },
                      margin: { left: 14, right: 14 }
                  });
                  
                  currentY = (doc as any).lastAutoTable.finalY + 15;
                  
                  // If page is getting full, add a new page
                  if (currentY > 260) {
                      doc.addPage();
                      currentY = 20;
                  }
              }
          });
      });
      
      doc.save(`Team_Call_List.pdf`);
      toast({ title: "Downloaded", description: "Team Call List generated successfully." });
  };

  // Filtering
  const filteredStudents = students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.chestNo?.includes(searchTerm);
      const matchTeam = filterTeam === "All" || s.team === filterTeam;
      return matchSearch && matchTeam;
  });

  const regModalEvents = events.filter(e => {
      // 1. Filter by Type (Stage/Non-Stage)
      if (e.type !== activeRegTab) return false;
      
      // 2. Filter by Category
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

      // 3. Filter by Search Query
      if (regSearchQuery && !e.name.toLowerCase().includes(regSearchQuery.toLowerCase())) {
          return false;
      }

      return true;
  });

  const starCount = selectedEvents.filter(e => e.isStar && e.type === "Non-Stage").length;
  const starLimit = formData.category === "Protons" ? 6 : 8;

  const groupRegistrations = events
      .filter(e => e.groupEvent === true || normalizeString(e.name) === "histoart" || normalizeString(e.name) === "dictionarymaking" || normalizeString(e.name) === "swarafdebate" || normalizeString(e.name) === "swarfdebate")
      .flatMap(event => {
          const teams = ["Ignis", "Ventus"];
          return teams.map(team => {
              const participants = students.filter(s => s.team === team && s.registeredEvents?.some((re: any) => re.eventId === event._id));
              return { event, team, participants };
          });
      })
      .filter(g => g.participants.length > 0)
      .filter(g => filterTeam === "All" || g.team === filterTeam)
      .filter(g => g.event.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-6 space-y-6 min-h-screen bg-slate-50/50">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Registrations</h1>
            <p className="text-slate-500">Manage all student registrations here.</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={downloadTeamCallListPDF} variant="outline" className="border-slate-300">
                <Download className="w-4 h-4 mr-2" /> Team Call List PDF
            </Button>
            <Button onClick={() => { setIsEditMode(false); setIsModalOpen(true); }} className="bg-slate-900 hover:bg-slate-800 text-white">
                <Plus className="w-4 h-4 mr-2" /> New Registration
            </Button>
        </div>
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
                  <SelectItem value="Ignis">Ignis</SelectItem>
                  <SelectItem value="Ventus">Ventus</SelectItem>
              </SelectContent>
          </Select>
      </div>

      <div className="flex bg-white rounded-lg p-1 border shadow-sm w-full md:w-64 mb-4">
        <button onClick={() => setActiveRegView("Individual")} className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${activeRegView === "Individual" ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:bg-slate-50"}`}>Individual</button>
        <button onClick={() => setActiveRegView("Group")} className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${activeRegView === "Group" ? "bg-purple-600 text-white shadow" : "text-slate-500 hover:bg-slate-50"}`}>Groups</button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto w-full">
            {activeRegView === "Individual" ? (
              <Table className="min-w-[800px]">
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
                                <Badge className={student.team === "Ignis" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}>
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
            ) : (
              <Table className="min-w-[800px]">
                <TableHeader>
                    <TableRow className="bg-slate-50">
                        <TableHead>Event</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Participants</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? <TableRow><TableCell colSpan={4} className="h-24 text-center"><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow> : 
                     groupRegistrations.length === 0 ? <TableRow><TableCell colSpan={4} className="h-24 text-center text-slate-500">No groups found.</TableCell></TableRow> :
                     groupRegistrations.map((group, idx) => (
                        <TableRow key={idx}>
                            <TableCell className="font-bold">{group.event.name}</TableCell>
                            <TableCell>
                                <Badge className={group.team === "Ignis" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}>
                                    {group.team}
                                </Badge>
                            </TableCell>
                            <TableCell>{group.event.category}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {group.participants.map((p: any) => (
                                  <Badge key={p._id} variant="outline" className="text-[10px] bg-slate-50">{p.name}</Badge>
                                ))}
                              </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </div>
      </div>

      {/* REGISTRATION MODAL */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogTitle>{isEditMode ? "Edit Student" : "New Registration"}</DialogTitle>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-slate-500">Student Name</label>
                          <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="e.g. John Doe" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-slate-500">Chest No</label>
                          <Input value={isEditMode ? "Auto-Generated" : "Auto-Generated"} disabled className="bg-slate-100" />
                      </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-slate-500">Team</label>
                          <Select value={formData.team} onValueChange={val => setFormData({...formData, team: val})}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="Ignis">Ignis (Yellow)</SelectItem>
                                  <SelectItem value="Ventus">Ventus (Blue)</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-slate-500">Category</label>
                          <Select value={formData.category} onValueChange={val => setFormData({...formData, category: val, studentClass: ""})}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="Protons">Protons</SelectItem>
                                  <SelectItem value="Nexus">Nexus</SelectItem>
                                  <SelectItem value="Cosmos">Cosmos</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-slate-500">Class</label>
                          <Select value={formData.studentClass} onValueChange={val => setFormData({...formData, studentClass: val})}>
                              <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                              <SelectContent>
                                  {(
                                      formData.category === "Protons" ? ['8', '9'] :
                                      formData.category === "Nexus" ? ['10', 'HS1', 'HS2', 'BS1'] :
                                      formData.category === "Cosmos" ? ['BS2', 'BS3', 'BS4', 'BS5'] :
                                      formData.category === "General-A" ? ['8', '9', '10'] :
                                      formData.category === "General-B" ? ['HS1', 'HS2', 'BS1', 'BS2', 'BS3', 'BS4', 'BS5'] :
                                      []
                                  ).map(cls => (
                                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                                  ))}
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
                      
                      {/* 🔥 ADDED SEARCH INPUT */}
                      <div className="relative mb-2">
                        <Search className="absolute left-2 top-2 h-3 w-3 text-slate-400" />
                        <Input 
                            placeholder="Search events..." 
                            className="pl-7 h-7 text-xs bg-white border-slate-200 focus-visible:ring-purple-500" 
                            value={regSearchQuery}
                            onChange={(e) => setRegSearchQuery(e.target.value)}
                        />
                      </div>

                      <div className="h-48 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                          {regModalEvents.map(ev => {
                              const isSel = selectedEvents.find(s => s.eventId === ev._id);
                              const isSpeechTrans = normalizeString(ev.name) === "speechtranslation" && ev.category === "Cosmos";
                              const isGeneral = ev.category.toLowerCase().includes("general");
                              const isGroup = ev.groupEvent === true || 
                                              normalizeString(ev.name) === "histoart" || 
                                              normalizeString(ev.name) === "dictionarymaking" || 
                                              normalizeString(ev.name) === "swarafdebate" || 
                                              normalizeString(ev.name) === "swarfdebate" ||
                                              (normalizeString(ev.name) === "essay" && ev.category === "Nexus");

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
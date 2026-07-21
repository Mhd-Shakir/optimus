"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  LayoutDashboard, ClipboardList, LogOut, Plus, Loader2, Mic, PenTool,
  CheckCircle2, X, Star, Users, Trash2, Pencil, Lock, User, Send, Search, ArrowLeft, Trophy, Download, Printer, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
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

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{ id: string, name: string } | null>(null);
  const [formData, setFormData] = useState({ name: "", team: "", category: "Protons", studentClass: "" });
  const [selectedEvents, setSelectedEvents] = useState<any[]>([]);
  const [groupParticipants, setGroupParticipants] = useState<string[]>([]);
  const [groupCategory, setGroupCategory] = useState("Protons");
  const [groupEventId, setGroupEventId] = useState("");
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [participantSearch, setParticipantSearch] = useState("");
  const [isGroupEditMode, setIsGroupEditMode] = useState(false);
  const [editGroupEventId, setEditGroupEventId] = useState("");
  const [groupNo, setGroupNo] = useState<number>(1);
  const [originalGroupNo, setOriginalGroupNo] = useState<number>(1);
  const [eventSearchQuery, setEventSearchQuery] = useState("");
  const [eventFilterCategory, setEventFilterCategory] = useState("All");
  const [eventFilterType, setEventFilterType] = useState("All");

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
      setFormData(prev => ({ ...prev, team: user.team || "" }));
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



  const handleEdit = (e: any, s: any) => { e.stopPropagation(); if (!isSystemRegOpen) return toast({ variant: "destructive", title: "Closed", description: "Registration closed." }); setEditId(s._id); setFormData({ name: s.name, team: s.team, category: s.category, studentClass: s.studentClass || "" }); const mapped = s.registeredEvents.map((ev: any) => { const orig = events.find(x => x._id === ev.eventId); return { eventId: ev.eventId, name: ev.name || orig?.name, type: orig?.type || "Stage", isStar: ev.isStar, category: orig?.category || "", groupEvent: orig?.groupEvent || false, teamLimit: orig?.teamLimit } }); setSelectedEvents(mapped); setIsEditMode(true); setIsRegOpen(true); };

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

  const groupRegistrations = (() => {
    const list: any[] = [];
    events
      .filter(e => e.groupEvent === true || normalizeString(e.name) === "histoart" || normalizeString(e.name) === "dictionarymaking" || normalizeString(e.name) === "swarafdebate" || normalizeString(e.name) === "swarfdebate")
      .forEach(event => {
          const eventStudents = students.filter(s => s.registeredEvents?.some((re: any) => re.eventId === event._id));
          const groupsMap: Record<number, any[]> = {};
          
          eventStudents.forEach(s => {
              const reg = s.registeredEvents.find((re: any) => re.eventId === event._id);
              const gNo = reg?.groupNo || 1;
              if (!groupsMap[gNo]) groupsMap[gNo] = [];
              groupsMap[gNo].push(s);
          });

          Object.keys(groupsMap).forEach(gNoStr => {
              const gNo = parseInt(gNoStr, 10);
              list.push({
                  event,
                  groupNo: gNo,
                  participants: groupsMap[gNo]
              });
          });
      });

    list.sort((a, b) => {
        if (a.event.name !== b.event.name) return a.event.name.localeCompare(b.event.name);
        return a.groupNo - b.groupNo;
    });
    return list;
  })();

  const downloadGroupListPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = (await import("jspdf-autotable")) as any;
    
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`Registered Groups - ${user?.team || "Team"}`, 14, 20);
    
    const tableRows = groupRegistrations.map(g => {
        return [
            `${g.event.name} (Group ${g.groupNo})`,
            g.event.category,
            g.participants.map((p: any) => p.name).join("\n")
        ];
    });

    autoTable(doc, {
        startY: 30,
        head: [["Event", "Category", "Participants"]],
        body: tableRows,
        theme: "grid",
        headStyles: { fillColor: [88, 28, 135], textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 10, cellPadding: 4, textColor: [0, 0, 0], valign: 'middle' },
        columnStyles: {
            0: { cellWidth: 70, fontStyle: 'bold' },
            1: { cellWidth: 40 },
            2: { cellWidth: 'auto' }
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
    });
    
    doc.save(`${user?.team || "Team"}_Group_Registrations.pdf`);
  };

  const downloadStudentListPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = (await import("jspdf-autotable")) as any;
    
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`${user?.team || "Team"} - Student Registrations (${activeCategory})`, 14, 20);
    
    const tableRows = filteredStudents.map(student => {
      const stageList = student.registeredEvents
        ?.filter((re: any) => {
          const ev = events.find(e => e._id === re.eventId);
          return ev?.type === "Stage";
        })
        .map((re: any) => {
          const ev = events.find(e => e._id === re.eventId);
          const name = ev?.name ? ev.name.replace(/[\s&]+$/, '') : "Unknown";
          return name + (ev?.groupEvent ? " (Group)" : "") + (re.isStar ? " ★" : "");
        }) || [];

      const nonStageList = student.registeredEvents
        ?.filter((re: any) => {
          const ev = events.find(e => e._id === re.eventId);
          return ev?.type === "Non-Stage";
        })
        .map((re: any) => {
          const ev = events.find(e => e._id === re.eventId);
          const name = ev?.name ? ev.name.replace(/[\s&]+$/, '') : "Unknown";
          return name + (ev?.groupEvent ? " (Group)" : "") + (re.isStar ? " ★" : "");
        }) || [];

      return [
        student.name,
        student.chestNo || "N/A",
        `${student.category} (${student.studentClass || "N/A"})`,
        stageList.join("\n") || "None",
        nonStageList.join("\n") || "None"
      ];
    });

    autoTable(doc, {
      startY: 30,
      head: [["Name", "Chest No", "Category (Class)", "Stage Events", "Non-Stage Events"]],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 3, textColor: [0, 0, 0], valign: 'top' },
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold' },
        1: { cellWidth: 15 },
        2: { cellWidth: 25 },
        3: { cellWidth: 50 },
        4: { cellWidth: 57 }
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
    });
    
    doc.save(`${user?.team || "Team"}_Students_List_${activeCategory}.pdf`);
  };

  const handlePrintAllStudents = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rowsHtml = filteredStudents.map(student => {
      const stageList = student.registeredEvents
        ?.filter((re: any) => {
          const ev = events.find(e => e._id === re.eventId);
          return ev?.type === "Stage";
        })
        .map((re: any) => {
          const ev = events.find(e => e._id === re.eventId);
          const name = ev?.name ? ev.name.replace(/[\s&]+$/, '') : "Unknown";
          return name + (ev?.groupEvent ? " (Group)" : "") + (re.isStar ? " ★" : "");
        }) || [];

      const nonStageList = student.registeredEvents
        ?.filter((re: any) => {
          const ev = events.find(e => e._id === re.eventId);
          return ev?.type === "Non-Stage";
        })
        .map((re: any) => {
          const ev = events.find(e => e._id === re.eventId);
          const name = ev?.name ? ev.name.replace(/[\s&]+$/, '') : "Unknown";
          return name + (ev?.groupEvent ? " (Group)" : "") + (re.isStar ? " ★" : "");
        }) || [];

      const eventsContent = `
        ${stageList.length > 0 ? `<div><strong>Stage:</strong><br/>${stageList.join("<br/>")}</div>` : ''}
        ${nonStageList.length > 0 ? `<div style="margin-top: 4px;"><strong>Non-Stage:</strong><br/>${nonStageList.join("<br/>")}</div>` : ''}
        ${stageList.length === 0 && nonStageList.length === 0 ? '<div>None</div>' : ''}
      `;

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 12px; font-weight: bold; font-size: 12px; color: #0f172a; width: 25%;">${student.name}</td>
          <td style="padding: 10px 12px; font-family: monospace; font-size: 11px; color: #475569; width: 12%;">${student.chestNo || "N/A"}</td>
          <td style="padding: 10px 12px; font-size: 11px; color: #475569; width: 18%;">${student.category} (${student.studentClass || "N/A"})</td>
          <td style="padding: 10px 12px; font-size: 11px; color: #334155; width: 45%;">${eventsContent}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student Registrations - ${user?.team || "Team"}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 30px; color: #1e293b; background-color: #ffffff; }
            .header { border-bottom: 2px solid #cbd5e1; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 22px; font-weight: 900; margin: 0; color: #0f172a; text-transform: uppercase; }
            .subtitle { font-size: 12px; color: #64748b; font-weight: 700; margin-top: 4px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
            th { background: #f8fafc; padding: 12px; text-align: left; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">${user?.team || "Team"} - Student Registrations</h1>
              <div class="subtitle">Category: ${activeCategory} | Total Students: ${filteredStudents.length}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Chest No</th>
                <th>Category (Class)</th>
                <th>Registered Programs</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const toggleStar = (id: string) => {
    const target = selectedEvents.find(e => e.eventId === id); if (!target) return; if (target.category.toLowerCase().includes("general")) return;
    const name = normalizeString(target.name);
    if (name === "speechtranslation" || name === "dictionarymaking" || name === "swarafdebate" || name === "swarfdebate") { return toast({ variant: "destructive", title: "No Star Needed", description: "No star required." }); }
    const limit = formData.category === "Protons" ? 6 : 9; const currentStars = selectedEvents.filter(e => e.isStar && e.type === "Non-Stage").length;
    if (!target.isStar && currentStars >= limit) { return toast({ variant: "destructive", title: "Limit Reached", description: `Max ${limit} stars allowed.` }); }
    setSelectedEvents(prev => prev.map(e => e.eventId === id ? { ...e, isStar: !e.isStar } : e));
  };

  const handlePrintStudent = (student: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const stageEvents = student.registeredEvents?.filter((e: any) => {
      const original = events.find(ev => ev._id === e.eventId);
      return original?.type === "Stage";
    }) || [];

    const nonStageEvents = student.registeredEvents?.filter((e: any) => {
      const original = events.find(ev => ev._id === e.eventId);
      return original?.type === "Non-Stage";
    }) || [];

    const getEventItem = (e: any) => {
      const original = events.find(ev => ev._id === e.eventId);
      const isGrp = original?.groupEvent === true;
      const cleanName = original?.name ? original.name.replace(/\s*&\s*$/, '').trim() : "Unknown Event";
      return `
        <div class="event-item">
          <span class="event-name">
            ${cleanName}
            ${isGrp ? '<span class="group-badge">Group</span>' : ''}
          </span>
          <span class="event-star">${e.isStar ? '★' : ''}</span>
        </div>
      `;
    };

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Registered Events - ${student.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
            body { 
              font-family: 'Inter', sans-serif; 
              padding: 20px; 
              color: #1e293b; 
              background-color: #ffffff; 
              margin: 0;
            }
            .header { 
              border-bottom: 2px solid #cbd5e1; 
              padding-bottom: 12px; 
              margin-bottom: 15px; 
            }
            .student-name { 
              font-size: 20px; 
              font-weight: 900; 
              margin: 0; 
              color: #0f172a; 
              text-transform: uppercase; 
              letter-spacing: -0.02em; 
            }
            .student-details { 
              font-size: 11px; 
              color: #475569; 
              font-weight: 700; 
              margin-top: 4px; 
              text-transform: uppercase; 
              letter-spacing: 0.05em; 
            }
            .events-columns {
              column-count: 3;
              column-gap: 24px;
              column-rule: 1px solid #f1f5f9;
            }
            .section-title { 
              font-size: 10px; 
              font-weight: 900; 
              color: #94a3b8; 
              text-transform: uppercase; 
              letter-spacing: 0.1em; 
              margin-bottom: 8px; 
              margin-top: 15px;
              break-inside: avoid;
              break-after: avoid;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 4px;
            }
            .section-title:first-child {
              margin-top: 0;
            }
            .event-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 4.5px 0;
              border-bottom: 1px dashed #e2e8f0;
              break-inside: avoid;
            }
            .event-name {
              font-size: 10px;
              font-weight: 700;
              color: #334155;
              line-height: 1.2;
              padding-right: 8px;
            }
            .group-badge {
              font-size: 8px;
              font-weight: 800;
              background-color: #fef08a;
              color: #854d0e;
              padding: 1px 4px;
              border-radius: 3px;
              margin-left: 4px;
              text-transform: uppercase;
              display: inline-block;
            }
            .event-star {
              font-size: 11px;
              color: #7c3aed;
              font-weight: bold;
              flex-shrink: 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="student-name">${student.name}</h1>
            <div class="student-details">Team: ${student.team} &nbsp;|&nbsp; Category: ${student.category} &nbsp;|&nbsp; Chest No: ${student.chestNo}</div>
          </div>
          
          <div class="events-columns">
            ${stageEvents.length > 0 ? `
              <div class="section-title">Stage Events (${stageEvents.length})</div>
              ${stageEvents.map(getEventItem).join('')}
            ` : ''}
            
            ${nonStageEvents.length > 0 ? `
              <div class="section-title">Non-Stage Events (${nonStageEvents.length})</div>
              ${nonStageEvents.map(getEventItem).join('')}
            ` : ''}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const closeModal = () => { setIsRegOpen(false); setIsEditMode(false); setEditId(""); setFormData({ name: "", team: user?.team || "", category: "Protons", studentClass: "" }); setSelectedEvents([]); setRegSearchQuery(""); };
  const handleDelete = (e: any, id: string, studentName?: string) => { 
    if (e) e.stopPropagation(); 
    setStudentToDelete({ id, name: studentName || '' });
    setDeleteModalOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
      await axios.post('/api/student/delete', { id: studentToDelete.id });
      toast({ title: "Student Deleted", description: "The student has been successfully removed." });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete student." });
    } finally {
      setDeleteModalOpen(false);
      setStudentToDelete(null);
    }
  };

  const handleRegister = async (e: any) => { e.preventDefault(); if (!formData.name) return toast({ variant: "destructive", title: "Missing Field", description: "Name is required." }); if (!formData.studentClass) return toast({ variant: "destructive", title: "Missing Field", description: "Class is required." }); setSubmitting(true); try { await axios.post(isEditMode ? "/api/student/update" : "/api/student/register", { ...formData, id: editId, chestNo: Math.floor(1000 + Math.random() * 9000).toString(), selectedEvents }); toast({ title: "Success" }); closeModal(); fetchData(); } catch (err: any) { toast({ variant: "destructive", title: "Error", description: err.response?.data?.error }); } finally { setSubmitting(false); } };

  const handleGroupEdit = (group: any) => {
    setIsGroupEditMode(true);
    setEditGroupEventId(group.event._id);
    setGroupCategory(group.event.category);
    setGroupEventId(group.event._id);
    setGroupNo(group.groupNo);
    setOriginalGroupNo(group.groupNo);
    setGroupParticipants(group.participants.map((p: any) => p._id));
    setIsParticipantsOpen(false);
  };

  const cancelGroupEdit = () => {
    setIsGroupEditMode(false);
    setEditGroupEventId("");
    setGroupCategory("Protons");
    setGroupEventId("");
    setGroupNo(1);
    setOriginalGroupNo(1);
    setGroupParticipants([]);
    setIsParticipantsOpen(false);
  };

  const handleGroupRegister = async (e: any) => {
    e.preventDefault();
    const eventId = isGroupEditMode ? editGroupEventId : groupEventId;
    if (!eventId) return toast({ variant: "destructive", title: "Missing Field", description: "Please select an event." });
    if (groupParticipants.length === 0) return toast({ variant: "destructive", title: "Missing Field", description: "Please select at least one participant." });
    setSubmitting(true);
    try {
      if (isGroupEditMode) {
        await axios.post("/api/student/update-group", { eventId, studentIds: groupParticipants, team: user?.team, groupNo, originalGroupNo });
        toast({ title: "Success", description: "Group registration updated successfully." });
        cancelGroupEdit();
      } else {
        await axios.post("/api/student/register-group", { eventId, studentIds: groupParticipants, groupNo });
        toast({ title: "Success", description: "Group registered successfully." });
        setGroupParticipants([]);
        setGroupEventId("");
        setGroupNo(1);
      }
      fetchData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.error || "Registration failed" });
    } finally {
      setSubmitting(false);
    }
  };

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
          <button onClick={() => setActiveView("group")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeView === "group" ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "text-slate-500 hover:bg-slate-50"}`}><Users className="w-5 h-5" /> Group</button>
          <button onClick={() => setActiveView("events")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${activeView === "events" ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "text-slate-500 hover:bg-slate-50"}`}><BookOpen className="w-5 h-5" /> Events</button>
        </nav>
        <div className="p-4 border-t border-slate-100"><button onClick={() => { logout(); router.push("/login"); }} className="flex items-center gap-3 px-4 py-3 text-red-500 font-bold text-sm"><LogOut className="w-5 h-5" /> Logout</button></div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-6 custom-scrollbar">
          {activeView === "dashboard" && (
            <>
            <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8 pt-2 md:pt-4">
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center text-white text-2xl md:text-3xl font-black shadow-xl ${user?.team === 'Ignis' ? 'bg-yellow-500 shadow-yellow-100' : 'bg-blue-600 shadow-blue-100'}`}>{user?.team?.split(' ')[1] || user?.team?.charAt(0)}</div>
              <div><h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">{user?.team}</h2><p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Total Students: {students.length}</p></div>
              {isSystemRegOpen ? (<Button onClick={() => { setIsEditMode(false); setIsRegOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-12 rounded-xl text-sm font-black shadow-lg shadow-emerald-100 w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" /> NEW REGISTRATION</Button>) : (<div className="flex items-center justify-center gap-2 bg-red-50 border border-red-200 text-red-600 px-6 py-3 rounded-xl font-bold text-sm shadow-sm w-full sm:w-auto"><Lock className="w-4 h-4" /> REGISTRATION CLOSED</div>)}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-10">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500" />
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Registered Students</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button onClick={downloadStudentListPDF} variant="outline" size="sm" className="h-8 border-slate-200 text-xs font-bold bg-white">
                      <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> PDF
                    </Button>
                    <Button onClick={handlePrintAllStudents} variant="outline" size="sm" className="h-8 border-slate-200 text-xs font-bold bg-white">
                      <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> Print
                    </Button>
                  </div>
                </div>
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
                      <td className="p-4 text-right"><div className="flex justify-end gap-2"><Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:text-blue-500" onClick={(e) => handleEdit(e, student)} title="Edit"><Pencil className="w-4 h-4" /></Button><Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:text-emerald-600" onClick={(e) => { e.stopPropagation(); handlePrintStudent(student); }} title="Print"><Printer className="w-4 h-4" /></Button><Button size="icon" variant="ghost" className="h-8 w-8 text-slate-300 hover:text-red-500" onClick={(e) => handleDelete(e, student._id, student.name)} title="Delete"><Trash2 className="w-4 h-4" /></Button></div></td>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            </div>
            </>
          )}

          {activeView === "group" && (
            <div className="max-w-3xl mx-auto mt-4">
              <div className="flex flex-col items-center justify-center text-center space-y-3 mb-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-purple-600 text-white shadow-lg shadow-purple-200">
                  <Users className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase">{isGroupEditMode ? "Edit Group Registration" : "Group Registration"}</h2>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">{isGroupEditMode ? "Modify participant list for this group event" : "Register for Group Events"}</p>
                </div>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
                <form className="space-y-6" onSubmit={handleGroupRegister}>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Participant Names <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div 
                        onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
                        className="w-full min-h-[40px] p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer flex flex-wrap gap-1.5 bg-white items-center"
                      >
                        {groupParticipants.length === 0 ? (
                          <span className="text-slate-400 px-1 py-1">Select participant names</span>
                        ) : (
                          groupParticipants.map(id => {
                            const st = students.find(s => s._id === id);
                            return st ? (
                              <Badge key={id} className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none font-bold flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase">
                                {st.name}
                                <X className="w-3 h-3 cursor-pointer hover:text-purple-900" onClick={(e) => { e.stopPropagation(); setGroupParticipants(prev => prev.filter(p => p !== id)); }} />
                              </Badge>
                            ) : null;
                          })
                        )}
                      </div>
                      {isParticipantsOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsParticipantsOpen(false)} />
                          <div className="absolute top-full left-0 mt-1 w-full max-h-72 flex flex-col bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
                            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                              <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                  type="text" 
                                  placeholder="Search participant..." 
                                  value={participantSearch}
                                  onChange={(e) => setParticipantSearch(e.target.value)}
                                  className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                  autoFocus
                                />
                              </div>
                            </div>
                            <div className="overflow-y-auto custom-scrollbar p-1 max-h-56">
                              {(() => {
                                const filtered = students.filter(s => {
                                  let matchCat = false;
                                  if (groupCategory === "General-A") matchCat = ["8", "9", "10"].includes(s.studentClass);
                                  else if (groupCategory === "General-B") matchCat = ["HS1", "HS2", "BS1", "BS2", "BS3", "BS4", "BS5"].includes(s.studentClass);
                                  else matchCat = s.category === groupCategory;
                                  
                                  if (!matchCat) return false;
                                  
                                  if (participantSearch) {
                                    const searchLower = participantSearch.toLowerCase();
                                    return s.name.toLowerCase().includes(searchLower) || (s.chestNo && s.chestNo.toLowerCase().includes(searchLower));
                                  }
                                  return true;
                                });

                                return filtered.length === 0 ? (
                                  <div className="p-6 text-xs font-bold text-slate-400 text-center uppercase tracking-wider">No students found</div>
                                ) : (
                                  filtered.map(student => (
                                    <label key={student._id} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-md cursor-pointer transition-colors border-b border-slate-50 last:border-0">
                                      <input 
                                        type="checkbox" 
                                        checked={groupParticipants.includes(student._id)}
                                        onChange={() => setGroupParticipants(prev => prev.includes(student._id) ? prev.filter(p => p !== student._id) : [...prev, student._id])}
                                        className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                      />
                                      <div>
                                        <span className="text-sm font-bold text-slate-700 block">{student.name} <span className="text-slate-400 font-normal">({student.studentClass})</span></span>
                                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{student.category}</span>
                                      </div>
                                    </label>
                                  ))
                                );
                              })()}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Select all team members who are participating in this group event.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Team <span className="text-red-500">*</span></label>
                      <div className="h-10 px-3 flex items-center bg-slate-100 text-slate-600 text-sm font-bold rounded-lg border border-slate-200 cursor-not-allowed">
                        {user?.team || "Loading..."}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Category <span className="text-red-500">*</span></label>
                      <Select disabled={isGroupEditMode} value={groupCategory} onValueChange={(val) => { setGroupCategory(val); setGroupParticipants([]); }}>
                        <SelectTrigger className="h-10 text-sm">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Protons">Protons</SelectItem>
                          <SelectItem value="Nexus">Nexus</SelectItem>
                          <SelectItem value="Cosmos">Cosmos</SelectItem>
                          <SelectItem value="General-A">General-A</SelectItem>
                          <SelectItem value="General-B">General-B</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Group Number <span className="text-red-500">*</span></label>
                      <Select value={groupNo.toString()} onValueChange={(val) => { setGroupNo(parseInt(val, 10)); setGroupParticipants([]); }}>
                        <SelectTrigger className="h-10 text-sm">
                          <SelectValue placeholder="Select Group Number" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Group 1</SelectItem>
                          <SelectItem value="2">Group 2</SelectItem>
                          <SelectItem value="3">Group 3</SelectItem>
                          <SelectItem value="4">Group 4</SelectItem>
                          <SelectItem value="5">Group 5</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Event <span className="text-red-500">*</span></label>
                    <Select disabled={isGroupEditMode} value={groupEventId} onValueChange={setGroupEventId}>
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue placeholder="Select Group Event" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.filter(e => 
                          (e.groupEvent === true || normalizeString(e.name) === "histoart" || normalizeString(e.name) === "dictionarymaking" || normalizeString(e.name) === "swarafdebate" || normalizeString(e.name) === "swarfdebate") && 
                          e.category === groupCategory
                        ).map(e => (
                          <SelectItem key={e._id} value={e._id}>{e.name} <span className="text-[10px] text-slate-400 ml-1">({e.category})</span></SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex gap-3">
                    {isGroupEditMode && (
                      <Button type="button" onClick={cancelGroupEdit} variant="outline" className="flex-1 h-12 border-slate-200 text-slate-500 hover:text-slate-700 font-bold rounded-xl transition-all">
                        Cancel Edit
                      </Button>
                    )}
                    <Button type="submit" disabled={submitting} className={`h-12 text-white font-bold rounded-xl shadow-lg transition-all ${isGroupEditMode ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 flex-[2]' : 'w-full bg-purple-600 hover:bg-purple-700 shadow-purple-100'}`}>
                      {submitting ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />} 
                      {isGroupEditMode ? "Save Changes" : "Complete Group Registration"}
                    </Button>
                  </div>
                </form>
              </div>
              
              <div className="mt-10 mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">Registered Groups</h3>
                  <Button onClick={downloadGroupListPDF} variant="outline" size="sm" className="h-8 border-slate-200">
                    <Download className="w-3 h-3 mr-2" /> Download PDF
                  </Button>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <Table className="min-w-[600px]">
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Event</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Participants</TableHead>
                        <TableHead className="text-right pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupRegistrations.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="h-24 text-center text-slate-400">No group registrations yet.</TableCell></TableRow>
                      ) : (
                        groupRegistrations.map((group, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-bold text-slate-800">
                              {group.event.name}
                              <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 font-bold border-slate-200">
                                Group {group.groupNo}
                              </Badge>
                            </TableCell>
                            <TableCell><span className="text-xs font-bold text-slate-500">{group.event.category}</span></TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {group.participants.map((p: any) => (
                                  <Badge key={p._id} variant="outline" className="text-[10px] bg-slate-50">{p.name}</Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-4">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                onClick={() => handleGroupEdit(group)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

            </div>
          )}

          {activeView === "events" && (
            <div className="max-w-6xl mx-auto mt-4">
              <div className="flex flex-col items-center justify-center text-center space-y-3 mb-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-teal-600 text-white shadow-lg shadow-teal-200">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase">Events Directory</h2>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">See which students are registered for each event</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-10">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="Search events..." 
                      className="pl-9 h-9 text-xs bg-white border-slate-200" 
                      value={eventSearchQuery} 
                      onChange={(e) => setEventSearchQuery(e.target.value)} 
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 overflow-x-auto no-scrollbar max-w-full">
                    <div className="flex p-1 bg-slate-200/50 rounded-lg overflow-x-auto no-scrollbar">
                      {['All', 'Protons', 'Nexus', 'Cosmos', 'General-A', 'General-B'].map((cat) => (
                        <button 
                          key={cat} 
                          onClick={() => setEventFilterCategory(cat)} 
                          className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${eventFilterCategory === cat ? "bg-white text-teal-600 shadow-sm" : "text-slate-500 hover:text-teal-600"}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="flex p-1 bg-slate-200/50 rounded-lg overflow-x-auto no-scrollbar">
                      {['All', 'Stage', 'Non-Stage'].map((type) => (
                        <button 
                          key={type} 
                          onClick={() => setEventFilterType(type)} 
                          className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${eventFilterType === type ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-purple-600"}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {(() => {
                    const filteredEvents = events.filter(e => {
                      if (eventFilterCategory !== "All" && e.category !== eventFilterCategory) return false;
                      if (eventFilterType !== "All" && e.type !== eventFilterType) return false;
                      if (eventSearchQuery && !e.name.toLowerCase().includes(eventSearchQuery.toLowerCase())) return false;
                      return true;
                    }).sort((a, b) => a.name.localeCompare(b.name));

                    if (filteredEvents.length === 0) {
                      return <div className="p-12 text-center text-slate-400 text-sm">No events found.</div>;
                    }

                    return filteredEvents.map(event => {
                      const cleanEventName = event.name.replace(/[\s&]+$/, '');
                      const isGrp = event.groupEvent === true || normalizeString(event.name) === "histoart" || normalizeString(event.name) === "dictionarymaking" || normalizeString(event.name) === "swarafdebate" || normalizeString(event.name) === "swarfdebate";

                      const registeredStudents = students.filter(s => 
                        s.registeredEvents?.some((re: any) => re.eventId === event._id)
                      );

                      const groupNumbers = Array.from(new Set(registeredStudents.map(s => {
                        const reg = s.registeredEvents.find((re: any) => re.eventId === event._id);
                        return reg?.groupNo || 1;
                      }))).sort((a, b) => a - b);

                      return (
                        <div key={event._id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                          <div className="space-y-1.5 md:max-w-[40%]">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-800 text-sm">{cleanEventName}</span>
                              {isGrp && <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-[9px] font-bold px-1.5 uppercase">Group</Badge>}
                              <Badge variant="outline" className="text-[9px] font-bold px-1.5 uppercase text-slate-500 bg-slate-50">{event.type}</Badge>
                            </div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Category: {event.category} &nbsp;|&nbsp; Team Limit: {event.teamLimit || (isGrp ? "N/A" : 3)}
                            </div>
                          </div>

                          <div className="flex-1 md:pl-6">
                            {registeredStudents.length === 0 ? (
                              <span className="text-xs text-slate-300 italic">No registrations from your team yet</span>
                            ) : isGrp ? (
                              <div className="space-y-2">
                                {groupNumbers.map(gNo => {
                                  const groupMembers = registeredStudents.filter(s => {
                                    const reg = s.registeredEvents.find((re: any) => re.eventId === event._id);
                                    return (reg?.groupNo || 1) === gNo;
                                  });
                                  return (
                                    <div key={gNo} className="flex items-start gap-2 text-xs">
                                      <span className="font-black text-slate-500 text-[10px] uppercase shrink-0 mt-0.5">Group {gNo}:</span>
                                      <div className="flex flex-wrap gap-1">
                                        {groupMembers.map(s => (
                                          <Badge key={s._id} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none px-2 py-0.5 text-[10px] font-medium">
                                            {s.name} <span className="text-slate-400 font-normal ml-0.5">({s.studentClass})</span>
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {registeredStudents.map(s => {
                                  const reg = s.registeredEvents.find((re: any) => re.eventId === event._id);
                                  return (
                                    <Badge key={s._id} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100 px-2 py-0.5 text-[10px] font-medium flex items-center gap-1">
                                      {s.name} <span className="text-emerald-400 font-normal">({s.studentClass})</span>
                                      {reg?.isStar && <Star className="w-2.5 h-2.5 fill-current text-yellow-500" />}
                                    </Badge>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}

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
                
                <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy className="w-32 h-32 text-white" /></div>
                <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                  <button onClick={() => handlePrintStudent(viewStudent)} className="p-2 text-white/50 hover:text-white transition-colors" title="Print Registered Events"><Printer className="w-5 h-5" /></button>
                  <button onClick={() => setViewStudent(null)} className="p-2 text-white/50 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="p-0 max-h-[60vh] overflow-y-auto bg-slate-50">
                {viewStudent.registeredEvents?.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">No events registered.</div>
                ) : (
                  <div className="p-4 space-y-6">
                    {["Stage", "Non-Stage"].map(type => {
                      const typeEvents = viewStudent.registeredEvents?.filter((e: any) => {
                        const original = events.find(ev => ev._id === e.eventId);
                        return original?.type === type;
                      });
                      
                      if (!typeEvents || typeEvents.length === 0) return null;
                      
                      return (
                        <div key={type}>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{type} Events <span className="text-slate-300 ml-1">({typeEvents.length})</span></h4>
                          <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            {typeEvents.map((e: any, idx: number) => { 
                              const { rank, grade, points, mark } = getEventResult(viewStudent._id, e.eventId); 
                              const original = events.find(ev => ev._id === e.eventId); 
                              const isGrp = original?.groupEvent === true; 
                              return (
                                <div key={idx} className="px-5 py-3 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                  <div className="flex-1 pr-4">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-bold text-slate-800">{e.name || original?.name || "Unknown Event"}</span>
                                      {isGrp && <span className="text-[9px] bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded uppercase font-bold border border-yellow-200">Group</span>}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      {e.status === 'sent' && <Badge variant="outline" className="text-[9px] h-4 px-1 text-yellow-600 border-yellow-300 bg-yellow-50">Sent to Stage</Badge>}
                                      {e.status === 'reported' && <Badge variant="outline" className="text-[9px] h-4 px-1 text-emerald-600 border-emerald-300 bg-emerald-50">Completed</Badge>}
                                      {e.isStar && <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"><Star className="w-2 h-2 fill-current" /> Star</span>}
                                    </div>
                                  </div>
                                  <div className="text-right min-w-[80px]">
                                    {grade ? (
                                      <div>
                                        <div className="text-lg font-black text-slate-900">{grade}{mark && <span className="text-xs text-slate-500 ml-1">({mark})</span>}</div>
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
          <button onClick={() => setActiveView("group")} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${activeView === "group" ? "text-emerald-600" : "text-slate-400 hover:text-emerald-600"}`}>
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold">Group</span>
          </button>
          <button onClick={() => { logout(); router.push("/login"); }} className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-slate-400 hover:text-red-500">
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] font-bold">Logout</span>
          </button>
        </div>
      </div>
      <DeleteConfirmModal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        onConfirm={confirmDelete}
        studentName={studentToDelete?.name}
      />
    </div>
  );
}
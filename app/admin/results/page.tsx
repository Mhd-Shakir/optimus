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
import { Search, Trophy, Medal, Loader2, Edit, Save, Trash2, Users, User, Plus, X, Printer, Eye, QrCode } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const normalizeString = (str: string) => {
    if (!str) return "";
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
};

export default function AdminResultsPage() {
    const { toast } = useToast()
    const router = useRouter()

    const [events, setEvents] = useState<any[]>([])
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    const [activeTab, setActiveTab] = useState("All")

    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingEvent, setEditingEvent] = useState<any>(null)
    const [submitting, setSubmitting] = useState(false)

    // Winners Modal State
    const [winnersModalOpen, setWinnersModalOpen] = useState(false)
    const [selectedWinnersEvent, setSelectedWinnersEvent] = useState<any>(null)

    // Print State
    const [printingEvent, setPrintingEvent] = useState<any>(null)

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [eventToDelete, setEventToDelete] = useState<any>(null)

    const [resultData, setResultData] = useState({
        first: [] as Array<{ studentId: string, grade: string, mark: string, codeLetter: string }>,
        second: [] as Array<{ studentId: string, grade: string, mark: string, codeLetter: string }>,
        third: [] as Array<{ studentId: string, grade: string, mark: string, codeLetter: string }>,
        others: [] as Array<{ studentId: string, grade: string, mark: string, codeLetter: string }>
    })

    const { calculateGradeAndPoints } = require("@/lib/points");

    const getEventGroupStatus = (event: any) => {
        if (!event) return false;
        const eventName = normalizeString(event?.name || "");
        const isGroupEvent = event.groupEvent === true ||
            eventName === "histoart" ||
            eventName === "dictionarymaking" ||
            eventName === "swarafdebate" ||
            eventName === "swarfdebate";

        const individualPointExceptions = ["speechtranslation", "dictionarymaking", "swarafdebate", "swarfdebate"];
        return isGroupEvent && !individualPointExceptions.includes(eventName);
    };

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

        const othersData = (event.results?.others || []).map((other: any) => ({
            studentId: other.studentId || "",
            grade: other.grade || "",
            mark: other.mark || "",
            codeLetter: other.codeLetter || ""
        }));

        // Handle both old format (single values) and new format (arrays)
        const firstData = Array.isArray(event.results?.first)
            ? event.results.first
            : event.results?.first
                ? [{
                    studentId: event.results.first,
                    grade: event.results.firstGrade || "",
                    mark: event.results.firstMark || "",
                    codeLetter: event.results.firstCodeLetter || ""
                }]
                : [];

        const secondData = Array.isArray(event.results?.second)
            ? event.results.second
            : event.results?.second
                ? [{
                    studentId: event.results.second,
                    grade: event.results.secondGrade || "",
                    mark: event.results.secondMark || "",
                    codeLetter: event.results.secondCodeLetter || ""
                }]
                : [];

        const thirdData = Array.isArray(event.results?.third)
            ? event.results.third
            : event.results?.third
                ? [{
                    studentId: event.results.third,
                    grade: event.results.thirdGrade || "",
                    mark: event.results.thirdMark || "",
                    codeLetter: event.results.thirdCodeLetter || ""
                }]
                : [];

        setResultData({
            first: firstData,
            second: secondData,
            third: thirdData,
            others: othersData
        })
        setIsEditOpen(true)
    }

    const handlePrint = (event: any) => {
        setPrintingEvent(event);
        setTimeout(() => {
            window.print();
        }, 100);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (resultData.first.length === 0 || !resultData.first[0].studentId) {
            return toast({ variant: "destructive", title: "Wait!", description: "At least one First Place winner is required." })
        }

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

    const confirmDelete = async () => {
        if (!eventToDelete) return;
        try {
            await axios.delete('/api/events/result', { data: { eventId: eventToDelete._id } });
            toast({ title: "Deleted 🗑️", description: "Result removed successfully!" });
            fetchData();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete result." });
        } finally {
            setDeleteModalOpen(false);
            setEventToDelete(null);
        }
    }

    const getStudentName = (id: string) => {
        const s = students.find(std => std._id === id)
        return s ? `${s.name} (${s.team})` : "Unknown"
    }

    const getStudentDetails = (id: string) => {
        const s = students.find(std => std._id === id)
        return s ? s : null
    }

    const filteredEvents = events.filter(ev => {
        const matchSearch = ev.name.toLowerCase().includes(searchTerm.toLowerCase())
        if (!matchSearch) return false;

        if (activeTab === "Published") return ev.status === "completed";
        
        // Hide completed events from all other tabs so they "move" to the Published tab
        if (ev.status === "completed") return false;

        if (activeTab === "All") return true;
        return ev.category === activeTab;
    })

    const registeredStudents = students.filter(student =>
        student.registeredEvents?.some((r: any) => r.eventId === editingEvent?._id)
    );

    const assignedStudentIds = [
        ...resultData.first.map(f => f.studentId),
        ...resultData.second.map(s => s.studentId),
        ...resultData.third.map(t => t.studentId)
    ];

    const availableForOthers = registeredStudents.filter(s =>
        !assignedStudentIds.includes(s._id)
    );

    // Helper functions for position arrays
    const addPosition = (position: 'first' | 'second' | 'third') => {
        setResultData(prev => ({
            ...prev,
            [position]: [...prev[position], { studentId: "", grade: "", mark: "", codeLetter: "" }]
        }));
    };

    const removePosition = (position: 'first' | 'second' | 'third', index: number) => {
        setResultData(prev => ({
            ...prev,
            [position]: prev[position].filter((_, i) => i !== index)
        }));
    };

    const updatePosition = (position: 'first' | 'second' | 'third', index: number, field: 'studentId' | 'grade' | 'mark' | 'codeLetter', value: string) => {
        setResultData(prev => ({
            ...prev,
            [position]: prev[position].map((item, i) => {
                if (i === index) {
                    const updated = { ...item, [field]: value };
                    if (field === 'mark') {
                        const { grade } = calculateGradeAndPoints(parseInt(value), getEventGroupStatus(editingEvent));
                        updated.grade = grade || "";
                    }
                    return updated;
                }
                return item;
            })
        }));
    };

    const addOther = () => {
        if (availableForOthers.length === 0) {
            return toast({ variant: "destructive", title: "No More Students", description: "All registered students are assigned." });
        }
        setResultData(prev => ({
            ...prev,
            others: [...prev.others, { studentId: "", grade: "", mark: "", codeLetter: "" }]
        }));
    };

    const removeOther = (index: number) => {
        setResultData(prev => ({
            ...prev,
            others: prev.others.filter((_, i) => i !== index)
        }));
    };

    const updateOther = (index: number, field: 'studentId' | 'grade' | 'mark' | 'codeLetter', value: string) => {
        setResultData(prev => ({
            ...prev,
            others: prev.others.map((item, i) => {
                if (i === index) {
                    const updated = { ...item, [field]: value };
                    if (field === 'mark') {
                        const { grade } = calculateGradeAndPoints(parseInt(value), getEventGroupStatus(editingEvent));
                        updated.grade = grade || "";
                    }
                    return updated;
                }
                return item;
            })
        }));
    };

    const tabs = ["All", "Protons", "Nexus", "Cosmos", "General-A", "General-B", "Published"];

    return (
        <>
            {/* MAIN ADMIN INTERFACE (Hidden when printing) */}
            <div className="p-6 space-y-6 bg-slate-50 min-h-screen print:hidden">
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
                                className={`px-5 py-2 text-sm font-bold rounded-md transition-all whitespace-nowrap ${activeTab === cat
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
                    <div className="overflow-x-auto w-full">
                    <Table className="w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">SI</TableHead>
                                <TableHead>Event Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Winners (w/ Code)</TableHead>
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
                                        <TableCell className="text-center">
                                            {ev.status === "completed" ? (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="h-7 text-[11px] px-3 border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                                                    onClick={() => { setSelectedWinnersEvent(ev); setWinnersModalOpen(true); }}
                                                >
                                                    <Trophy className="w-3 h-3 mr-1 text-yellow-500" /> View Winners
                                                </Button>
                                            ) : "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1.5 flex-wrap">
                                                <Button size="sm" onClick={() => router.push(`/admin/results/code-letters/${ev._id}`)} variant="outline" className="h-8 text-[11px] px-2 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100">
                                                    <QrCode className="w-3 h-3 mr-1" /> Codes
                                                </Button>
                                                <Button size="sm" onClick={() => handleEdit(ev)} className="h-8 text-[11px] px-2 bg-slate-900 text-white hover:bg-slate-700">
                                                    <Edit className="w-3 h-3 mr-1" /> {ev.status === "completed" ? "Edit" : "Add"}
                                                </Button>
                                                {ev.status === "completed" && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => router.push(`/admin/evaluated-papers/${ev._id}`)}
                                                            className="h-8 text-[11px] px-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                                        >
                                                            <Eye className="w-3 h-3 mr-1" /> Sheet
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handlePrint(ev)}
                                                            className="h-8 text-[11px] px-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <Printer className="w-3 h-3 mr-1" /> Print
                                                        </Button>
                                                        <Button size="icon" variant="destructive" className="h-8 w-8 bg-red-100 text-red-600 hover:bg-red-200 shadow-none border-none" onClick={() => { setEventToDelete(ev); setDeleteModalOpen(true); }}>
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                    </div>
                </Card>

                <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                    <AlertDialogContent className="bg-white">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Result?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete the published result for <strong>{eventToDelete?.name}</strong>?
                                <br/><br/>
                                This will remove all winners, grades, marks, and code letter assignments for this event. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteModalOpen(false)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                                Delete Result
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="sm:max-w-5xl w-full max-h-[90vh] overflow-y-auto">
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
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-yellow-800 uppercase flex items-center gap-2"><Trophy className="w-4 h-4" /> First Place</label>
                                    <Button type="button" size="sm" onClick={() => addPosition('first')} variant="outline" className="h-7 text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-100">
                                        <Plus className="w-3 h-3 mr-1" /> Add More
                                    </Button>
                                </div>

                                {resultData.first.length === 0 ? (
                                    <div className="text-center py-4">
                                        <Button type="button" onClick={() => addPosition('first')} variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100">
                                            <Plus className="w-4 h-4 mr-2" /> Add First Place Winner
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {resultData.first.map((winner, idx) => (
                                            <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-2 items-center bg-white p-2 rounded-lg border border-yellow-100">
                                                <span className="text-xs font-bold text-yellow-700 w-8">#{idx + 1}</span>
                                                <Select value={winner.studentId} onValueChange={val => updatePosition('first', idx, 'studentId', val)}>
                                                    <SelectTrigger className="flex-1 h-9 text-xs border-yellow-200"><SelectValue placeholder="Select Winner" /></SelectTrigger>
                                                    <SelectContent className="max-h-60">
                                                        {registeredStudents.map(s => <SelectItem key={s._id} value={s._id}>{s.name} ({s.team})</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    placeholder="Code"
                                                    className="w-20 h-9 text-xs border-yellow-200"
                                                    value={winner.codeLetter}
                                                    onChange={(e) => updatePosition('first', idx, 'codeLetter', e.target.value)}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Mark"
                                                    className="w-20 h-9 text-xs border-yellow-200"
                                                    value={winner.mark}
                                                    onChange={(e) => updatePosition('first', idx, 'mark', e.target.value)}
                                                    min="0"
                                                    max="100"
                                                />
                                                <Select value={winner.grade} onValueChange={val => updatePosition('first', idx, 'grade', val)}>
                                                    <SelectTrigger className="w-20 h-9 text-xs border-yellow-200"><SelectValue placeholder="Grade" /></SelectTrigger>
                                                    <SelectContent>
                                                        {["A+", "A", "B", "C"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <span className="text-[10px] font-bold text-yellow-600 w-12 text-right">
                                                    {winner.mark ? `+${calculateGradeAndPoints(parseInt(winner.mark), getEventGroupStatus(editingEvent)).points} pts` : '-'}
                                                </span>
                                                {resultData.first.length > 1 && (
                                                    <Button type="button" size="icon" variant="ghost" onClick={() => removePosition('first', idx)} className="h-9 w-9 text-red-500 hover:bg-red-50">
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* SECOND PLACE */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-2"><Medal className="w-4 h-4" /> Second Place</label>
                                    <Button type="button" size="sm" onClick={() => addPosition('second')} variant="outline" className="h-7 text-xs border-slate-300 text-slate-700 hover:bg-slate-100">
                                        <Plus className="w-3 h-3 mr-1" /> Add More
                                    </Button>
                                </div>

                                {resultData.second.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center py-2">No second place added (optional)</p>
                                ) : (
                                    <div className="space-y-2">
                                        {resultData.second.map((winner, idx) => (
                                            <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-2 items-center bg-white p-2 rounded-lg border border-slate-100">
                                                <span className="text-xs font-bold text-slate-500 w-8">#{idx + 1}</span>
                                                <Select value={winner.studentId} onValueChange={val => updatePosition('second', idx, 'studentId', val)}>
                                                    <SelectTrigger className="flex-1 h-9 text-xs"><SelectValue placeholder="Select Winner" /></SelectTrigger>
                                                    <SelectContent className="max-h-60">
                                                        {registeredStudents.map(s => <SelectItem key={s._id} value={s._id}>{s.name} ({s.team})</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    placeholder="Code"
                                                    className="w-20 h-9 text-xs"
                                                    value={winner.codeLetter}
                                                    onChange={(e) => updatePosition('second', idx, 'codeLetter', e.target.value)}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Mark"
                                                    className="w-20 h-9 text-xs"
                                                    value={winner.mark}
                                                    onChange={(e) => updatePosition('second', idx, 'mark', e.target.value)}
                                                    min="0"
                                                    max="100"
                                                />
                                                <Select value={winner.grade} onValueChange={val => updatePosition('second', idx, 'grade', val)}>
                                                    <SelectTrigger className="w-20 h-9 text-xs"><SelectValue placeholder="Grade" /></SelectTrigger>
                                                    <SelectContent>
                                                        {["A+", "A", "B", "C"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <span className="text-[10px] font-bold text-slate-600 w-12 text-right">
                                                    {winner.mark ? `+${calculateGradeAndPoints(parseInt(winner.mark), getEventGroupStatus(editingEvent)).points} pts` : '-'}
                                                </span>
                                                <Button type="button" size="icon" variant="ghost" onClick={() => removePosition('second', idx)} className="h-9 w-9 text-red-500 hover:bg-red-50">
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* THIRD PLACE */}
                            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-orange-800 uppercase flex items-center gap-2"><Medal className="w-4 h-4" /> Third Place</label>
                                    <Button type="button" size="sm" onClick={() => addPosition('third')} variant="outline" className="h-7 text-xs border-orange-300 text-orange-700 hover:bg-orange-100">
                                        <Plus className="w-3 h-3 mr-1" /> Add More
                                    </Button>
                                </div>

                                {resultData.third.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center py-2">No third place added (optional)</p>
                                ) : (
                                    <div className="space-y-2">
                                        {resultData.third.map((winner, idx) => (
                                            <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-2 items-center bg-white p-2 rounded-lg border border-orange-100">
                                                <span className="text-xs font-bold text-orange-700 w-8">#{idx + 1}</span>
                                                <Select value={winner.studentId} onValueChange={val => updatePosition('third', idx, 'studentId', val)}>
                                                    <SelectTrigger className="flex-1 h-9 text-xs border-orange-200"><SelectValue placeholder="Select Winner" /></SelectTrigger>
                                                    <SelectContent className="max-h-60">
                                                        {registeredStudents.map(s => <SelectItem key={s._id} value={s._id}>{s.name} ({s.team})</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    placeholder="Code"
                                                    className="w-20 h-9 text-xs border-orange-200"
                                                    value={winner.codeLetter}
                                                    onChange={(e) => updatePosition('third', idx, 'codeLetter', e.target.value)}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Mark"
                                                    className="w-20 h-9 text-xs border-orange-200"
                                                    value={winner.mark}
                                                    onChange={(e) => updatePosition('third', idx, 'mark', e.target.value)}
                                                    min="0"
                                                    max="100"
                                                />
                                                <Select value={winner.grade} onValueChange={val => updatePosition('third', idx, 'grade', val)}>
                                                    <SelectTrigger className="w-20 h-9 text-xs border-orange-200"><SelectValue placeholder="Grade" /></SelectTrigger>
                                                    <SelectContent>
                                                        {["A+", "A", "B", "C"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <span className="text-[10px] font-bold text-orange-600 w-12 text-right">
                                                    {winner.mark ? `+${calculateGradeAndPoints(parseInt(winner.mark), getEventGroupStatus(editingEvent)).points} pts` : '-'}
                                                </span>
                                                <Button type="button" size="icon" variant="ghost" onClick={() => removePosition('third', idx)} className="h-9 w-9 text-red-500 hover:bg-red-50">
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* OTHERS (4th+ positions) */}
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-blue-800 uppercase">Other Positions (4th+)</label>
                                    <Button type="button" size="sm" onClick={addOther} variant="outline" className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-100">
                                        <Plus className="w-3 h-3 mr-1" /> Add More
                                    </Button>
                                </div>

                                {resultData.others.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center py-2">No additional positions added</p>
                                ) : (
                                    <div className="space-y-2">
                                        {resultData.others.map((other, idx) => (
                                            <div key={idx} className="flex flex-wrap sm:flex-nowrap gap-2 items-center bg-white p-2 rounded-lg border border-blue-100">
                                                <span className="text-xs font-bold text-slate-500 w-8">#{idx + 4}</span>
                                                <Select value={other.studentId} onValueChange={val => updateOther(idx, 'studentId', val)}>
                                                    <SelectTrigger className="flex-1 h-9 text-xs"><SelectValue placeholder="Select Student" /></SelectTrigger>
                                                    <SelectContent className="max-h-60">
                                                        {availableForOthers.map(s => <SelectItem key={s._id} value={s._id}>{s.name} ({s.team})</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    placeholder="Code Letter"
                                                    className="w-24 h-9 text-xs"
                                                    value={other.codeLetter}
                                                    onChange={(e) => updateOther(idx, 'codeLetter', e.target.value)}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="Mark"
                                                    className="w-20 h-9 text-xs"
                                                    value={other.mark}
                                                    onChange={(e) => updateOther(idx, 'mark', e.target.value)}
                                                    min="0"
                                                    max="100"
                                                />
                                                <Select value={other.grade} onValueChange={val => updateOther(idx, 'grade', val)}>
                                                    <SelectTrigger className="w-20 h-9 text-xs"><SelectValue placeholder="Grade" /></SelectTrigger>
                                                    <SelectContent>
                                                        {["A+", "A", "B", "C"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <span className="text-[10px] font-bold text-blue-600 w-12 text-right">
                                                    {other.mark ? `+${calculateGradeAndPoints(parseInt(other.mark), getEventGroupStatus(editingEvent)).points} pts` : '-'}
                                                </span>
                                                <Button type="button" size="icon" variant="ghost" onClick={() => removeOther(idx)} className="h-9 w-9 text-red-500 hover:bg-red-50">
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
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

            <Dialog open={winnersModalOpen} onOpenChange={setWinnersModalOpen}>
                <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Winners: {selectedWinnersEvent?.name}</DialogTitle>
                    </DialogHeader>
                    {selectedWinnersEvent && (
                        <div className="space-y-2 mt-2">
                            {/* First Place */}
                            {(() => {
                                const firstData = Array.isArray(selectedWinnersEvent.results.first) ? selectedWinnersEvent.results.first :
                                    selectedWinnersEvent.results.first ? [{ studentId: selectedWinnersEvent.results.first, grade: selectedWinnersEvent.results.firstGrade, mark: selectedWinnersEvent.results.firstMark, codeLetter: selectedWinnersEvent.results.firstCodeLetter }] : [];
                                return firstData.map((winner: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 p-2.5 bg-yellow-50 rounded-md border border-yellow-100 text-sm">
                                        <Trophy className="w-4 h-4 text-yellow-500" />
                                        <span className="font-bold text-yellow-900">1st{firstData.length > 1 ? `(${idx + 1})` : ''}:</span>
                                        <span className="text-slate-700 flex-1">{getStudentName(winner.studentId || winner)}</span>
                                        <span className="font-bold text-emerald-600">
                                            ({winner.grade || selectedWinnersEvent.results.firstGrade}
                                            {(winner.mark || selectedWinnersEvent.results.firstMark) ? `-${winner.mark || selectedWinnersEvent.results.firstMark}` : ''}
                                            {(winner.codeLetter || selectedWinnersEvent.results.firstCodeLetter) ? ` | ${winner.codeLetter || selectedWinnersEvent.results.firstCodeLetter}` : ''})
                                        </span>
                                    </div>
                                ));
                            })()}

                            {/* Second Place */}
                            {(() => {
                                const secondData = Array.isArray(selectedWinnersEvent.results.second) ? selectedWinnersEvent.results.second :
                                    selectedWinnersEvent.results.second ? [{ studentId: selectedWinnersEvent.results.second, grade: selectedWinnersEvent.results.secondGrade, mark: selectedWinnersEvent.results.secondMark, codeLetter: selectedWinnersEvent.results.secondCodeLetter }] : [];
                                return secondData.map((winner: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-md border border-slate-200 text-sm">
                                        <Medal className="w-4 h-4 text-slate-400" />
                                        <span className="font-bold text-slate-700">2nd{secondData.length > 1 ? `(${idx + 1})` : ''}:</span>
                                        <span className="text-slate-700 flex-1">{getStudentName(winner.studentId || winner)}</span>
                                        <span className="font-bold text-slate-600">
                                            ({winner.grade || selectedWinnersEvent.results.secondGrade}
                                            {(winner.mark || selectedWinnersEvent.results.secondMark) ? `-${winner.mark || selectedWinnersEvent.results.secondMark}` : ''}
                                            {(winner.codeLetter || selectedWinnersEvent.results.secondCodeLetter) ? ` | ${winner.codeLetter || selectedWinnersEvent.results.secondCodeLetter}` : ''})
                                        </span>
                                    </div>
                                ));
                            })()}

                            {/* Third Place */}
                            {(() => {
                                const thirdData = Array.isArray(selectedWinnersEvent.results.third) ? selectedWinnersEvent.results.third :
                                    selectedWinnersEvent.results.third ? [{ studentId: selectedWinnersEvent.results.third, grade: selectedWinnersEvent.results.thirdGrade, mark: selectedWinnersEvent.results.thirdMark, codeLetter: selectedWinnersEvent.results.thirdCodeLetter }] : [];
                                return thirdData.map((winner: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 p-2.5 bg-amber-50 rounded-md border border-amber-100 text-sm">
                                        <Medal className="w-4 h-4 text-amber-600" />
                                        <span className="font-bold text-amber-900">3rd{thirdData.length > 1 ? `(${idx + 1})` : ''}:</span>
                                        <span className="text-slate-700 flex-1">{getStudentName(winner.studentId || winner)}</span>
                                        <span className="font-bold text-amber-700">
                                            ({winner.grade || selectedWinnersEvent.results.thirdGrade}
                                            {(winner.mark || selectedWinnersEvent.results.thirdMark) ? `-${winner.mark || selectedWinnersEvent.results.thirdMark}` : ''}
                                            {(winner.codeLetter || selectedWinnersEvent.results.thirdCodeLetter) ? ` | ${winner.codeLetter || selectedWinnersEvent.results.thirdCodeLetter}` : ''})
                                        </span>
                                    </div>
                                ));
                            })()}

                            {/* Others */}
                            {selectedWinnersEvent.results.others && selectedWinnersEvent.results.others.length > 0 && (
                                <div className="pt-3 border-t space-y-1.5 mt-3">
                                    <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Other Participants</p>
                                    {selectedWinnersEvent.results.others.map((other: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-md text-sm">
                                            <span className="font-medium text-slate-400 w-6">#{idx + 4}</span>
                                            <span className="text-slate-700 flex-1">{getStudentName(other.studentId)}</span>
                                            <span className="font-bold text-slate-600">
                                                ({other.grade}
                                                {other.mark ? `-${other.mark}` : ''}
                                                {other.codeLetter ? ` | ${other.codeLetter}` : ''})
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* PRINTABLE RESULT SHEET (Visible only during print) */}
            {printingEvent && (
                <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black">
                    <div className="border-b-2 border-black pb-4 mb-6 text-center">
                        <h1 className="text-3xl font-extrabold uppercase tracking-wide">Official Result Sheet</h1>
                        <div className="mt-2 text-lg font-bold text-gray-700">{printingEvent.name}</div>
                        <div className="flex justify-center gap-6 mt-1 text-sm text-gray-600">
                            <span className="border border-gray-400 px-3 py-1 rounded">Category: <span className="font-bold text-black">{printingEvent.category}</span></span>
                            <span className="border border-gray-400 px-3 py-1 rounded">Type: <span className="font-bold text-black">{
                                normalizeString(printingEvent.name) === "histoart" ||
                                    normalizeString(printingEvent.name) === "dictionarymaking" ||
                                    printingEvent.groupEvent ? "Group" : "Single"
                            }</span></span>
                        </div>
                    </div>

                    <table className="w-full border-collapse border border-black text-left mb-10">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-black px-4 py-2 w-16 text-center">Pos</th>
                                <th className="border border-black px-4 py-2">Student Name</th>
                                <th className="border border-black px-4 py-2 w-32">Team</th>
                                <th className="border border-black px-4 py-2 w-24 text-center">Code Letter</th>
                                <th className="border border-black px-4 py-2 w-20 text-center">Grade</th>
                                <th className="border border-black px-4 py-2 w-20 text-center">Mark</th>
                                <th className="border border-black px-4 py-2 w-20 text-center">Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* First Place - handle both array and single value */}
                            {(() => {
                                const firstData = Array.isArray(printingEvent.results.first) ? printingEvent.results.first :
                                    printingEvent.results.first ? [{ studentId: printingEvent.results.first, grade: printingEvent.results.firstGrade, mark: printingEvent.results.firstMark, codeLetter: printingEvent.results.firstCodeLetter }] : [];
                                return firstData.map((winner: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="border border-black px-4 py-3 text-center font-bold">1st{firstData.length > 1 ? `(${idx + 1})` : ''}</td>
                                        <td className="border border-black px-4 py-3 font-semibold">{getStudentDetails(winner.studentId || winner)?.name}</td>
                                        <td className="border border-black px-4 py-3">{getStudentDetails(winner.studentId || winner)?.team}</td>
                                        <td className="border border-black px-4 py-3 text-center">{winner.codeLetter || printingEvent.results.firstCodeLetter || "-"}</td>
                                        <td className="border border-black px-4 py-3 text-center">{winner.grade || printingEvent.results.firstGrade}</td>
                                        <td className="border border-black px-4 py-3 text-center">{winner.mark || printingEvent.results.firstMark || "-"}</td>
                                        <td className="border border-black px-4 py-3 text-center font-bold">{getPoints(winner.grade || printingEvent.results.firstGrade, printingEvent, 'first')}</td>
                                    </tr>
                                ));
                            })()}

                            {/* Second Place - handle both array and single value */}
                            {(() => {
                                const secondData = Array.isArray(printingEvent.results.second) ? printingEvent.results.second :
                                    printingEvent.results.second ? [{ studentId: printingEvent.results.second, grade: printingEvent.results.secondGrade, mark: printingEvent.results.secondMark, codeLetter: printingEvent.results.secondCodeLetter }] : [];
                                return secondData.map((winner: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="border border-black px-4 py-3 text-center font-bold">2nd{secondData.length > 1 ? `(${idx + 1})` : ''}</td>
                                        <td className="border border-black px-4 py-3 font-semibold">{getStudentDetails(winner.studentId || winner)?.name}</td>
                                        <td className="border border-black px-4 py-3">{getStudentDetails(winner.studentId || winner)?.team}</td>
                                        <td className="border border-black px-4 py-3 text-center">{winner.codeLetter || printingEvent.results.secondCodeLetter || "-"}</td>
                                        <td className="border border-black px-4 py-3 text-center">{winner.grade || printingEvent.results.secondGrade}</td>
                                        <td className="border border-black px-4 py-3 text-center">{winner.mark || printingEvent.results.secondMark || "-"}</td>
                                        <td className="border border-black px-4 py-3 text-center font-bold">{getPoints(winner.grade || printingEvent.results.secondGrade, printingEvent, 'second')}</td>
                                    </tr>
                                ));
                            })()}

                            {/* Third Place - handle both array and single value */}
                            {(() => {
                                const thirdData = Array.isArray(printingEvent.results.third) ? printingEvent.results.third :
                                    printingEvent.results.third ? [{ studentId: printingEvent.results.third, grade: printingEvent.results.thirdGrade, mark: printingEvent.results.thirdMark, codeLetter: printingEvent.results.thirdCodeLetter }] : [];
                                return thirdData.map((winner: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="border border-black px-4 py-3 text-center font-bold">3rd{thirdData.length > 1 ? `(${idx + 1})` : ''}</td>
                                        <td className="border border-black px-4 py-3 font-semibold">{getStudentDetails(winner.studentId || winner)?.name}</td>
                                        <td className="border border-black px-4 py-3">{getStudentDetails(winner.studentId || winner)?.team}</td>
                                        <td className="border border-black px-4 py-3 text-center">{winner.codeLetter || printingEvent.results.thirdCodeLetter || "-"}</td>
                                        <td className="border border-black px-4 py-3 text-center">{winner.grade || printingEvent.results.thirdGrade}</td>
                                        <td className="border border-black px-4 py-3 text-center">{winner.mark || printingEvent.results.thirdMark || "-"}</td>
                                        <td className="border border-black px-4 py-3 text-center font-bold">{getPoints(winner.grade || printingEvent.results.thirdGrade, printingEvent, 'third')}</td>
                                    </tr>
                                ));
                            })()}

                            {/* Others */}
                            {printingEvent.results.others && printingEvent.results.others.map((other: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="border border-black px-4 py-2 text-center text-sm text-gray-600">{idx + 4}th</td>
                                    <td className="border border-black px-4 py-2">{getStudentDetails(other.studentId)?.name}</td>
                                    <td className="border border-black px-4 py-2">{getStudentDetails(other.studentId)?.team}</td>
                                    <td className="border border-black px-4 py-2 text-center">{other.codeLetter || "-"}</td>
                                    <td className="border border-black px-4 py-2 text-center">{other.grade}</td>
                                    <td className="border border-black px-4 py-2 text-center">{other.mark || "-"}</td>
                                    <td className="border border-black px-4 py-2 text-center font-bold">{getPoints(other.grade, printingEvent, 'other')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-between items-end mt-24 px-8">
                        <div className="text-center">
                            <div className="border-t border-black w-48 mb-2"></div>
                            <p className="font-bold">Judge's Signature</p>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-black w-48 mb-2"></div>
                            <p className="font-bold">Coordinator's Signature</p>
                        </div>
                    </div>

                    <div className="fixed bottom-4 left-0 right-0 text-center text-xs text-gray-400">
                        Generated via Event Management System • {new Date().toLocaleDateString()}
                    </div>
                </div>
            )}
        </>
    )
}
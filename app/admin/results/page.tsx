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
import { Search, Trophy, Medal, Loader2, Edit, Save, Trash2, Users, User, Plus, X, Printer, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

    // Print State
    const [printingEvent, setPrintingEvent] = useState<any>(null)

    const [resultData, setResultData] = useState({
        first: [] as Array<{ studentId: string, grade: string, mark: string, codeLetter: string }>,
        second: [] as Array<{ studentId: string, grade: string, mark: string, codeLetter: string }>,
        third: [] as Array<{ studentId: string, grade: string, mark: string, codeLetter: string }>,
        others: [] as Array<{ studentId: string, grade: string, mark: string, codeLetter: string }>
    })

    const calculateGradeFromMark = (mark: string) => {
        const numMark = parseInt(mark);
        if (isNaN(numMark) || mark === "") return "";
        if (numMark >= 90 && numMark <= 100) return "A+";
        if (numMark >= 70 && numMark <= 89) return "A";
        if (numMark >= 50 && numMark <= 69) return "B";
        if (numMark >= 40 && numMark <= 49) return "C";
        return "";
    };

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
        if (!event || !grade && position !== 'first' && position !== 'second' && position !== 'third') return 0;

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
            if (position === 'first') return 10 + gradePoints;
            if (position === 'second') return 6 + gradePoints;
            if (position === 'third') return 3 + gradePoints;
            return gradePoints;
        } else {
            if (position === 'first') return 5 + gradePoints;
            if (position === 'second') return 3 + gradePoints;
            if (position === 'third') return 1 + gradePoints;
            return gradePoints;
        }
    }

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
                        updated.grade = calculateGradeFromMark(value);
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
                        updated.grade = calculateGradeFromMark(value);
                    }
                    return updated;
                }
                return item;
            })
        }));
    };

    const tabs = ["All", "Alpha", "Beta", "Omega", "General-A", "General-B"];

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
                    <Table>
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
                                        <TableCell className="text-xs text-slate-500">
                                            {ev.status === "completed" ? (
                                                <div className="space-y-1">
                                                    {/* First Place - handle both array and single value */}
                                                    {(() => {
                                                        const firstData = Array.isArray(ev.results.first) ? ev.results.first :
                                                            ev.results.first ? [{ studentId: ev.results.first, grade: ev.results.firstGrade, mark: ev.results.firstMark, codeLetter: ev.results.firstCodeLetter }] : [];
                                                        return firstData.map((winner: any, idx: number) => (
                                                            <div key={idx} className="flex items-center gap-1">
                                                                <Trophy className="w-3 h-3 text-yellow-500" />
                                                                1st{firstData.length > 1 ? `(${idx + 1})` : ''}: {getStudentName(winner.studentId || winner)}
                                                                <span className="font-bold text-emerald-600">
                                                                    ({winner.grade || ev.results.firstGrade}
                                                                    {(winner.mark || ev.results.firstMark) ? `-${winner.mark || ev.results.firstMark}` : ''}
                                                                    {(winner.codeLetter || ev.results.firstCodeLetter) ? ` | ${winner.codeLetter || ev.results.firstCodeLetter}` : ''})
                                                                </span>
                                                            </div>
                                                        ));
                                                    })()}

                                                    {/* Second Place - handle both array and single value */}
                                                    {(() => {
                                                        const secondData = Array.isArray(ev.results.second) ? ev.results.second :
                                                            ev.results.second ? [{ studentId: ev.results.second, grade: ev.results.secondGrade, mark: ev.results.secondMark, codeLetter: ev.results.secondCodeLetter }] : [];
                                                        return secondData.map((winner: any, idx: number) => (
                                                            <div key={idx} className="flex items-center gap-1">
                                                                <Medal className="w-3 h-3 text-slate-400" />
                                                                2nd{secondData.length > 1 ? `(${idx + 1})` : ''}: {getStudentName(winner.studentId || winner)}
                                                                <span className="font-bold text-slate-600">
                                                                    ({winner.grade || ev.results.secondGrade}
                                                                    {(winner.mark || ev.results.secondMark) ? `-${winner.mark || ev.results.secondMark}` : ''}
                                                                    {(winner.codeLetter || ev.results.secondCodeLetter) ? ` | ${winner.codeLetter || ev.results.secondCodeLetter}` : ''})
                                                                </span>
                                                            </div>
                                                        ));
                                                    })()}

                                                    {/* Third Place - handle both array and single value */}
                                                    {(() => {
                                                        const thirdData = Array.isArray(ev.results.third) ? ev.results.third :
                                                            ev.results.third ? [{ studentId: ev.results.third, grade: ev.results.thirdGrade, mark: ev.results.thirdMark, codeLetter: ev.results.thirdCodeLetter }] : [];
                                                        return thirdData.map((winner: any, idx: number) => (
                                                            <div key={idx} className="flex items-center gap-1">
                                                                <Medal className="w-3 h-3 text-amber-600" />
                                                                3rd{thirdData.length > 1 ? `(${idx + 1})` : ''}: {getStudentName(winner.studentId || winner)}
                                                                <span className="font-bold text-amber-700">
                                                                    ({winner.grade || ev.results.thirdGrade}
                                                                    {(winner.mark || ev.results.thirdMark) ? `-${winner.mark || ev.results.thirdMark}` : ''}
                                                                    {(winner.codeLetter || ev.results.thirdCodeLetter) ? ` | ${winner.codeLetter || ev.results.thirdCodeLetter}` : ''})
                                                                </span>
                                                            </div>
                                                        ));
                                                    })()}

                                                    {ev.results.others && ev.results.others.length > 0 && (
                                                        <div className="text-[10px] text-slate-400 mt-1 space-y-0.5">
                                                            {ev.results.others.map((other: any, idx: number) => (
                                                                <div key={idx}>
                                                                    #{idx + 4}: {getStudentName(other.studentId)}
                                                                    <span className="font-bold ml-1">
                                                                        ({other.grade}
                                                                        {other.mark ? `-${other.mark}` : ''}
                                                                        {other.codeLetter ? ` | ${other.codeLetter}` : ''})
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" onClick={() => handleEdit(ev)} className="bg-slate-900 text-white hover:bg-slate-700">
                                                    <Edit className="w-4 h-4 mr-2" /> {ev.status === "completed" ? "Edit" : "Add"}
                                                </Button>
                                                {ev.status === "completed" && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handlePrint(ev)}
                                                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <Printer className="w-4 h-4 mr-2" /> Print
                                                        </Button>
                                                        <Button size="icon" variant="destructive" className="h-9 w-9 bg-red-100 text-red-600 hover:bg-red-200 shadow-none border-none" onClick={() => handleDelete(ev._id)}>
                                                            <Trash2 className="w-4 h-4" />
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
                </Card>

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
                                            <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-yellow-100">
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
                                                    {winner.grade ? `+${getPoints(winner.grade, editingEvent, 'first')} pts` : '-'}
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
                                            <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-slate-100">
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
                                                    {winner.grade ? `+${getPoints(winner.grade, editingEvent, 'second')} pts` : '-'}
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
                                            <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-orange-100">
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
                                                    {winner.grade ? `+${getPoints(winner.grade, editingEvent, 'third')} pts` : '-'}
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
                                            <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-blue-100">
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
                                                    {other.grade ? `+${getPoints(other.grade, editingEvent, 'other')} pts` : '-'}
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
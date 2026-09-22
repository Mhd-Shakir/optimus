"use client"

import { useState, useEffect, useMemo } from "react"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Loader2, Printer, Award, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function TrophyDistributionPage() {
    const { toast } = useToast()
    const [events, setEvents] = useState<any[]>([])
    const [students, setStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [activeTab, setActiveTab] = useState("All")
    const [activeClass, setActiveClass] = useState("All")
    const [viewType, setViewType] = useState<'events' | 'students' | 'distributed'>('events')
    const [distributedEvents, setDistributedEvents] = useState<string[]>([])

    // Load distributed events from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('distributedTrophies')
        if (stored) {
            try {
                setDistributedEvents(JSON.parse(stored))
            } catch (e) {}
        }
    }, [])

    const toggleDistributed = (eventId: string) => {
        const newDist = distributedEvents.includes(eventId)
            ? distributedEvents.filter(id => id !== eventId)
            : [...distributedEvents, eventId];
        setDistributedEvents(newDist);
        localStorage.setItem('distributedTrophies', JSON.stringify(newDist));
    }
    
    const tabs = ["All", "Protons", "Nexus", "Cosmos", "General-A", "General-B"]

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [eventsRes, studentsRes] = await Promise.all([
                    axios.get('/api/events'),
                    axios.get('/api/student/list')
                ])

                // Filter only completed or announced events
                const completedEvents = eventsRes.data.filter((ev: any) => ev.status === "completed" || ev.status === "announced");
                
                // Sort by name or category
                completedEvents.sort((a: any, b: any) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

                setEvents(completedEvents)
                setStudents(studentsRes.data)
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Failed to load data" })
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [toast])

    const studentTrophyCounts = useMemo(() => {
        const counts: Record<string, { first: number, second: number, third: number }> = {};
        events.forEach(ev => {
            const addCounts = (winners: any, position: 'first' | 'second' | 'third') => {
                if (!winners) return;
                const arr = Array.isArray(winners) ? winners : (typeof winners === 'string' && winners.trim() !== '' ? [{ studentId: winners }] : []);
                arr.forEach(w => {
                    if (w.studentId) {
                        if (!counts[w.studentId]) counts[w.studentId] = { first: 0, second: 0, third: 0 };
                        counts[w.studentId][position]++;
                    }
                });
            }
            if (ev.results) {
                addCounts(ev.results.first, 'first');
                addCounts(ev.results.second, 'second');
                addCounts(ev.results.third, 'third');
            }
        });
        return counts;
    }, [events]);

    const getStudentDetails = (id: string) => {
        return students.find(std => std._id === id) || null
    }

    // Prepare student list for the "students" view
    const studentWinnersList = useMemo(() => {
        return students.map(student => {
            const counts = studentTrophyCounts[student._id] || { first: 0, second: 0, third: 0 };
            return { ...counts, studentId: student._id, student };
        }).sort((a, b) => {
            // Sort by first places, then second, then third
            if (b.first !== a.first) return b.first - a.first;
            if (b.second !== a.second) return b.second - a.second;
            if (b.third !== a.third) return b.third - a.third;
            // Then sort alphabetically
            return a.student.name.localeCompare(b.student.name);
        });
    }, [studentTrophyCounts, students]);

    const renderWinners = (winnersData: any, positionLabel: string, icon: any, colorClass: string, isGroupEvent: boolean) => {
        if (!winnersData) return null;
        
        let winnersArray = Array.isArray(winnersData) 
            ? winnersData 
            : typeof winnersData === 'string' && winnersData.trim() !== ''
                ? [{ studentId: winnersData }]
                : [];

        if (winnersArray.length === 0 || !winnersArray[0].studentId) return null;

        if (isGroupEvent) {
            // Group by groupNo (or team as fallback) to handle ties
            const grouped = new Map();
            winnersArray.forEach(w => {
                const student = getStudentDetails(w.studentId);
                const key = w.groupNo || student?.team || 'unknown';
                if (!grouped.has(key)) grouped.set(key, []);
                grouped.get(key).push(w);
            });
            
            const filteredArray = [];
            for (const group of grouped.values()) {
                const captain = group.find((w: any) => w.isCaptain);
                filteredArray.push(captain || group[0]);
            }
            winnersArray = filteredArray;
        }

        return (
            <div className={`mt-2 p-2 rounded-md border ${colorClass} flex items-start gap-3`}>
                <div className="mt-1">{icon}</div>
                <div className="flex-1 space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider opacity-80">{positionLabel}</p>
                    {winnersArray.map((winner, idx) => {
                        if (!winner.studentId) return null;
                        const student = getStudentDetails(winner.studentId);
                        if (!student) return null;
                        
                        const counts = studentTrophyCounts[winner.studentId];
                        
                        
                        return (
                            <div key={idx} className="flex justify-between items-center text-sm">
                                <div className="font-medium">
                                    {student.name} <span className="text-xs opacity-70">({student.chest_no || student.chestNo})</span>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="text-[10px] bg-white/50">{student.team}</Badge>
                                    {winner.grade && <Badge className="text-[10px]">{winner.grade}</Badge>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    const filteredEvents = events.filter(ev => {
        const matchesSearch = ev.name.toLowerCase().includes(searchTerm.toLowerCase())
        if (!matchesSearch) return false;
        if (activeTab !== "All" && ev.category !== activeTab) return false;
        
        const isDistributed = distributedEvents.includes(ev._id);
        if (viewType === 'events' && isDistributed) return false;
        if (viewType === 'distributed' && !isDistributed) return false;

        return true;
    })

    const filteredStudentWinnersList = studentWinnersList.filter(item => {
        if (!item.student) return false;
        const matchesSearch = item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (item.student.chest_no || item.student.chestNo)?.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        if (activeTab !== "All" && item.student.category !== activeTab) return false;
        if (activeClass !== "All" && item.student.studentClass !== activeClass) return false;
        return true;
    });

    const uniqueClasses = useMemo(() => {
        const classes = new Set(students.map(s => s.studentClass).filter(Boolean));
        return Array.from(classes).sort((a: any, b: any) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.toString().localeCompare(b.toString());
        });
    }, [students]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center space-y-3">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-emerald-600" />
                    <p className="text-slate-500 font-medium">Loading Trophy Data...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Trophy Distribution</h1>
                    <p className="text-muted-foreground mt-1">List of completed events and their winners for trophy distribution.</p>
                </div>
                <Button onClick={() => window.print()} className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm">
                    <Printer className="w-4 h-4" /> Print List
                </Button>
            </div>

            {/* Print Header - Only visible when printing */}
            <div className="hidden print:block mb-8 border-b pb-4">
                <h1 className="text-3xl font-black text-center uppercase tracking-widest">
                    {viewType === 'events' ? 'Trophy Distribution List (By Event)' : 'Trophy Summary (By Student)'}
                </h1>
                <p className="text-center text-sm text-gray-500 mt-2">Generated on {new Date().toLocaleDateString()}</p>
            </div>

            {/* Filters - Hidden when printing */}
            <div className="print:hidden space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex p-1 bg-slate-200/50 rounded-lg shrink-0 overflow-x-auto custom-scrollbar">
                        <button
                            onClick={() => setViewType('events')}
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-all whitespace-nowrap ${viewType === 'events' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Pending
                        </button>
                        <button
                            onClick={() => setViewType('distributed')}
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-all whitespace-nowrap ${viewType === 'distributed' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-emerald-600'}`}
                        >
                            Distributed
                        </button>
                        <button
                            onClick={() => setViewType('students')}
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-all whitespace-nowrap ${viewType === 'students' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            By Student
                        </button>
                    </div>

                    <div className="bg-white p-2 rounded-lg border shadow-sm flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder={viewType === 'events' ? "Search Event..." : "Search Student or Chest No..."}
                                className="pl-9 bg-transparent border-none focus-visible:ring-0 shadow-none h-8" 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
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

                    {viewType === 'students' && uniqueClasses.length > 0 && (
                        <div className="flex p-1 bg-slate-100 rounded-lg overflow-x-auto w-full md:w-fit custom-scrollbar">
                            <button
                                onClick={() => setActiveClass("All")}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${activeClass === "All"
                                    ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                                    : "text-slate-500 hover:text-blue-600"
                                    }`}
                            >
                                All Classes
                            </button>
                            {uniqueClasses.map((cls) => (
                                <button
                                    key={cls}
                                    onClick={() => setActiveClass(cls)}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${activeClass === cls
                                        ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                                        : "text-slate-500 hover:text-blue-600"
                                        }`}
                                >
                                    Class {cls}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {viewType === 'events' || viewType === 'distributed' ? (
                filteredEvents.length === 0 ? (
                    <Card className="print:hidden">
                        <CardContent className="py-12 text-center text-slate-500">
                            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No {viewType === 'events' ? 'pending' : 'distributed'} events matching your filters were found.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
                        {filteredEvents.map((ev, index) => {
                            const hasWinners = ev.results && (ev.results.first || ev.results.second || ev.results.third);
                            if (!hasWinners) return null;

                            const isDistributed = distributedEvents.includes(ev._id);

                            return (
                                <Card key={ev._id} className={`overflow-hidden border-2 shadow-sm break-inside-avoid transition-all ${isDistributed ? 'opacity-75 bg-slate-50 grayscale-[0.2]' : ''}`}>
                                    <CardHeader className="bg-slate-100 py-3 border-b flex flex-row items-center justify-between">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="bg-slate-800 text-white text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                                                #{index + 1}
                                            </span>
                                            <CardTitle className="text-base flex items-center">
                                                <span className="font-bold text-slate-800 truncate">{ev.name}</span>
                                                <Badge variant="secondary" className="text-[10px] whitespace-nowrap ml-2 bg-white border-slate-200">
                                                    {ev.category}
                                                </Badge>
                                            </CardTitle>
                                        </div>
                                        
                                        <div className="flex items-center ml-2 shrink-0">
                                            <label className="flex items-center gap-1.5 cursor-pointer hover:bg-slate-200/50 p-1 rounded-md transition-colors">
                                                <input 
                                                    type="checkbox" 
                                                    checked={isDistributed} 
                                                    onChange={() => toggleDistributed(ev._id)} 
                                                    className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                                />
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDistributed ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                    Distributed
                                                </span>
                                            </label>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-3">
                                        {renderWinners(
                                            ev.results?.first, 
                                            "First Place", 
                                            <Trophy className="w-5 h-5 text-yellow-500" />, 
                                            "bg-yellow-50 border-yellow-200 text-yellow-900",
                                            ev.groupEvent
                                        )}
                                        {renderWinners(
                                            ev.results?.second, 
                                            "Second Place", 
                                            <Medal className="w-5 h-5 text-slate-400" />, 
                                            "bg-slate-50 border-slate-200 text-slate-800",
                                            ev.groupEvent
                                        )}
                                        {renderWinners(
                                            ev.results?.third, 
                                            "Third Place", 
                                            <Award className="w-5 h-5 text-orange-400" />, 
                                            "bg-orange-50 border-orange-200 text-orange-900",
                                            ev.groupEvent
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )
            ) : (
                <Card className="shadow-sm border-2 overflow-hidden">
                    <div className="overflow-x-auto w-full">
                        <Table className="w-full text-sm">
                            <TableHeader className="bg-slate-100">
                                <TableRow>
                                    <TableHead className="w-12">SI</TableHead>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead>Chest No</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Team</TableHead>
                                    <TableHead className="text-center font-bold text-yellow-600"><Trophy className="w-4 h-4 mx-auto mb-1"/> First</TableHead>
                                    <TableHead className="text-center font-bold text-slate-500"><Medal className="w-4 h-4 mx-auto mb-1"/> Second</TableHead>
                                    <TableHead className="text-center font-bold text-orange-600"><Award className="w-4 h-4 mx-auto mb-1"/> Third</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStudentWinnersList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                                            No students found matching your filters.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStudentWinnersList.map((item, idx) => (
                                        <TableRow key={item.studentId}>
                                            <TableCell className="font-medium text-slate-500">{idx + 1}</TableCell>
                                            <TableCell className="font-bold text-slate-800">{item.student.name}</TableCell>
                                            <TableCell>{item.student.chest_no || item.student.chestNo}</TableCell>
                                            <TableCell><Badge variant="outline" className="text-[10px] bg-slate-50">{item.student.studentClass || '-'}</Badge></TableCell>
                                            <TableCell><Badge variant="secondary" className="text-[10px]">{item.student.category}</Badge></TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`text-[10px] ${item.student.team === 'Ignis' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-violet-50 text-violet-700 border-violet-200'}`}>
                                                    {item.student.team}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center text-yellow-700 font-bold bg-yellow-50/30">
                                                {item.first > 0 ? item.first : "-"}
                                            </TableCell>
                                            <TableCell className="text-center text-slate-600 font-bold bg-slate-50/50">
                                                {item.second > 0 ? item.second : "-"}
                                            </TableCell>
                                            <TableCell className="text-center text-orange-700 font-bold bg-orange-50/30">
                                                {item.third > 0 ? item.third : "-"}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}
        </div>
    )
}

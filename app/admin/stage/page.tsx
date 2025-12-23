"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Search, CheckCircle2, RefreshCw, Mic2, ArrowLeft, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

export default function AdminStagePage() {
    const { toast } = useToast()
    const [events, setEvents] = useState<any[]>([])
    const [students, setStudents] = useState<any[]>([])
    
    // Selection States
    const [selectedEventId, setSelectedEventId] = useState("")
    const [searchTerm, setSearchTerm] = useState("")
    const [activeTab, setActiveTab] = useState("All")
    
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        axios.get('/api/events').then(res => setEvents(res.data));
    }, [])

    const fetchStudents = async () => {
        if (!selectedEventId) return;
        setRefreshing(true);
        try {
            const res = await axios.get('/api/student/list');
            const eventStudents = res.data.filter((s:any) => s.registeredEvents.some((e:any) => e.eventId === selectedEventId));
            setStudents(eventStudents);
        } catch (err) { console.error(err); } 
        finally { setRefreshing(false); }
    }

    useEffect(() => {
        if (selectedEventId) {
            fetchStudents();
            const interval = setInterval(fetchStudents, 15000);
            return () => clearInterval(interval);
        }
    }, [selectedEventId]);

    const markReported = async (studentId: string) => {
        try {
            await axios.post('/api/stage/update', { studentId, eventId: selectedEventId, status: "reported" });
            toast({ title: "Confirmed ✅", description: "Student reported on stage." });
            fetchStudents();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Update failed" });
        }
    }

    const filteredEvents = events.filter(ev => {
        const matchSearch = ev.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchTab = activeTab === "All" || ev.category === activeTab;
        return matchSearch && matchTab;
    });

    const categories = ["All", "Alpha", "Beta", "Omega", "General-A", "General-B"];
    const selectedEvent = events.find(e => e._id === selectedEventId);

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        <Mic2 className="w-8 h-8 text-purple-600" /> Stage Management
                    </h1>
                    <p className="text-slate-500">Monitor live stages and mark student attendance.</p>
                </div>
                {selectedEventId && (
                    <Button variant="outline" onClick={() => setSelectedEventId("")} className="bg-white">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Change Event
                    </Button>
                )}
            </div>

            {!selectedEventId ? (
                // --- SELECTION SCREEN ---
                <div className="space-y-6">
                    <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search Event Name..." 
                                className="pl-9 h-11 text-lg" 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveTab(cat)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                                        activeTab === cat 
                                        ? "bg-purple-600 text-white shadow-md" 
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredEvents.length === 0 ? (
                            <div className="col-span-full text-center py-10 text-slate-400">No events found.</div>
                        ) : filteredEvents.map(ev => (
                            <div 
                                key={ev._id} 
                                onClick={() => setSelectedEventId(ev._id)}
                                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-purple-400 hover:shadow-md cursor-pointer transition-all group"
                            >
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-slate-800 group-hover:text-purple-700">{ev.name}</h3>
                                    <Badge variant="secondary" className="text-[10px]">{ev.category}</Badge>
                                </div>
                                <p className="text-xs text-slate-400 mt-2 font-medium uppercase">{ev.type}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // --- MANAGEMENT SCREEN ---
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 border-b bg-slate-50/50">
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-800">{selectedEvent?.name}</CardTitle>
                            <div className="flex gap-2 mt-1">
                                <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">{selectedEvent?.category}</Badge>
                                <Badge variant="outline" className="bg-white text-slate-500">Participants: {students.length}</Badge>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={fetchStudents} disabled={refreshing}>
                            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} /> Refresh
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {students.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">No participants found for this event.</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {students
                                .sort((a,b) => {
                                    const getStatus = (s:any) => s.registeredEvents.find((e:any) => e.eventId === selectedEventId)?.status || 'registered';
                                    const score = (status:string) => status === 'sent' ? 0 : status === 'registered' ? 1 : 2;
                                    return score(getStatus(a)) - score(getStatus(b));
                                })
                                .map(student => {
                                    const eventData = student.registeredEvents.find((e:any) => e.eventId === selectedEventId);
                                    const status = eventData?.status || "registered";

                                    return (
                                        <div key={student._id} className={`p-4 flex items-center justify-between transition-all hover:bg-slate-50 ${status === 'sent' ? 'bg-yellow-50/50' : ''}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border ${student.team === 'Auris' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                                    {student.chestNo}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900">{student.name}</h3>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="text-[10px] h-5">{student.team}</Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                {status === "registered" && (
                                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">Waiting</span>
                                                )}
                                                {status === "sent" && (
                                                    <div className="flex items-center gap-3">
                                                        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 animate-pulse">Sent by Team</Badge>
                                                        <Button size="sm" onClick={() => markReported(student._id)} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 shadow-sm">
                                                            <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Present
                                                        </Button>
                                                    </div>
                                                )}
                                                {status === "reported" && (
                                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-3 py-1.5 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> Reported
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
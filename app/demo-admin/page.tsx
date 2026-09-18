"use client"

import { useState } from "react"
import { Users, Calendar, Trophy, ClipboardList, Star, PenTool, Lock, Unlock, Power, Settings, UserCog, ShieldCheck, Award, QrCode, LayoutDashboard, Mic2, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DemoSidebar } from "@/components/demo-sidebar"

// --- COMPONENTS ---

function StatCard({ title, value, icon: Icon, description }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function ChampionCard({ title, student, icon: Icon, subTitle }: any) {
    if (!student) return (
        <Card className="bg-slate-50 border-dashed border-2 flex flex-col justify-center items-center py-6 h-full">
            <Icon className="h-8 w-8 text-slate-300 mb-2" />
            <h3 className="text-sm font-medium text-slate-500">{title}</h3>
            <p className="text-xs text-slate-400">Not declared yet</p>
        </Card>
    )
    return (
        <Card className="border-l-4 border-l-yellow-500 shadow-sm relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Icon className="h-24 w-24 text-yellow-500" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                <CardTitle className="text-sm font-bold text-yellow-700 uppercase tracking-wider">{title}</CardTitle>
                <Icon className="h-5 h-5 text-yellow-500" />
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="text-2xl font-black text-slate-800 truncate" title={student.name}>{student.name}</div>
                <div className="flex gap-2 mt-2">
                     <Badge variant="outline" className="text-xs bg-white">{student.chestNo}</Badge>
                     <Badge className={student.team === "Ignis" ? "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200" : "bg-violet-100 text-violet-700 hover:bg-violet-200 border-violet-200"}>
                        {student.team}
                     </Badge>
                     <Badge variant="outline" className="text-xs bg-slate-100 text-slate-600">{student.category}</Badge>
                </div>
                <div className="mt-4 pt-3 border-t border-dashed">
                    <p className="text-xs text-slate-500 font-medium">
                        {subTitle}: <span className="text-lg font-bold text-slate-700 ml-1">
                            {title.includes("Star") ? student.stagePoints : student.nonStagePoints}
                        </span> pts
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

// --- MAIN DASHBOARD PAGE ---
export default function DemoAdminDashboard() {
  const { toast } = useToast()

  // MOCK DATA
  const [stats] = useState<any>({
    counts: { students: 185, events: 42, results: 28, registrations: 340 },
    scores: { "Ignis": 415, "Ventus": 398 },
    champions: {
        star: { name: "Ahmed Raza", chestNo: "1024", team: "Ignis", category: "Protons", stagePoints: 55 },
        pen: { name: "John Doe", chestNo: "2048", team: "Ventus", category: "Nexus", nonStagePoints: 40 },
        protons: {
            star: { name: "Ahmed Raza", chestNo: "1024", team: "Ignis", stagePoints: 55 },
            pen: { name: "Sammy K", chestNo: "1150", team: "Ignis", nonStagePoints: 25 },
            rankedStar: [{ name: "Ahmed Raza", chestNo: "1024", team: "Ignis", stagePoints: 55, events: [{eventName: "Elocution", isStage: true, mark: "A+", position: "First", points: 25, isStar: true, isPublished: true}, {eventName: "Debate", isStage: true, mark: null, position: null, points: 0, isStar: false, isPublished: false}] }, { name: "Demo User", chestNo: "1000", team: "Ventus", stagePoints: 40, events: [] }],
            rankedPen: [{ name: "Sammy K", chestNo: "1150", team: "Ignis", nonStagePoints: 25, events: [{eventName: "Essay Writing", isStage: false, mark: "A", position: "Second", points: 15, isStar: false}] }]
        },
        nexus: {
            star: { name: "David L", chestNo: "2201", team: "Ventus", stagePoints: 42 },
            pen: { name: "John Doe", chestNo: "2048", team: "Ventus", nonStagePoints: 40 },
            rankedStar: [{ name: "David L", chestNo: "2201", team: "Ventus", stagePoints: 42, events: [] }],
            rankedPen: [{ name: "John Doe", chestNo: "2048", team: "Ventus", nonStagePoints: 40, events: [] }]
        },
        cosmos: {
            star: { name: "Hassan S", chestNo: "3305", team: "Ignis", stagePoints: 38 },
            pen: null,
            rankedStar: [{ name: "Hassan S", chestNo: "3305", team: "Ignis", stagePoints: 38, events: [] }],
            rankedPen: []
        }
    }
  })
  
  // Registration Control
  const [regOpen, setRegOpen] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [categorySettings, setCategorySettings] = useState<Record<string, boolean>>({
      'Cosmos': true, 'Nexus': true, 'Protons': true, 'General-A': true, 'General-B': true
  })
  
  // Admin Credentials Modal
  const [isCredModalOpen, setIsCredModalOpen] = useState(false)
  const [credData, setCredData] = useState({ currentUsername: "", oldPassword: "", newUsername: "", newPassword: "" })
  
  // Team Credentials Modal
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)
  const [teamCredData, setTeamCredData] = useState({ team: "", newUsername: "", newPassword: "" })
  const [updating, setUpdating] = useState(false)
  
  // Staff Credentials
  const [staffCredData, setStaffCredData] = useState({ role: "", newUsername: "", newPassword: "" })

  // Category Champions Top 10 Modal
  const [isChampionsModalOpen, setIsChampionsModalOpen] = useState(false)
  const [selectedChampionsData, setSelectedChampionsData] = useState<{cat: string, data: any} | null>(null)
  
  // Student Events Modal
  const [selectedStudentForEvents, setSelectedStudentForEvents] = useState<any>(null)
  const [selectedEventType, setSelectedEventType] = useState<'stage' | 'non-stage' | null>(null)

  const demoToast = () => {
    toast({
        title: "Demo Mode 🛡️",
        description: "This is a demo. No data was actually changed."
    })
  }

  // Toggle Registration
  const toggleRegistration = () => {
    setToggling(true)
    setTimeout(() => {
        const newState = !regOpen
        setRegOpen(newState)
        toast({ 
            title: newState ? "Registration OPENED 🟢" : "Registration CLOSED 🔴",
            description: "Demo Mode: Action simulated locally."
        })
        setToggling(false)
    }, 500)
  }

  // Toggle Category
  const toggleCategory = (category: string, currentState: boolean) => {
    const newState = !currentState;
    setCategorySettings(prev => ({ ...prev, [category]: newState }))
    toast({ 
        title: newState ? `${category} OPENED 🟢` : `${category} CLOSED 🔴`,
        description: "Demo Mode: Action simulated locally."
    })
  }

  // Handle Updates
  const handleUpdateCreds = (e: React.FormEvent) => { e.preventDefault(); setUpdating(true); setTimeout(() => { demoToast(); setIsCredModalOpen(false); setUpdating(false); }, 1000); }
  const handleUpdateTeamCreds = (e: React.FormEvent) => { e.preventDefault(); setUpdating(true); setTimeout(() => { demoToast(); setIsTeamModalOpen(false); setUpdating(false); }, 1000); }
  const handleUpdateStaffCreds = (e: React.FormEvent) => { e.preventDefault(); setUpdating(true); setTimeout(() => { demoToast(); setIsCredModalOpen(false); setUpdating(false); }, 1000); }

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans">
      <DemoSidebar />

      <main className="flex-1 md:ml-64 p-6 pt-16 md:p-10 md:pt-10">
        <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Live overview of the event <Badge variant="secondary" className="ml-2 bg-yellow-200 text-yellow-800 border-yellow-300">DEMO MODE</Badge></p>
        </div>

        {/* --- CONTROL PANEL --- */}
        <div className="flex flex-wrap gap-4 md:gap-6 w-full md:w-auto">
            
            {/* 1. Registration Toggle */}
            <div className="bg-white p-2 pr-4 rounded-xl border shadow-sm flex items-center gap-4 flex-1 md:flex-none min-w-[200px]">
                <div className={`p-3 rounded-lg ${regOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {regOpen ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Registration</p>
                    <p className={`font-black text-sm ${regOpen ? "text-green-600" : "text-red-600"}`}>
                        {regOpen ? "ACTIVE" : "CLOSED"}
                    </p>
                </div>
                <Button 
                    onClick={toggleRegistration} 
                    disabled={toggling}
                    variant={regOpen ? "destructive" : "default"}
                    size="sm"
                    className="ml-auto font-bold shadow-sm"
                >
                    {toggling ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Power className="w-4 h-4" />}
                </Button>
            </div>

            {/* 2. Team Settings Button */}
            <Button 
                onClick={() => setIsTeamModalOpen(true)}
                className="h-auto bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 gap-3 shadow-sm rounded-xl px-5 py-3"
            >
                <Users className="w-5 h-5 text-blue-500" />
                <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-slate-400 uppercase">Manage</p>
                    <p className="font-bold text-sm">Teams</p>
                </div>
            </Button>

            {/* 3. Admin Settings Button */}
            <Button 
                onClick={() => setIsCredModalOpen(true)}
                className="h-auto bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 gap-3 shadow-sm rounded-xl px-5 py-3"
            >
                <Settings className="w-5 h-5 text-slate-600" />
                <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-slate-400 uppercase">Admin</p>
                    <p className="font-bold text-sm">Settings</p>
                </div>
            </Button>
        </div>
      </div>

      {/* 1.5 CATEGORY CONTROLS */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
          <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <ClipboardList className="w-4 h-4 text-emerald-600" /> Category Registration Limits
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {['Cosmos', 'Nexus', 'Protons', 'General-A', 'General-B'].map((cat) => {
                  const isOpen = categorySettings[cat] ?? true;
                  return (
                      <div key={cat} className="p-3 border rounded-lg flex flex-col items-center gap-2 bg-slate-50/50">
                          <span className="font-bold text-slate-700 text-xs uppercase">{cat}</span>
                          <Button 
                              onClick={() => toggleCategory(cat, isOpen)} 
                              variant={isOpen ? "outline" : "destructive"}
                              size="sm"
                              className={`w-full h-8 text-xs font-bold ${isOpen ? "text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100" : ""}`}
                          >
                              {isOpen ? "OPEN" : "CLOSED"}
                          </Button>
                      </div>
                  )
              })}
          </div>
      </div>

      {/* 1. TOP STATS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Students" value={stats.counts.students} icon={Users} description="Registered participants" />
        <StatCard title="Total Events" value={stats.counts.events} icon={Calendar} description="Items scheduled" />
        <StatCard title="Results Declared" value={stats.counts.results} icon={Trophy} description="Completed events" />
        <StatCard title="Registrations" value={stats.counts.registrations} icon={ClipboardList} description="Active participations" />
      </div>

      {/* 2. TEAM SCORES */}
      <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200 shadow-sm overflow-hidden relative">
             <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-amber-100/50 to-transparent"></div>
             <CardHeader><CardTitle className="text-amber-700 flex items-center gap-2 relative z-10"><Trophy className="w-5 h-5"/> Ignis</CardTitle></CardHeader>
             <CardContent className="relative z-10">
                <div className="text-6xl font-black text-amber-500 tracking-tighter">{stats.scores["Ignis"]}</div>
                <p className="text-sm text-amber-600/80 mt-1 font-medium">Total Points</p>
             </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-50 to-white border-violet-200 shadow-sm overflow-hidden relative">
             <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-violet-100/50 to-transparent"></div>
             <CardHeader><CardTitle className="text-violet-700 flex items-center gap-2 relative z-10"><Trophy className="w-5 h-5"/> Ventus</CardTitle></CardHeader>
             <CardContent className="relative z-10">
                <div className="text-6xl font-black text-violet-500 tracking-tighter">{stats.scores["Ventus"]}</div>
                <p className="text-sm text-violet-600/80 mt-1 font-medium">Total Points</p>
             </CardContent>
          </Card>
      </div>

      {/* 3. GLOBAL FEST CHAMPIONS */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> Overall Fest Champions
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
            <ChampionCard title="Star of the Fest" student={stats.champions?.star} icon={Star} subTitle="Stage Score" />
            <ChampionCard title="Pen of the Fest" student={stats.champions?.pen} icon={PenTool} subTitle="Non-Stage Score" />
        </div>
      </div>

      {/* 4. CATEGORY CHAMPIONS */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-slate-600" /> Category Champions
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
            {['Protons', 'Nexus', 'Cosmos'].map((cat) => {
                const catData = stats.champions?.[cat.toLowerCase()];
                return (
                    <Card key={cat} className="overflow-hidden flex flex-col border-2 cursor-pointer hover:border-slate-400 transition-colors" onClick={() => {
                        setSelectedChampionsData({cat, data: catData})
                        setIsChampionsModalOpen(true)
                    }}>
                        <CardHeader className="bg-gradient-to-r from-slate-100 to-slate-50 py-3 border-b-2 border-slate-200">
                            <CardTitle className="text-sm font-black text-center uppercase tracking-wider text-slate-700 flex items-center justify-center gap-2">
                                <Award className="w-4 h-4" /> {cat} Category
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 flex flex-col divide-y divide-slate-100">
                            <div className="p-4 flex items-center justify-between hover:bg-yellow-50/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center shadow-sm">
                                        <Star className="w-5 h-5 text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Star of {cat}</p>
                                        {catData?.star ? (
                                            <>
                                                <p className="font-bold text-sm text-slate-800 line-clamp-1">{catData.star.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge variant="outline" className="text-[9px] h-4 px-1">{catData.star.chestNo}</Badge>
                                                    <Badge className={catData.star.team === "Ignis" ? "text-[9px] h-4 px-1 bg-amber-100 text-amber-700" : "text-[9px] h-4 px-1 bg-violet-100 text-violet-700"}>
                                                        {catData.star.team}
                                                    </Badge>
                                                    <span className="text-[10px] font-bold text-emerald-600">{catData.star.stagePoints} pts</span>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic">Not declared</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 flex items-center justify-between hover:bg-teal-50/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center shadow-sm">
                                        <PenTool className="w-5 h-5 text-teal-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pen of {cat}</p>
                                        {catData?.pen ? (
                                            <>
                                                <p className="font-bold text-sm text-slate-800 line-clamp-1">{catData.pen.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge variant="outline" className="text-[9px] h-4 px-1">{catData.pen.chestNo}</Badge>
                                                    <Badge className={catData.pen.team === "Ignis" ? "text-[9px] h-4 px-1 bg-amber-100 text-amber-700" : "text-[9px] h-4 px-1 bg-violet-100 text-violet-700"}>
                                                        {catData.pen.team}
                                                    </Badge>
                                                    <span className="text-[10px] font-bold text-blue-600">{catData.pen.nonStagePoints} pts</span>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic">Not declared</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
      </div>

      {/* --- MODAL: ALL CHAMPIONS --- */}
      <Dialog open={isChampionsModalOpen} onOpenChange={setIsChampionsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 uppercase tracking-wider"><Award className="w-5 h-5 text-yellow-600"/> {selectedChampionsData?.cat} Category - Rankings</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="star" className="w-full">
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="star">Star of {selectedChampionsData?.cat} (Stage)</TabsTrigger>
                <TabsTrigger value="pen">Pen of {selectedChampionsData?.cat} (Non-Stage)</TabsTrigger>
              </TabsList>

              <TabsContent value="star">
                  <div className="space-y-2">
                      {selectedChampionsData?.data?.rankedStar?.length > 0 ? selectedChampionsData.data.rankedStar.map((student: any, idx: number) => (
                          <div key={idx} 
                               className="p-3 bg-slate-50 border rounded flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                               onClick={() => {
                                   setSelectedStudentForEvents(student);
                                   setSelectedEventType('stage');
                               }}>
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-sm">
                                      #{idx + 1}
                                  </div>
                                  <div>
                                      <p className="font-bold text-slate-800">{student.name}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                          <Badge variant="outline" className="text-[10px]">{student.chestNo}</Badge>
                                          <Badge className={student.team === "Ignis" ? "text-[10px] bg-amber-100 text-amber-700" : "text-[10px] bg-violet-100 text-violet-700"}>
                                              {student.team}
                                          </Badge>
                                      </div>
                                  </div>
                              </div>
                              <div className="font-bold text-emerald-600">
                                  {student.stagePoints} pts
                              </div>
                          </div>
                      )) : <p className="text-sm text-slate-500 italic text-center p-4">No data available</p>}
                  </div>
              </TabsContent>

              <TabsContent value="pen">
                  <div className="space-y-2">
                      {selectedChampionsData?.data?.rankedPen?.length > 0 ? selectedChampionsData.data.rankedPen.map((student: any, idx: number) => (
                          <div key={idx} 
                               className="p-3 bg-slate-50 border rounded flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                               onClick={() => {
                                   setSelectedStudentForEvents(student);
                                   setSelectedEventType('non-stage');
                               }}>
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
                                      #{idx + 1}
                                  </div>
                                  <div>
                                      <p className="font-bold text-slate-800">{student.name}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                          <Badge variant="outline" className="text-[10px]">{student.chestNo}</Badge>
                                          <Badge className={student.team === "Ignis" ? "text-[10px] bg-amber-100 text-amber-700" : "text-[10px] bg-violet-100 text-violet-700"}>
                                              {student.team}
                                          </Badge>
                                      </div>
                                  </div>
                              </div>
                              <div className="font-bold text-blue-600">
                                  {student.nonStagePoints} pts
                              </div>
                          </div>
                      )) : <p className="text-sm text-slate-500 italic text-center p-4">No data available</p>}
                  </div>
              </TabsContent>
            </Tabs>
        </DialogContent>
      </Dialog>

      {/* --- MODAL: STUDENT EVENTS --- */}
      <Dialog open={!!selectedStudentForEvents} onOpenChange={(open) => !open && setSelectedStudentForEvents(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><UserCog className="w-5 h-5 text-slate-600"/> {selectedStudentForEvents?.name}'s Events</DialogTitle>
                <p className="text-sm text-slate-500">Chest No: {selectedStudentForEvents?.chestNo} | Team: {selectedStudentForEvents?.team}</p>
            </DialogHeader>
            <div className="space-y-3 mt-4">
                {selectedStudentForEvents?.events?.filter((ev: any) => selectedEventType === 'stage' ? ev.isStage : !ev.isStage).length > 0 ? selectedStudentForEvents.events.filter((ev: any) => selectedEventType === 'stage' ? ev.isStage : !ev.isStage).map((ev: any, idx: number) => (
                    <div key={idx} className="p-3 border rounded bg-white shadow-sm flex justify-between items-center">
                        <div>
                            <p className="font-bold text-sm text-slate-800">{ev.eventName}</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px]">{ev.isStage ? "Stage" : "Non-Stage"}</Badge>
                                {ev.isPublished === false ? (
                                    <>
                                        <Badge className="bg-slate-100 text-slate-500 text-[10px] hover:bg-slate-200">Upcoming</Badge>
                                        {ev.isStar && <Badge className="bg-emerald-100 text-emerald-800 text-[10px] hover:bg-emerald-100">Star</Badge>}
                                    </>
                                ) : (
                                    <>
                                        {ev.position && <Badge className="bg-yellow-100 text-yellow-800 text-[10px] hover:bg-yellow-100">{ev.position}</Badge>}
                                        {ev.mark && <Badge className="bg-blue-100 text-blue-800 text-[10px] hover:bg-blue-100">Grade {ev.mark}</Badge>}
                                        {ev.isStar && <Badge className="bg-emerald-100 text-emerald-800 text-[10px] hover:bg-emerald-100">Star</Badge>}
                                    </>
                                )}
                            </div>
                        </div>
                        {ev.isPublished !== false ? (
                            <div className={ev.isStage || ev.isStar ? "w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shadow-sm" : "font-black text-slate-400 text-lg"}>
                                +{ev.points}
                            </div>
                        ) : (
                            <div className="text-slate-300">
                                <Clock className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                )) : <p className="text-sm text-slate-500 italic text-center p-4">No events found.</p>}
            </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCredModalOpen} onOpenChange={setIsCredModalOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-emerald-600"/> Manage Access</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="admin" className="w-full">
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="admin">Admin Details</TabsTrigger>
                <TabsTrigger value="staff">Staff Accounts</TabsTrigger>
              </TabsList>

              <TabsContent value="admin">
                <form onSubmit={handleUpdateCreds} className="space-y-4 py-2">
                    <div className="space-y-3 p-3 bg-slate-50 rounded border">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Current Credentials</p>
                        <div className="space-y-1">
                            <Label>Current Username</Label>
                            <Input 
                                value={credData.currentUsername} 
                                onChange={(e) => setCredData({...credData, currentUsername: e.target.value})} 
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Old Password</Label>
                            <Input 
                                type="password"
                                value={credData.oldPassword} 
                                onChange={(e) => setCredData({...credData, oldPassword: e.target.value})} 
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-3 p-3 bg-emerald-50 rounded border border-emerald-100">
                        <p className="text-xs font-bold text-emerald-600 uppercase mb-2">New Credentials</p>
                        <div className="space-y-1">
                            <Label>New Username</Label>
                            <Input 
                                value={credData.newUsername} 
                                onChange={(e) => setCredData({...credData, newUsername: e.target.value})} 
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>New Password</Label>
                            <Input 
                                type="password"
                                value={credData.newPassword} 
                                onChange={(e) => setCredData({...credData, newPassword: e.target.value})} 
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsCredModalOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-slate-900" disabled={updating}>
                            {updating ? "Updating..." : "Update Admin Login"}
                        </Button>
                    </DialogFooter>
                </form>
              </TabsContent>

              <TabsContent value="staff">
                <form onSubmit={handleUpdateStaffCreds} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Select Role</Label>
                        <Select value={staffCredData.role} onValueChange={(val) => setStaffCredData({...staffCredData, role: val})}>
                            <SelectTrigger><SelectValue placeholder="Choose a role" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="announcer">Announcer</SelectItem>
                                <SelectItem value="judge">Judge</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-3 p-4 bg-emerald-50 rounded border border-emerald-100">
                        <p className="text-xs font-bold text-emerald-600 uppercase mb-2 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Set Credentials
                        </p>
                        <div className="space-y-1">
                            <Label>Username</Label>
                            <Input 
                                placeholder="e.g. announcer1"
                                value={staffCredData.newUsername} 
                                onChange={(e) => setStaffCredData({...staffCredData, newUsername: e.target.value})} 
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Password</Label>
                            <Input 
                                type="password"
                                placeholder="••••••••"
                                value={staffCredData.newPassword} 
                                onChange={(e) => setStaffCredData({...staffCredData, newPassword: e.target.value})} 
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setIsCredModalOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={updating}>
                            {updating ? "Saving..." : "Create / Update Account"}
                        </Button>
                    </DialogFooter>
                </form>
              </TabsContent>
            </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isTeamModalOpen} onOpenChange={setIsTeamModalOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><UserCog className="w-5 h-5 text-blue-600"/> Manage Team Credentials</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateTeamCreds} className="space-y-4 py-2">
                
                <div className="space-y-2">
                    <Label>Select Team</Label>
                    <Select value={teamCredData.team} onValueChange={(val) => setTeamCredData({...teamCredData, team: val})}>
                        <SelectTrigger><SelectValue placeholder="Choose a team" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Ignis">Ignis</SelectItem>
                            <SelectItem value="Ventus">Ventus</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-3 p-4 bg-blue-50 rounded border border-blue-100">
                    <p className="text-xs font-bold text-blue-600 uppercase mb-2">Set New Login Details</p>
                    <div className="space-y-1">
                        <Label>New Username</Label>
                        <Input 
                            value={teamCredData.newUsername} 
                            onChange={(e) => setTeamCredData({...teamCredData, newUsername: e.target.value})} 
                            placeholder="e.g. auris_admin"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>New Password</Label>
                        <Input 
                            type="password"
                            value={teamCredData.newPassword} 
                            onChange={(e) => setTeamCredData({...teamCredData, newPassword: e.target.value})} 
                            placeholder="e.g. auris123"
                            required
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsTeamModalOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={updating}>
                        {updating ? "Updating..." : "Update Team Login"}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

        </div>
      </main>
    </div>
  )
}

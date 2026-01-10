"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Users, Calendar, Trophy, ClipboardList, Star, PenTool, Lock, Unlock, Power, Settings, UserCog, ShieldCheck, Award } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

// ✅ UPDATED POINTS SYSTEM - Matches results and team dashboard
const INDIVIDUAL_POINTS: any = { "A+": 11, "A": 10, "B": 7, "C": 5 };
const OTHER_GRADE_POINTS: any = { "A+": 6, "A": 4, "B": 3, "C": 1 };
const GROUP_POINTS: any = { "A+": 25, "A": 20, "B": 13, "C": 7 };

const normalizeString = (str: string) => {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
};

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
                     <Badge className={student.team === "Auris" ? "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200" : "bg-violet-100 text-violet-700 hover:bg-violet-200 border-violet-200"}>
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
export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Registration Control
  const [regOpen, setRegOpen] = useState(true)
  const [toggling, setToggling] = useState(false)
  
  // Admin Credentials Modal
  const [isCredModalOpen, setIsCredModalOpen] = useState(false)
  const [credData, setCredData] = useState({ currentUsername: "", oldPassword: "", newUsername: "", newPassword: "" })
  
  // Team Credentials Modal
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false)
  const [teamCredData, setTeamCredData] = useState({ team: "", newUsername: "", newPassword: "" })
  const [updating, setUpdating] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    // 1. Fetch Stats
    const fetchDashboardData = async () => {
      try {
        const res = await axios.get('/api/dashboard/stats')
        setStats(res.data)
      } catch (error) {
        console.error("Failed to load dashboard stats", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000)

    // 2. Fetch Registration Status
    const fetchSettings = async () => {
        try {
            const res = await axios.get('/api/settings')
            setRegOpen(res.data.registrationOpen)
        } catch (error) {
            console.error("Failed to load settings", error)
        }
    }
    fetchSettings()

    return () => clearInterval(interval)
  }, [])

  // Toggle Registration
  const toggleRegistration = async () => {
    setToggling(true)
    try {
        const newState = !regOpen
        await axios.post('/api/settings', { registrationOpen: newState })
        setRegOpen(newState)
        toast({ 
            title: newState ? "Registration OPENED 🟢" : "Registration CLOSED 🔴",
            description: newState ? "Teams can now register students." : "New registrations are blocked."
        })
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to update settings" })
    } finally {
        setToggling(false)
    }
  }

  // Handle Admin Credentials Update
  const handleUpdateCreds = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    try {
        const res = await axios.post('/api/admin/change-credentials', credData)
        toast({ title: "Success ✅", description: res.data.message })
        setIsCredModalOpen(false)
        setCredData({ currentUsername: "", oldPassword: "", newUsername: "", newPassword: "" })
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed", description: error.response?.data?.error || "Error updating credentials" })
    } finally {
        setUpdating(false)
    }
  }

  // Handle Team Credentials Update
  const handleUpdateTeamCreds = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamCredData.team) return toast({ variant: "destructive", title: "Select Team", description: "Please select a team first." })
    
    setUpdating(true)
    try {
        const res = await axios.post('/api/admin/change-team-credentials', teamCredData)
        toast({ title: "Success ✅", description: res.data.message })
        setIsTeamModalOpen(false)
        setTeamCredData({ team: "", newUsername: "", newPassword: "" })
    } catch (error: any) {
        toast({ variant: "destructive", title: "Failed", description: error.response?.data?.error || "Error updating team credentials" })
    } finally {
        setUpdating(false)
    }
  }

  if (loading || !stats) return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-400 font-medium">Loading Dashboard...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-8 p-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Live overview of the event</p>
        </div>

        {/* --- CONTROL PANEL --- */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
            
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
                className="h-auto bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 gap-2 shadow-sm rounded-xl px-4"
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
                className="h-auto bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 gap-2 shadow-sm rounded-xl px-4"
            >
                <Settings className="w-5 h-5 text-slate-600" />
                <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-slate-400 uppercase">Admin</p>
                    <p className="font-bold text-sm">Settings</p>
                </div>
            </Button>
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
             <CardHeader><CardTitle className="text-amber-700 flex items-center gap-2 relative z-10"><Trophy className="w-5 h-5"/> Team Auris</CardTitle></CardHeader>
             <CardContent className="relative z-10">
                <div className="text-6xl font-black text-amber-500 tracking-tighter">{stats.scores.Auris}</div>
                <p className="text-sm text-amber-600/80 mt-1 font-medium">Total Points</p>
             </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-50 to-white border-violet-200 shadow-sm overflow-hidden relative">
             <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-violet-100/50 to-transparent"></div>
             <CardHeader><CardTitle className="text-violet-700 flex items-center gap-2 relative z-10"><Trophy className="w-5 h-5"/> Team Libras</CardTitle></CardHeader>
             <CardContent className="relative z-10">
                <div className="text-6xl font-black text-violet-500 tracking-tighter">{stats.scores.Libras}</div>
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
            {['Alpha', 'Beta', 'Omega'].map((cat) => {
                const catData = stats.champions?.[cat.toLowerCase()];
                return (
                    <Card key={cat} className="overflow-hidden flex flex-col border-2">
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
                                                    <Badge className={catData.star.team === "Auris" ? "text-[9px] h-4 px-1 bg-amber-100 text-amber-700" : "text-[9px] h-4 px-1 bg-violet-100 text-violet-700"}>
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
                                                    <Badge className={catData.pen.team === "Auris" ? "text-[9px] h-4 px-1 bg-amber-100 text-amber-700" : "text-[9px] h-4 px-1 bg-violet-100 text-violet-700"}>
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

      {/* --- MODAL 1: ADMIN CREDENTIALS --- */}
      <Dialog open={isCredModalOpen} onOpenChange={setIsCredModalOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-600"/> Change Admin Credentials</DialogTitle>
            </DialogHeader>
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
        </DialogContent>
      </Dialog>

      {/* --- MODAL 2: TEAM CREDENTIALS --- */}
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
                            <SelectItem value="Auris">Auris</SelectItem>
                            <SelectItem value="Libras">Libras</SelectItem>
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
  )
}
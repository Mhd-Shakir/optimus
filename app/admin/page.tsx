"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Users, Calendar, Trophy, ClipboardList, Star, PenTool } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
                <Icon className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="text-2xl font-black text-slate-800 truncate" title={student.name}>{student.name}</div>
                <div className="flex gap-2 mt-2">
                     <Badge variant="outline" className="text-xs bg-white">{student.chestNo}</Badge>
                     <Badge className={student.team === "Auris" ? "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200" : "bg-violet-100 text-violet-700 hover:bg-violet-200 border-violet-200"}>
                        {student.team}
                     </Badge>
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

  useEffect(() => {
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
    return () => clearInterval(interval)
  }, [])

  if (loading || !stats) return <div className="flex h-screen items-center justify-center text-slate-400">Loading Dashboard...</div>

  return (
    <div className="space-y-8 p-6 bg-slate-50/50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Live overview of the event</p>
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

      {/* 4. CATEGORY CHAMPIONS (Star & Pen for each) */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-600" /> Category Champions
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
            {['Alpha', 'Beta', 'Omega'].map((cat) => {
                const catData = stats.champions?.[cat.toLowerCase()];
                return (
                    <Card key={cat} className="overflow-hidden flex flex-col">
                        <CardHeader className="bg-slate-100/80 py-3 border-b">
                            <CardTitle className="text-sm font-bold text-center uppercase tracking-wider text-slate-600">{cat} Category</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 flex flex-col divide-y">
                            
                            {/* STAR (Stage) */}
                            <div className="p-3 flex items-center justify-between hover:bg-yellow-50/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                        <Star className="w-4 h-4 text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Star of {cat}</p>
                                        {catData?.star ? (
                                            <>
                                                <p className="font-bold text-sm text-slate-800 line-clamp-1">{catData.star.name}</p>
                                                <p className="text-[10px] text-slate-500">{catData.star.team} • {catData.star.stagePoints} pts</p>
                                            </>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic">Not declared</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* PEN (Non-Stage) */}
                            <div className="p-3 flex items-center justify-between hover:bg-teal-50/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                                        <PenTool className="w-4 h-4 text-teal-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pen of {cat}</p>
                                        {catData?.pen ? (
                                            <>
                                                <p className="font-bold text-sm text-slate-800 line-clamp-1">{catData.pen.name}</p>
                                                <p className="text-[10px] text-slate-500">{catData.pen.team} • {catData.pen.nonStagePoints} pts</p>
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
    </div>
  )
}
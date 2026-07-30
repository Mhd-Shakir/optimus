"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, CheckCircle2, Trophy, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AnnouncerDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"events" | "points">("events");
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, statsRes, historyRes] = await Promise.all([
        fetch("/api/announcer/events"),
        fetch("/api/dashboard/stats"),
        fetch("/api/announcer/history")
      ]);
      
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
      }
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData.milestones || []);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((e) => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Tabs */}
      <div className="flex justify-center border-b border-slate-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("events")}
            className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all ${
              activeTab === "events" 
                ? "text-emerald-600 border-b-2 border-emerald-600" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setActiveTab("points")}
            className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all ${
              activeTab === "points" 
                ? "text-emerald-600 border-b-2 border-emerald-600" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Total Points
          </button>
        </div>
      </div>

      {activeTab === "points" && (
        <div className="space-y-12 animate-in fade-in duration-300">
          {/* Live Overall Team Standings Banner */}
          {stats && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-12 shadow-sm flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Trophy className="w-64 h-64 -mt-10 -mr-10" />
              </div>
              <div className="flex items-center gap-2 mb-8 relative z-10">
                <Trophy className="w-6 h-6 text-emerald-500" />
                <h2 className="text-base font-bold text-slate-500 uppercase tracking-widest">Live Overall Points</h2>
              </div>
              
              <div className="flex flex-row items-center justify-center gap-8 md:gap-32 w-full max-w-3xl relative z-10">
                {/* Ventus Score */}
                <div className="flex flex-col items-center flex-1">
                  <div className="text-6xl md:text-8xl font-black text-sky-600 mb-4">{stats.scores?.Ventus || 0}</div>
                  <div className="px-6 py-2 rounded-full bg-sky-50 text-sky-700 font-bold text-sm tracking-widest uppercase border border-sky-200 shadow-sm">Ventus</div>
                </div>
                
                {/* VS Divider */}
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-slate-200">VS</span>
                </div>
                
                {/* Ignis Score */}
                <div className="flex flex-col items-center flex-1">
                  <div className="text-6xl md:text-8xl font-black text-orange-600 mb-4">{stats.scores?.Ignis || 0}</div>
                  <div className="px-6 py-2 rounded-full bg-orange-50 text-orange-700 font-bold text-sm tracking-widest uppercase border border-orange-200 shadow-sm">Ignis</div>
                </div>
              </div>
            </div>
          )}

          {/* History Milestones */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-800 tracking-tight pl-2 flex items-center gap-3">
              Score History 
              <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-widest">Every 5 Programs</span>
            </h3>
            
            {history.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-slate-400 font-medium">
                Not enough events announced to form a milestone. Wait until 5 events are announced!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {history.map((milestone, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl opacity-50"></div>
                    <div className="flex justify-between items-center mb-8 relative z-10">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">After {milestone.count} Programs</h4>
                    </div>
                    <div className="flex justify-between items-center px-4 relative z-10">
                      <div className="text-center">
                        <div className="text-4xl font-black text-sky-600">{milestone.ventus}</div>
                        <div className="text-xs font-bold text-sky-700 uppercase tracking-widest mt-2">Ventus</div>
                      </div>
                      <div className="text-slate-200 font-black text-lg">VS</div>
                      <div className="text-center">
                        <div className="text-4xl font-black text-orange-600">{milestone.ignis}</div>
                        <div className="text-xs font-bold text-orange-700 uppercase tracking-widest mt-2">Ignis</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "events" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ready to Announce</h1>
              <p className="text-slate-500 mt-1">Select an event below to open the presentation screen.</p>
            </div>
            
            {/* Search */}
            <div className="relative w-full md:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-900 placeholder-slate-400 transition-all shadow-sm"
                placeholder="Search events..."
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p>Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-20 bg-slate-100/50 rounded-3xl border border-slate-200 border-dashed">
              <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-slate-600">No events found</h3>
              <p className="text-slate-500 mt-2">There are no completed results available to announce yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((event, index) => (
                <Link 
                  key={event.id} 
                  href={`/announcer/${event.id}`}
                  className="group block relative"
                >
                  <div className={`p-6 rounded-2xl border transition-all duration-300 h-full flex flex-col ${
                    event.status === 'announced' 
                      ? 'bg-slate-50 border-slate-200 hover:border-slate-300 opacity-80' 
                      : 'bg-white border-slate-200 hover:border-emerald-500/50 hover:shadow-lg hover:-translate-y-1'
                  }`}>
                    
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                        #{index + 1} &middot; {event.category}
                      </span>
                      
                      {event.status === 'announced' ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-200/50 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Announced
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          New Result
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {event.name}
                    </h3>
                    
                    <div className="mt-auto pt-4 flex items-center justify-between text-slate-400 group-hover:text-emerald-600 transition-colors">
                      <span className="text-sm font-bold">Open Presentation</span>
                      <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

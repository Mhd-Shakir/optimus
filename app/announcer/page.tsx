"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, CheckCircle2, Trophy, ArrowRight, ListOrdered, ArrowUp, ArrowDown, X, Save } from "lucide-react";
import Link from "next/link";

export default function AnnouncerDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [currentAnnouncedPoints, setCurrentAnnouncedPoints] = useState<{ventus: number, ignis: number, count: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"events" | "announced" | "points">("events");
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [reorderList, setReorderList] = useState<any[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);
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
        setCurrentAnnouncedPoints(historyData.current || null);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const announcedCount = events.filter((e) => e.status === "announced").length;

  const filteredEvents = events.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.category.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === "events") {
      return e.status !== "announced";
    }
    if (activeTab === "announced") {
      return e.status === "announced";
    }
    return true;
  });

  const openReorderModal = () => {
    const announcedEvents = events.filter(e => e.status === 'announced');
    announcedEvents.sort((a, b) => (a.announcedNumber || 0) - (b.announcedNumber || 0));
    setReorderList([...announcedEvents]);
    setIsReorderOpen(true);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === reorderList.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newList = [...reorderList];
    const item = newList.splice(index, 1)[0];
    newList.splice(targetIndex, 0, item);
    setReorderList(newList);
  };

  const saveReorder = async () => {
    setSavingOrder(true);
    try {
      const res = await fetch("/api/announcer/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventIds: reorderList.map(e => e.id) })
      });
      if (res.ok) {
        await fetchData();
        setIsReorderOpen(false);
      }
    } catch (e) {
      console.error("Reorder save error", e);
    } finally {
      setSavingOrder(false);
    }
  };

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
            New Results
          </button>
          <button
            onClick={() => setActiveTab("announced")}
            className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all ${
              activeTab === "announced" 
                ? "text-emerald-600 border-b-2 border-emerald-600" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Announced
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
              <div className="text-center text-slate-400 py-8 bg-white border border-slate-200 rounded-3xl shadow-sm">
                No score history available yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {history.slice(0, 5).map((milestone: any, index: number) => (
                  <div key={index} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
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

      {(activeTab === "events" || activeTab === "announced") && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {activeTab === "events" ? "Ready to Announce" : "Announced Events"}
              </h1>
              <p className="text-slate-500 mt-1">
                {activeTab === "events" 
                  ? "Select an event below to open the presentation screen."
                  : "These events have already been presented to the public."}
              </p>
            </div>
            
            {/* Actions & Search */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              {activeTab === "announced" && (
                <button
                  onClick={openReorderModal}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs uppercase tracking-wider border border-emerald-200 transition-colors shadow-sm whitespace-nowrap"
                >
                  <ListOrdered className="w-4 h-4" />
                  Reorder Announced
                </button>
              )}

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
              {filteredEvents.map((event, index) => {
                const itemNum = activeTab === "events" ? announcedCount + 1 : (event.announcedNumber || index + 1);
                return (
                <Link 
                  key={event.id} 
                  href={`/announcer/${event.id}?num=${itemNum}`}
                  className="group block relative"
                >
                  <div className={`p-6 rounded-2xl border transition-all duration-300 h-full flex flex-col ${
                    event.status === 'announced' 
                      ? 'bg-slate-50 border-slate-200 hover:border-slate-300 opacity-80' 
                      : 'bg-white border-slate-200 hover:border-emerald-500/50 hover:shadow-lg hover:-translate-y-1'
                  }`}>
                    
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                        {activeTab === "announced" ? `#${itemNum} \u00B7 ` : ""}{event.category}
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
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reorder Modal */}
      {isReorderOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-emerald-600" />
                  Reorder Announced Events ({reorderList.length})
                </h3>
                <p className="text-xs text-slate-500 mt-1">Move events up or down to set their official sequence (#1 to #{reorderList.length})</p>
              </div>
              <button 
                onClick={() => setIsReorderOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 my-4 space-y-2 pr-1">
              {reorderList.map((ev, idx) => (
                <div 
                  key={ev.id} 
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{ev.name}</p>
                      <span className="text-[10px] uppercase font-bold text-slate-400">{ev.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveItem(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:pointer-events-none shadow-sm"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveItem(idx, 'down')}
                      disabled={idx === reorderList.length - 1}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:pointer-events-none shadow-sm"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsReorderOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={saveReorder}
                disabled={savingOrder}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {savingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

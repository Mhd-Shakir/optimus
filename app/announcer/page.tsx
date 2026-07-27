"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, CheckCircle2, Trophy, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AnnouncerDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/announcer/events");
      const data = await res.json();
      if (res.ok) {
        setEvents(data);
      }
    } catch (error) {
      console.error("Failed to fetch events", error);
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
          {filteredEvents.map((event) => (
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
                    {event.category}
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
  );
}

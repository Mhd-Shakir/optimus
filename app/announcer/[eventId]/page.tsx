"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Trophy, Medal, Star, CheckCircle2 } from "lucide-react";
import Link from "next/link";

// We need the points calculator
import { calculateGradeAndPoints } from "@/lib/points";

const normalizeString = (str: string) => {
    if (!str) return "";
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
};

const getEventGroupStatus = (event: any) => {
    if (!event) return false;
    const eventName = normalizeString(event?.name || "");
    const isGroupEvent = event.is_group_event === true ||
        eventName === "histoart" ||
        eventName === "dictionarymaking" ||
        eventName === "swarafdebate" ||
        eventName === "swarfdebate";

    const individualPointExceptions = ["speechtranslation", "dictionarymaking", "swarafdebate", "swarfdebate"];
    return isGroupEvent && !individualPointExceptions.includes(eventName);
};

export default function PresentationScreen({ params }: { params: Promise<{ eventId: string }> }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.eventId;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchResults();
  }, [eventId]);

  const fetchResults = async () => {
    try {
      const res = await fetch(`/api/announcer/result?eventId=${eventId}`);
      const resultData = await res.json();
      if (res.ok) {
        setData(resultData);
      }
    } catch (error) {
      console.error("Failed to fetch event results", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsAnnounced = async () => {
    if (data.event.status === 'announced') return;
    setMarking(true);
    try {
      const res = await fetch(`/api/announcer/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, status: "announced" })
      });
      if (res.ok) {
        setData({ ...data, event: { ...data.event, status: "announced" } });
      }
    } catch (error) {
      console.error("Failed to mark as announced", error);
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
        <h2 className="text-2xl font-bold text-slate-800 animate-pulse">Loading Results...</h2>
      </div>
    );
  }

  if (!data) return <div className="text-center py-20 text-red-500 font-bold">Error loading data.</div>;

  const { event, results } = data;
  const isGroup = getEventGroupStatus(event);

  const getTeamColor = (team: string) => {
    if (team === 'Ignis') return 'text-orange-700 border-orange-200 bg-orange-50';
    if (team === 'Ventus') return 'text-sky-700 border-sky-200 bg-sky-50';
    return 'text-slate-600 border-slate-200 bg-slate-100';
  };

  // Filter for captains if it's a group event
  const filterWinners = (winnersArray: any[]) => {
    if (!winnersArray) return [];
    if (isGroup) {
      return winnersArray.filter(w => w.isCaptain);
    }
    return winnersArray;
  };

  const displayFirst = filterWinners(results.first);
  const displaySecond = filterWinners(results.second);
  const displayThird = filterWinners(results.third);
  const displayOthers = filterWinners(results.others);

  return (
    <div className="space-y-12 pb-32">
      
      {/* Header */}
      <div className="text-center space-y-4 relative pt-6">
        <Link href="/announcer" className="absolute left-0 top-1/2 -translate-y-1/2 p-3 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="inline-block px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-sm mb-4">
          {event.category}
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight drop-shadow-sm">
          {event.name}
        </h1>
      </div>

      {/* Winners Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto pt-10">
        
        {/* Third Place */}
        <div className="md:order-1 md:mt-24">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-black text-orange-600">3rd Place</h2>
          </div>
          <div className="relative p-8 rounded-3xl border-2 bg-white border-orange-200 shadow-lg shadow-orange-100/50">
            {displayThird.length > 0 ? (
              <div className="space-y-6">
                {displayThird.map((w: any, i: number) => {
                  const points = calculateGradeAndPoints(w.mark, isGroup).points;
                  return (
                    <div key={i} className="text-center space-y-2">
                      <p className="text-sm font-bold text-slate-400">Chest No: {w.chestNo}</p>
                      <h3 className="text-2xl font-bold text-slate-800">{w.name}</h3>
                      <div className={`inline-block px-3 py-1 rounded-full border text-sm font-bold ${getTeamColor(w.team)}`}>
                        {w.team}
                      </div>
                      {points > 0 && (
                        <p className="text-lg font-black text-orange-500 mt-2">{points} Points</p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
               <div className="text-center text-slate-400 font-bold h-40 flex items-center justify-center">No Winner</div>
            )}
          </div>
        </div>

        {/* First Place */}
        <div className="md:order-2 z-10">
          <div className="text-center mb-6">
            <h2 className="text-5xl font-black text-yellow-500">1st Place</h2>
          </div>
          <div className="relative p-10 rounded-3xl border-4 bg-white border-yellow-400 shadow-2xl shadow-yellow-200/50 scale-105">
            {displayFirst.length > 0 ? (
              <div className="space-y-8">
                {displayFirst.map((w: any, i: number) => {
                  const points = calculateGradeAndPoints(w.mark, isGroup).points;
                  return (
                    <div key={i} className="text-center space-y-4">
                      <p className="text-lg font-bold text-slate-400 tracking-widest">CHEST NO: {w.chestNo}</p>
                      <h3 className="text-4xl font-black text-slate-900">{w.name}</h3>
                      <div className={`inline-block px-6 py-2 rounded-full border-2 text-lg font-black uppercase tracking-wider ${getTeamColor(w.team)}`}>
                        {w.team}
                      </div>
                      {points > 0 && (
                        <p className="text-2xl font-black text-yellow-600 mt-2">{points} Points</p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center text-slate-400 font-bold h-56 flex items-center justify-center">No Winner</div>
            )}
          </div>
        </div>

        {/* Second Place */}
        <div className="md:order-3 md:mt-12">
          <div className="text-center mb-6">
            <h2 className="text-4xl font-black text-slate-500">2nd Place</h2>
          </div>
          <div className="relative p-8 rounded-3xl border-2 bg-white border-slate-300 shadow-lg shadow-slate-200/50">
            {displaySecond.length > 0 ? (
              <div className="space-y-6">
                {displaySecond.map((w: any, i: number) => {
                  const points = calculateGradeAndPoints(w.mark, isGroup).points;
                  return (
                    <div key={i} className="text-center space-y-2">
                      <p className="text-md font-bold text-slate-400">Chest No: {w.chestNo}</p>
                      <h3 className="text-3xl font-bold text-slate-800">{w.name}</h3>
                      <div className={`inline-block px-4 py-1.5 rounded-full border text-md font-bold ${getTeamColor(w.team)}`}>
                        {w.team}
                      </div>
                      {points > 0 && (
                        <p className="text-xl font-black text-slate-600 mt-2">{points} Points</p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
               <div className="text-center text-slate-400 font-bold h-48 flex items-center justify-center">No Winner</div>
            )}
          </div>
        </div>

      </div>

      {/* Additional Participants Scoreboard */}
      <div className="mt-16 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Star className="w-6 h-6 text-emerald-500" />
          <h3 className="text-2xl font-bold text-slate-800">Scoreboard (Other Participants)</h3>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-500">Chest No</th>
                  <th className="px-6 py-4 font-bold text-slate-500">Name</th>
                  <th className="px-6 py-4 font-bold text-slate-500">Team</th>
                  <th className="px-6 py-4 font-bold text-emerald-600">Grade</th>
                  <th className="px-6 py-4 font-bold text-emerald-600 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayOthers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-medium">No other participants graded.</td>
                  </tr>
                ) : (
                  displayOthers.map((w: any, i: number) => {
                    const points = calculateGradeAndPoints(w.mark, isGroup).points;
                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-600 font-bold">{w.chestNo}</td>
                        <td className="px-6 py-4 text-slate-900 font-medium">{w.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getTeamColor(w.team)}`}>{w.team}</span>
                        </td>
                        <td className="px-6 py-4 font-black text-emerald-600">{w.grade || '-'}</td>
                        <td className="px-6 py-4 text-right font-black text-emerald-600">{points > 0 ? points : 0}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mark as Announced Footer Button */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-white/90 backdrop-blur border-t border-slate-200 flex justify-center z-50">
        <button
          onClick={markAsAnnounced}
          disabled={marking || event.status === 'announced'}
          className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-lg transition-all duration-300 shadow-xl
            ${event.status === 'announced' 
              ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed shadow-none border border-emerald-200' 
              : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:-translate-y-1 active:scale-95'
            }`}
        >
          {marking ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <CheckCircle2 className="w-6 h-6" />
          )}
          {event.status === 'announced' ? 'Officially Announced' : 'Mark as Announced'}
        </button>
      </div>

    </div>
  );
}

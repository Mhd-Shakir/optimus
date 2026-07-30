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

  const allRawParticipants = [
    ...(results?.first || []),
    ...(results?.second || []),
    ...(results?.third || []),
    ...(results?.others || [])
  ];

  const filteredParticipants = filterWinners(allRawParticipants);

  const participantsWithPoints = filteredParticipants.map(w => {
    const points = calculateGradeAndPoints(w.mark, isGroup).points;
    return { ...w, points };
  });

  participantsWithPoints.sort((a, b) => b.points - a.points);

  const uniquePoints = Array.from(new Set(participantsWithPoints.map(p => p.points)))
    .filter(p => p > 0)
    .sort((a, b) => b - a);

  const finalParticipants = participantsWithPoints.map(w => {
    let displayRank = '-';
    let rankColor = 'text-slate-400 font-bold bg-transparent';
    
    if (w.points > 0) {
        const rankIndex = uniquePoints.indexOf(w.points);
        if (rankIndex === 0) {
            displayRank = '1st Place';
            rankColor = 'text-yellow-600 font-black bg-yellow-50';
        } else if (rankIndex === 1) {
            displayRank = '2nd Place';
            rankColor = 'text-slate-600 font-black bg-slate-100';
        } else if (rankIndex === 2) {
            displayRank = '3rd Place';
            rankColor = 'text-orange-600 font-black bg-orange-50';
        }
    }

    return { ...w, displayRank, rankColor };
  });

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

      {/* Consolidated Results Table */}
      <div className="max-w-5xl mx-auto pt-4">
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-widest w-16">SI</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-widest">Position</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-widest">Code</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-widest">Chest No</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-widest">Name</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-widest">Team</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-widest">Grade</th>
                  <th className="px-6 py-4 font-bold text-slate-500 uppercase text-xs tracking-widest text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {finalParticipants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-medium">No results published yet.</td>
                  </tr>
                ) : (
                  finalParticipants.map((w: any, i: number) => {
                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-400 font-bold">{i + 1}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wider ${w.rankColor}`}>
                            {w.displayRank}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-bold">{w.codeLetter || '-'}</td>
                        <td className="px-6 py-4 text-slate-500 font-bold">{w.chestNo || '-'}</td>
                        <td className="px-6 py-4 text-slate-900 font-bold">{w.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getTeamColor(w.team)}`}>{w.team}</span>
                        </td>
                        <td className="px-6 py-4 font-black text-emerald-600">{w.grade || '-'}</td>
                        <td className="px-6 py-4 text-right font-black text-emerald-600">{w.points > 0 ? w.points : 0}</td>
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

"use client";

import { useEffect, useState, use } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Star } from "lucide-react";

export default function TeamPublicProfile({ params }: { params: Promise<{ teamName: string }> }) {
  const resolvedParams = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const res = await fetch(`/api/team/info/${resolvedParams.teamName}`);
        if (!res.ok) {
          throw new Error("Team not found");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (resolvedParams.teamName) {
      fetchTeamData();
    }
  }, [resolvedParams.teamName]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-slate-500">Loading team roster...</div>;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center border">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-slate-800">Team Not Found</h1>
          <p className="text-sm text-slate-500 mt-2">The QR code might be invalid.</p>
        </div>
      </div>
    );
  }

  const { team, students } = data;

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 flex justify-center items-start">
      <Card className="w-full max-w-2xl border-0 shadow-xl rounded-3xl overflow-hidden mt-4">
        <div className={`h-24 ${team === 'Ignis' ? 'bg-amber-500' : 'bg-violet-600'}`} />
        
        <div className="px-6 relative pb-6">
          <div className="w-24 h-24 bg-white rounded-full p-2 absolute -top-12 left-6 shadow-md">
            <div className={`w-full h-full rounded-full flex items-center justify-center ${team === 'Ignis' ? 'bg-amber-100 text-amber-600' : 'bg-violet-100 text-violet-600'}`}>
              <Users className="w-10 h-10" />
            </div>
          </div>
          
          <div className="pt-16">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{team} TEAM</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Official Roster & Programs</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge className="bg-slate-800 text-white font-bold text-xs">{students.length} Members</Badge>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 p-6 bg-slate-50">
          
          {students.length === 0 ? (
            <div className="text-center p-6 bg-white rounded-xl border border-dashed border-slate-200">
              <p className="text-sm font-medium text-slate-400">No members registered yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {students.map((student: any) => (
                <div key={student.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                    <h3 className="font-black text-slate-800 text-lg uppercase truncate">{student.name}</h3>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="text-slate-500 bg-slate-50">{student.category}</Badge>
                        <Badge className="bg-slate-800 text-white font-bold text-[10px]">Chest: {student.chestNo}</Badge>
                    </div>
                  </div>
                  
                  {student.programs.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {student.programs.map((prog: any, idx: number) => (
                          <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                            <span className="font-bold text-slate-700 text-xs uppercase truncate pr-2">{prog.eventName}</span>
                            <div className="flex gap-1 shrink-0">
                                {prog.isGroupEvent && <span className="text-[9px] text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded font-bold uppercase">Grp</span>}
                                {prog.isStar && <span className="text-[9px] text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-0.5"><Star className="w-2 h-2 fill-yellow-600" /> Star</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                  ) : (
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No programs</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

"use client";

import { useEffect, useState, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Trophy, Star, ShieldCheck } from "lucide-react";

export default function StudentPublicProfile({ params }: { params: Promise<{ chestNo: string }> }) {
  const resolvedParams = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const res = await fetch(`/api/student/info/${resolvedParams.chestNo}`);
        if (!res.ok) {
          throw new Error("Student not found");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (resolvedParams.chestNo) {
      fetchStudentData();
    }
  }, [resolvedParams.chestNo]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-slate-500">Loading profile...</div>;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center border">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-slate-800">Student Not Found</h1>
          <p className="text-sm text-slate-500 mt-2">The QR code might be invalid.</p>
        </div>
      </div>
    );
  }

  const { student, programs } = data;

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8 flex justify-center items-start">
      <Card className="w-full max-w-md border-0 shadow-xl rounded-3xl overflow-hidden mt-4">
        <div className={`h-24 ${student.team === 'Ignis' ? 'bg-amber-500' : 'bg-violet-600'}`} />
        
        <div className="px-6 relative pb-6">
          <div className="w-24 h-24 bg-white rounded-full p-2 absolute -top-12 left-6 shadow-md">
            <div className={`w-full h-full rounded-full flex items-center justify-center ${student.team === 'Ignis' ? 'bg-amber-100 text-amber-600' : 'bg-violet-100 text-violet-600'}`}>
              <User className="w-10 h-10" />
            </div>
          </div>
          
          <div className="pt-16">
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{student.name}</h1>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge className="bg-slate-800 text-white font-bold text-xs">Chest: {student.chestNo}</Badge>
              <Badge className={student.team === 'Ignis' ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700'}>
                Team {student.team}
              </Badge>
              <Badge variant="outline" className="text-slate-500 bg-slate-50">{student.category}</Badge>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 p-6 bg-slate-50">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4 uppercase tracking-widest">
            <Trophy className="w-4 h-4 text-emerald-500" />
            Registered Programs ({programs.length})
          </h2>
          
          {programs.length === 0 ? (
            <div className="text-center p-6 bg-white rounded-xl border border-dashed border-slate-200">
              <p className="text-sm font-medium text-slate-400">No programs registered yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {programs.map((prog: any) => (
                <div key={prog.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-1 relative overflow-hidden">
                  {prog.is_star && (
                    <div className="absolute top-0 right-0 p-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    </div>
                  )}
                  <h3 className="font-bold text-slate-800 text-sm pr-6 uppercase">{prog.eventName}</h3>
                  <div className="flex gap-2 items-center text-[10px] uppercase font-bold tracking-wider">
                    {prog.isGroupEvent ? (
                      <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded">Group Event</span>
                    ) : (
                      <span className="text-purple-500 bg-purple-50 px-2 py-0.5 rounded">Individual</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

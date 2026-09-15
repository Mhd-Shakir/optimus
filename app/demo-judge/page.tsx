"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Gavel } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DemoSidebar } from "@/components/demo-sidebar";

export default function DemoJudgeDashboard() {
    const router = useRouter();
    const { toast } = useToast();
    
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                // MOCK DATA
                const mockEvents = [
                    { _id: "e2", name: "Essay Writing", category: "Nexus", type: "Non-Stage", status: "upcoming", judgeId: "demo-user" },
                    { _id: "e4", name: "Drawing", category: "Protons", type: "Non-Stage", status: "completed", judgeId: "demo-user" }
                ];
                setEvents(mockEvents);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);


    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
    }

    const sortedEvents = [...events].sort((a, b) => {
        const aCompleted = a.status === "completed" || a.status === "announced";
        const bCompleted = b.status === "completed" || b.status === "announced";
        if (a.status === "upcoming" && bCompleted) return -1;
        if (aCompleted && b.status === "upcoming") return 1;
        return 0;
    });

    return (
        <div className="min-h-screen bg-muted/30 flex w-full h-[100dvh] overflow-hidden">
            <DemoSidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-slate-50">
                <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                        <Gavel className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Judge Portal</h1>
                        <p className="text-slate-500">Select an event to evaluate.</p>
                    </div>
                </div>

                <div className="grid gap-4">
                    {sortedEvents.map(event => (
                        <Card key={event._id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200 shadow-sm hover:border-emerald-300 transition-colors">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">{event.name}</h3>
                                <div className="flex gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700">{event.category}</Badge>
                                    <Badge variant="outline" className="text-xs text-slate-500">
                                        {(event.status === "completed" || event.status === "announced") ? "Evaluated" : "Pending Evaluation"}
                                    </Badge>
                                </div>
                            </div>
                            <Button 
                                onClick={() => router.push(`/demo-judge/results/${event._id}`)}
                                className={(event.status === "completed" || event.status === "announced") ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-emerald-600 text-white hover:bg-emerald-700"}
                            >
                                {(event.status === "completed" || event.status === "announced") ? "View Results" : "Evaluate"}
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Card>
                    ))}
                    {sortedEvents.length === 0 && (
                        <div className="text-center p-12 text-slate-500 bg-white rounded-xl border border-dashed">
                            No events found.
                        </div>
                    )}
                </div>
                </div>
            </main>
        </div>
    );
}

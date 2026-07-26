"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Gavel } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function JudgeDashboard() {
    const router = useRouter();
    const { toast } = useToast();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch("/api/events");
                const data = await res.json();
                
                let eventsList = [];
                if (Array.isArray(data)) {
                    eventsList = data;
                } else if (data.events) {
                    eventsList = data.events;
                }
                
                // Only show upcoming events that have code letters assigned
                const upcomingEvents = eventsList.filter(e => e.status === "upcoming" && e.hasCodeLetters === true);
                setEvents(upcomingEvents);
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Failed to load events." });
            } finally {
                setLoading(false);
            }
        };
        
        fetchEvents();
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
    }

    // Sort events: Pending first, then completed
    const sortedEvents = [...events].sort((a, b) => {
        if (a.status === "upcoming" && b.status === "completed") return -1;
        if (a.status === "completed" && b.status === "upcoming") return 1;
        return 0;
    });

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-sm">
                        <Gavel className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Judge Portal</h1>
                        <p className="text-slate-500">Select an event to evaluate.</p>
                    </div>
                </div>

                <div className="grid gap-4">
                    {sortedEvents.map(event => (
                        <Card key={event._id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">{event.name}</h3>
                                <div className="flex gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">{event.category}</Badge>
                                    <Badge variant="outline" className="text-xs text-slate-500">
                                        {event.status === "completed" ? "Evaluated" : "Pending Evaluation"}
                                    </Badge>
                                </div>
                            </div>
                            <Button 
                                onClick={() => router.push(`/judge/results/${event._id}`)}
                                className={event.status === "completed" ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"}
                            >
                                {event.status === "completed" ? "View Results" : "Evaluate"}
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
        </div>
    );
}

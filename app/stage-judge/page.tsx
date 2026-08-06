"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight, Mic2, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StageJudgeDashboard() {
    const router = useRouter();
    const { toast } = useToast();
    
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        // Check local storage for session
        const authStatus = localStorage.getItem("stageJudgeAuth");
        if (authStatus === "true") {
            setIsAuthenticated(true);
            fetchEvents();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/events");
            const data = await res.json();
            
            let eventsList = [];
            if (Array.isArray(data)) {
                eventsList = data;
            } else if (data.events) {
                eventsList = data.events;
            }
            
            // Show all Stage events that have code letters saved
            const stageEvents = eventsList.filter((e: any) => e.type === "Stage" && e.hasCodeLetters);
            setEvents(stageEvents);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load events." });
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // The simple one-time password
        if (passwordInput === "optimus123") {
            localStorage.setItem("stageJudgeAuth", "true");
            setIsAuthenticated(true);
            fetchEvents();
        } else {
            toast({ variant: "destructive", title: "Incorrect Password", description: "Please enter the correct password." });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("stageJudgeAuth");
        setIsAuthenticated(false);
        setEvents([]);
        setPasswordInput("");
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <Card className="w-full max-w-sm p-8 shadow-lg text-center space-y-6 border-0">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tighter text-slate-900">Stage Portal</h2>
                        <p className="text-sm text-slate-500 mt-2">Enter the shared password to access stage events.</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="relative">
                            <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Password" 
                                value={passwordInput} 
                                onChange={(e) => setPasswordInput(e.target.value)} 
                                className="text-center text-lg h-12 pr-10"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-md">Enter Portal</Button>
                    </form>
                </Card>
            </div>
        );
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
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                            <Mic2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Stage Portal</h1>
                            <p className="text-slate-500">Select a stage event to evaluate.</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={handleLogout} className="text-slate-500 border-slate-200">
                        <Lock className="w-4 h-4 mr-2" /> Lock Portal
                    </Button>
                </div>

                <div className="grid gap-4">
                    {sortedEvents.map(event => (
                        <Card key={event._id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200 shadow-sm hover:border-blue-300 transition-colors cursor-pointer" onClick={() => router.push(`/stage-judge/score/${event._id}`)}>
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">{event.name}</h3>
                                <div className="flex gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">{event.category}</Badge>
                                    <Badge variant="outline" className="text-xs text-slate-500">
                                        {event.status === "completed" ? "Evaluated" : "Pending Evaluation"}
                                    </Badge>
                                </div>
                            </div>
                            <Button 
                                onClick={(e) => { e.stopPropagation(); router.push(`/stage-judge/score/${event._id}`); }}
                                className={event.status === "completed" ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-blue-600 text-white hover:bg-blue-700"}
                            >
                                {event.status === "completed" ? "View Results" : "Evaluate"}
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Card>
                    ))}
                    {sortedEvents.length === 0 && (
                        <div className="text-center p-12 text-slate-500 bg-white rounded-xl border border-dashed">
                            No stage events found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

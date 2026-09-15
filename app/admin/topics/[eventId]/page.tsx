"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowLeft, Save, CheckCircle2, Sparkles, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TopicAssignmentPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = use(params);
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<any>(null);
    const [registrations, setRegistrations] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // we can reuse code-letters route since it returns event and registrations
                const res = await fetch(`/api/events/code-letters?eventId=${eventId}`, { cache: 'no-store' });
                const data = await res.json();
                if (data.error) throw new Error(data.error);

                setEvent(data.event);
                setRegistrations(data.registrations || []);
            } catch (error: any) {
                toast({ variant: "destructive", title: "Error", description: error.message });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [eventId]);

    const handleTopicSelect = async (regId: string, topic: string | null) => {
        const newRegs = [...registrations];
        const target = newRegs.find(r => r.id === regId);
        if (target) {
            target.assigned_topic = topic;
            setRegistrations(newRegs);
            
            try {
                const res = await fetch('/api/events/assigned-topics', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ updates: [{ id: regId, assigned_topic: topic }] })
                });
                
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                
                toast({ title: topic ? "Topic Assigned" : "Topic Removed", description: "Saved automatically." });
            } catch (error: any) {
                toast({ variant: "destructive", title: "Error", description: error.message });
            }
        }
    };

    const handleScratchTopic = (regId: string) => {
        const availableTopics = event.topics && event.topics.length > 0 ? event.topics : (event.topic ? [event.topic] : []);
        if (availableTopics.length === 0) {
            toast({ variant: "destructive", title: "Error", description: "No topics available for this event." });
            return;
        }

        // Count how many times each topic has been assigned
        const topicCounts = new Map<string, number>();
        registrations.forEach(r => {
            if (r.assigned_topic) {
                topicCounts.set(r.assigned_topic, (topicCounts.get(r.assigned_topic) || 0) + 1);
            }
        });

        // Filter topics that have been assigned less than 3 times
        let validTopics = availableTopics.filter((t: string) => (topicCounts.get(t) || 0) < 3);

        // If all topics have been assigned 3 times, fallback to all available topics to prevent getting stuck
        if (validTopics.length === 0) {
            validTopics = availableTopics;
        }

        const randomTopic = validTopics[Math.floor(Math.random() * validTopics.length)];
        handleTopicSelect(regId, randomTopic);
    };

    // Save function removed as it is now automatic

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
    }

    if (!event) {
        return <div className="p-8 text-center text-slate-500">Event not found.</div>;
    }

    const availableTopics = event.topics && event.topics.length > 0 ? event.topics : (event.topic ? [event.topic] : []);

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <button onClick={() => router.push("/admin/topics")} className="text-sm font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 mb-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Topic Selection
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900">Assign Topics</h1>
                    <p className="text-slate-500">Assign a specific topic for participants in {event.name}</p>
                </div>

                <div className="flex gap-2">
                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-3 py-1.5 rounded-full border shadow-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Auto-saving enabled
                    </div>
                </div>
            </div>

            {/* Topic Usage Summary */}
            {availableTopics.length > 0 && (
                <Card className="border border-slate-200 shadow-sm p-4">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">Topic Usage Summary (Max 3 times per topic)</h3>
                    <div className="flex flex-wrap gap-2">
                        {availableTopics.map((topic: string, i: number) => {
                            const count = registrations.filter(r => r.assigned_topic === topic).length;
                            const isFull = count >= 3;
                            return (
                                <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${isFull ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                    <span>{i + 1}. {topic}</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] shrink-0 ${isFull ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {count} / 3
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            <Card className="overflow-hidden border border-slate-200 shadow-sm">
                <div className="overflow-x-auto w-full">
                    <Table className="min-w-[600px]">
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[120px] text-center">Code Letter</TableHead>
                                <TableHead>Participant Name</TableHead>
                                <TableHead>Team</TableHead>
                                <TableHead className="w-[300px]">Assigned Topic</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(() => {
                                const displayedRegistrations = registrations.filter(r => r.code_letter);

                                if (displayedRegistrations.length === 0) {
                                    return (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                                                No participants have been assigned code letters yet. 
                                                <br/>
                                                <span className="text-xs">Go to Results -&gt; Code Letters to generate them first.</span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }

                                return displayedRegistrations.sort((a,b) => a.code_letter.localeCompare(b.code_letter)).map((reg) => (
                                    <TableRow key={reg.id}>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center justify-center w-10 h-10 rounded bg-slate-900 text-white font-black shadow-sm">
                                                {reg.code_letter}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-bold text-slate-800">
                                            {reg.students?.name || "Group"}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${reg.students?.team === "Ignis" ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"}`}>
                                                {reg.students?.team || "Unknown"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {reg.assigned_topic ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="px-3 py-2 bg-blue-50 border border-blue-200 text-blue-800 rounded font-bold text-sm" title={reg.assigned_topic}>
                                                        Topic {availableTopics.indexOf(reg.assigned_topic) + 1}
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleTopicSelect(reg.id, null)}
                                                        className="text-slate-400 hover:text-red-500"
                                                        title="Remove topic"
                                                    >
                                                        <RefreshCcw className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button 
                                                    onClick={() => handleScratchTopic(reg.id)}
                                                    className="w-[240px] bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                                                >
                                                    <Sparkles className="w-4 h-4 mr-2" /> Scratch Topic
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ));
                            })()}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}

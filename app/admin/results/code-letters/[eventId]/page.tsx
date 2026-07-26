"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowLeft, Shuffle, Save, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const normalizeString = (str: string) => {
    if (!str) return "";
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
};

// Helper to generate A, B, C... Z, AA, AB...
const getCodeLetterByIndex = (index: number) => {
    let letter = '';
    while (index >= 0) {
        letter = String.fromCharCode((index % 26) + 65) + letter;
        index = Math.floor(index / 26) - 1;
    }
    return letter;
};

export default function CodeLettersPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = use(params);
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [event, setEvent] = useState<any>(null);
    const [registrations, setRegistrations] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
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

    const handleShuffleAndGenerate = () => {
        const isGroup = event.is_group_event === true || ["histoart", "dictionarymaking", "swarafdebate", "swarfdebate"].includes(normalizeString(event.name));
        
        let newRegistrations = [...registrations];

        // Basic Fisher-Yates shuffle
        const shuffleArray = (array: any[]) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };

        if (isGroup) {
            // Group by team and group_no
            const groupsMap = new Map<string, any[]>();
            newRegistrations.forEach(reg => {
                const team = reg.students?.team || "noteam";
                const groupNo = reg.group_no || "unassigned";
                const groupKey = `${team}-${groupNo}`;
                if (!groupsMap.has(groupKey)) groupsMap.set(groupKey, []);
                groupsMap.get(groupKey)!.push(reg);
            });

            const groups = Array.from(groupsMap.values());
            const shuffledGroups = shuffleArray(groups);

            shuffledGroups.forEach((groupRegs, index) => {
                const codeLetter = getCodeLetterByIndex(index);
                groupRegs.forEach(reg => {
                    reg.code_letter = codeLetter;
                });
            });
            
            // Flatten back to array (though they were modified by reference)
        } else {
            // Individual event
            newRegistrations = shuffleArray(newRegistrations);
            newRegistrations.forEach((reg, index) => {
                reg.code_letter = getCodeLetterByIndex(index);
            });
        }

        setRegistrations([...newRegistrations]);
        setHasUnsavedChanges(true);
        toast({ title: "Shuffled!", description: "Code letters have been randomly assigned. Click Save." });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates = registrations.map(reg => ({
                id: reg.id,
                code_letter: reg.code_letter
            }));

            const res = await fetch('/api/events/code-letters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });
            
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            toast({ title: "Saved!", description: "Code letters have been securely saved." });
            setHasUnsavedChanges(false);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
    }

    if (!event) {
        return <div className="p-8 text-center text-slate-500">Event not found.</div>;
    }

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <button onClick={() => router.push("/admin/results")} className="text-sm font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 mb-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Results
                    </button>
                    <h1 className="text-3xl font-bold text-slate-900">Code Letters</h1>
                    <p className="text-slate-500">Manage anonymous code letters for {event.name}</p>
                </div>

                <div className="flex gap-2">
                    <Button onClick={handleShuffleAndGenerate} disabled={registrations.some(r => r.code_letter)} variant="outline" className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <Shuffle className="w-4 h-4 mr-2" /> Shuffle & Generate
                    </Button>
                    {(() => {
                        const isSaved = registrations.some(r => r.code_letter) && !hasUnsavedChanges;
                        return (
                            <Button 
                                onClick={handleSave} 
                                disabled={saving || isSaved || !hasUnsavedChanges} 
                                className={`shadow-sm disabled:opacity-80 disabled:cursor-not-allowed ${isSaved ? "bg-slate-200 text-slate-600 border border-slate-300 hover:bg-slate-200" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
                            >
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : isSaved ? <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" /> : <Save className="w-4 h-4 mr-2" />}
                                {isSaved ? "Saved" : "Save Codes"}
                            </Button>
                        );
                    })()}
                </div>
            </div>

            <Card className="overflow-hidden border border-slate-200 shadow-sm">
                <div className="overflow-x-auto w-full">
                    <Table className="min-w-[600px]">
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[80px]">Chest No</TableHead>
                                <TableHead>Participant Name</TableHead>
                                <TableHead>Team</TableHead>
                                {event.is_group_event && <TableHead>Group</TableHead>}
                                <TableHead className="text-right">Code Letter</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(() => {
                                const isGroupEvent = event?.is_group_event === true || ["histoart", "dictionarymaking", "swarafdebate", "swarfdebate"].includes(normalizeString(event?.name || ""));
                                
                                let displayedRegistrations = registrations;
                                if (isGroupEvent) {
                                    const groupsMap = new Map<string, any[]>();
                                    registrations.forEach(reg => {
                                        const key = `${reg.students?.team}-${reg.group_no}`;
                                        if (!groupsMap.has(key)) groupsMap.set(key, []);
                                        groupsMap.get(key)!.push(reg);
                                    });
                                    displayedRegistrations = Array.from(groupsMap.values()).map(groupRegs => {
                                        return groupRegs.find(r => r.is_captain) || groupRegs[0];
                                    });
                                }

                                if (displayedRegistrations.length === 0) {
                                    return (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-slate-500">No participants registered yet.</TableCell>
                                        </TableRow>
                                    );
                                }

                                return displayedRegistrations.map((reg) => (
                                    <TableRow key={reg.id}>
                                        <TableCell className="font-bold text-slate-500">{reg.students?.chest_no || "N/A"}</TableCell>
                                        <TableCell className="font-bold text-slate-800">
                                            {reg.students?.name || "Unknown"}
                                            {isGroupEvent && <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-normal uppercase">Captain</span>}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${reg.students?.team === "Ignis" ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"}`}>
                                                {reg.students?.team || "Unknown"}
                                            </span>
                                        </TableCell>
                                        {event.is_group_event && <TableCell>{reg.group_no || "None"}</TableCell>}
                                        <TableCell className="text-right">
                                            {reg.code_letter ? (
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded bg-slate-900 text-white font-black text-lg shadow-sm">
                                                    {reg.code_letter}
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 italic text-sm">Unassigned</span>
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

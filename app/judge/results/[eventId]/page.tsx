"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Save, FileSignature, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function JudgeValuationSheet({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = use(params);
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [event, setEvent] = useState<any>(null);
    const [valuationRows, setValuationRows] = useState<{ codeLetter: string, mark: string }[]>([]);

    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.role !== 'judge') {
            router.push('/login');
            return;
        }

        const fetchEventDetails = async () => {
            try {
                // Fetch the event and all code letters
                const res = await fetch(`/api/events/code-letters?eventId=${eventId}`);
                const data = await res.json();
                
                if (data.error) throw new Error(data.error);

                if (data.event.judgeId && data.event.judgeId !== user.id) {
                    toast({ variant: "destructive", title: "Unauthorized", description: "You are not assigned to evaluate this event." });
                    router.push('/judge');
                    return;
                }

                setEvent(data.event);
                
                // Extract unique code letters, their marks and assigned topics
                const rowsMap = new Map();
                (data.registrations || []).forEach((reg: any) => {
                    if (reg.code_letter) {
                        rowsMap.set(reg.code_letter, { mark: reg.mark || "", assigned_topic: reg.assigned_topic || "" });
                    }
                });
                
                // Create a row for each assigned code letter
                const initialRows = Array.from(rowsMap.keys()).sort().map(code => ({ 
                    codeLetter: code, 
                    mark: rowsMap.get(code)?.mark?.toString() || "",
                    assigned_topic: rowsMap.get(code)?.assigned_topic || ""
                }));
                setValuationRows(initialRows);
                
            } catch (error: any) {
                toast({ variant: "destructive", title: "Error", description: error.message });
            } finally {
                setLoading(false);
            }
        };

        fetchEventDetails();
    }, [eventId, user, authLoading, router]);

    const handleMarkChange = (index: number, mark: string) => {
        setValuationRows(prev => prev.map((row, i) => i === index ? { ...row, mark } : row));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Check if all fields are filled
            const hasEmptyMarks = valuationRows.some(row => !row.mark || row.mark.trim() === "");
            if (hasEmptyMarks) {
                throw new Error("Please enter marks for all participants. All fields are mandatory.");
            }

            const validResults = valuationRows.map(row => ({
                codeLetter: row.codeLetter,
                mark: parseInt(row.mark) || 0
            }));

            const payload = {
                eventId: event.id,
                results: validResults
            };

            await axios.post('/api/events/result-judge', payload);
            
            setIsEditing(false);
            setEvent({...event, status: "completed"});
            toast({ title: isEditing ? "Results Updated!" : "Results Published!", description: "Results have been auto-calculated and saved to the scoreboard." });
            router.push('/judge');
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.response?.data?.error || error.message || "Failed to save results" });
        } finally {
            setSaving(false);
        }
    };

    if (loading || authLoading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
    }

    if (!event) {
        return <div className="p-8 text-center text-slate-500">Event not found.</div>;
    }

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen flex flex-col items-center">
            <div className="w-full max-w-4xl space-y-4">
                <button onClick={() => router.push("/judge")} className="text-sm font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 mb-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>

                {/* Marquee for assigned topics */}
                {valuationRows.some(row => row.assigned_topic) && (
                    <div className="bg-blue-600 text-white py-2 rounded-t-lg shadow-sm overflow-hidden flex items-center">
                        <div className="px-4 font-bold uppercase text-xs shrink-0 bg-blue-700 h-full py-2 z-10 shadow-[4px_0_10px_rgba(0,0,0,0.1)]">Now Performing</div>
                        <div className="w-full overflow-hidden">
                            <div className="animate-[marquee_20s_linear_infinite] whitespace-nowrap pl-4">
                                {valuationRows.filter(r => r.assigned_topic).map((r, i) => (
                                    <span key={i} className="mx-6 text-sm font-semibold">
                                        Participant <span className="bg-white text-blue-800 px-1.5 py-0.5 rounded ml-1 font-black">{r.codeLetter}</span> : {r.assigned_topic}
                                        <span className="mx-6 opacity-50">•</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <Card className={`overflow-hidden border border-slate-200 shadow-md bg-white ${valuationRows.some(row => row.assigned_topic) ? 'rounded-t-none border-t-0' : ''}`}>
                    {/* Header matching PDF */}
                    <div className="p-6 border-b-2 border-slate-900">
                        <div className="flex justify-between items-start mb-4">
                            <div className="text-xs font-bold leading-tight">
                                <div>OPTIMUS ARTS FEST</div>
                                <div className="text-slate-500 font-normal">Score Management System</div>
                            </div>
                            <h1 className="text-xl font-bold tracking-widest text-center uppercase">Valuation Sheet</h1>
                            <div className="text-xs font-semibold">
                                {new Date().toLocaleDateString('en-US')}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 text-center border-t border-b border-slate-300 divide-x divide-slate-300 mt-4">
                            <div className="py-2 font-bold uppercase text-sm">{event.name}</div>
                            <div className="py-2 font-bold uppercase text-sm">{event.category}</div>
                            <div className="py-2 font-bold uppercase text-sm">{event.is_group_event ? "GROUP" : "INDIVIDUAL"}</div>
                        </div>
                        {event.topics && event.topics.length > 0 ? (
                            <div className="text-left py-4 px-6 border-b border-slate-300 text-blue-800 bg-blue-50/50">
                                <div className="font-bold text-sm uppercase mb-2">Topics:</div>
                                <ul className="space-y-1">
                                    {event.topics.map((t: string, i: number) => (
                                        <li key={i} className="text-sm font-semibold flex items-start gap-2">
                                            <span className="text-blue-500">{i + 1}.</span> {t}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : event.topic && (
                            <div className="text-center py-2 font-bold text-sm border-b border-slate-300 text-blue-700 bg-blue-50">
                                Topic: {event.topic}
                            </div>
                        )}
                    </div>
                    
                    <div className="p-0">
                        <Table className="min-w-full border-collapse">
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="w-1/3 border-b-2 border-r border-slate-300 text-center font-bold text-slate-900 py-4 uppercase text-xs">Code Letter</TableHead>
                                    <TableHead className="w-1/3 border-b-2 border-r border-slate-300 text-center font-bold text-slate-900 py-4 uppercase text-xs">Assigned Topic</TableHead>
                                    <TableHead className="w-1/3 border-b-2 border-slate-300 text-center font-bold text-slate-900 py-4 uppercase text-xs">Mark out of 100</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {valuationRows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                                            No code letters assigned for this event.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    valuationRows.map((row, idx) => (
                                        <TableRow key={idx} className="hover:bg-slate-50">
                                            <TableCell className="border-b border-r border-slate-200 text-center py-3 font-bold text-lg">
                                                {row.codeLetter}
                                            </TableCell>
                                            <TableCell className="border-b border-r border-slate-200 text-center py-3 text-sm font-medium text-slate-600">
                                                {row.assigned_topic || <span className="italic text-slate-400">Not Assigned</span>}
                                            </TableCell>
                                            <TableCell className="border-b border-slate-200 p-0 text-center align-middle">
                                                <div className="px-4 py-1 h-full flex items-center justify-center">
                                                    <Input 
                                                        type="number" 
                                                        placeholder={(!isEditing && (event.status === "completed" || event.status === "announced")) ? "-" : "Enter marks..."}
                                                        value={row.mark} 
                                                        onChange={(e) => handleMarkChange(idx, e.target.value)} 
                                                        disabled={(!isEditing && (event.status === "completed" || event.status === "announced"))}
                                                        className="w-full text-center font-bold text-lg border-none shadow-none focus-visible:ring-0 placeholder:text-slate-300 placeholder:font-normal h-full bg-transparent disabled:opacity-100 disabled:text-slate-700" 
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {((event.status === "completed" || event.status === "announced") && !isEditing) && (
                        <div className="p-6 bg-slate-50 border-t flex justify-end">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-md text-lg px-8 py-6 h-auto transition-transform active:scale-95">
                                        Edit Results
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-white">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Edit Published Results?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to edit these results? This will allow you to modify the marks and re-publish them.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => setIsEditing(true)} className="bg-amber-600 text-white hover:bg-amber-700">
                                            Yes, Enable Editing
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}

                    {((event.status !== "completed" && event.status !== "announced") || isEditing) && (
                        <div className="p-6 bg-slate-50 border-t flex justify-end">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button 
                                        disabled={saving || valuationRows.length === 0} 
                                        className="bg-slate-900 hover:bg-slate-800 text-white shadow-md text-lg px-8 py-6 h-auto transition-transform active:scale-95"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                                        {isEditing ? "Update Results" : "Publish Results"}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-white">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action will {isEditing ? "update the marks" : "publish the marks to the main scoreboard"} and cannot be easily undone. Please double check all marks before confirming.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleSave} className="bg-slate-900 text-white hover:bg-slate-800">
                                            {isEditing ? "Yes, Update Results" : "Yes, Publish Results"}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

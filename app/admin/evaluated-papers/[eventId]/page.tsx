"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminEvaluatedPaper({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = use(params);
    const router = useRouter();
    const { toast } = useToast();
    
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<any>(null);
    const [valuationRows, setValuationRows] = useState<{ codeLetter: string, mark: string }[]>([]);

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                // Fetch the event and all code letters
                const res = await fetch(`/api/events/code-letters?eventId=${eventId}`);
                const data = await res.json();
                
                if (data.error) throw new Error(data.error);

                setEvent(data.event);
                
                // Group by code_letter to display marks
                const codeMarks = new Map<string, string>();
                (data.registrations || []).forEach((reg: any) => {
                    if (reg.code_letter) {
                        // In group events, multiple students might have the same code letter.
                        // We just take the first mark since they share the same score.
                        if (!codeMarks.has(reg.code_letter) && reg.mark !== null && reg.mark !== undefined) {
                            codeMarks.set(reg.code_letter, String(reg.mark));
                        }
                    }
                });
                
                // Also collect code letters that might not have marks (just in case)
                (data.registrations || []).forEach((reg: any) => {
                    if (reg.code_letter && !codeMarks.has(reg.code_letter)) {
                        codeMarks.set(reg.code_letter, "-");
                    }
                });
                
                // Convert Map to array
                const rows = Array.from(codeMarks.entries())
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([code, mark]) => ({ codeLetter: code, mark }));
                    
                setValuationRows(rows);
                
            } catch (error: any) {
                toast({ variant: "destructive", title: "Error", description: error.message });
            } finally {
                setLoading(false);
            }
        };

        fetchEventDetails();
    }, [eventId]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
    }

    if (!event) {
        return <div className="p-8 text-center text-slate-500">Event not found.</div>;
    }

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen flex flex-col items-center">
            <div className="w-full max-w-4xl space-y-4">
                <button onClick={() => router.push("/admin/results")} className="text-sm font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 mb-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Results
                </button>

                <Card className="overflow-hidden border border-slate-200 shadow-md bg-white">
                    {/* Header matching PDF */}
                    <div className="p-6 border-b-2 border-slate-900">
                        <div className="flex justify-between items-start mb-4">
                            <div className="text-xs font-bold leading-tight">
                                <div>OPTIMUS ARTS FEST</div>
                                <div className="text-slate-500 font-normal">Score Management System</div>
                            </div>
                            <h1 className="text-xl font-bold tracking-widest text-center uppercase">Valuation Sheet</h1>
                            <div className="text-xs font-semibold">
                                {new Date(event.updated_at || Date.now()).toLocaleDateString('en-US')}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 text-center border-t border-b border-slate-300 divide-x divide-slate-300 mt-4">
                            <div className="py-2 font-bold uppercase text-sm">{event.name}</div>
                            <div className="py-2 font-bold uppercase text-sm">{event.category}</div>
                            <div className="py-2 font-bold uppercase text-sm">{event.is_group_event ? "GROUP" : "INDIVIDUAL"}</div>
                        </div>
                    </div>
                    
                    <div className="p-0">
                        <Table className="min-w-full border-collapse">
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="w-1/2 border-b-2 border-r border-slate-300 text-center font-bold text-slate-900 py-4 uppercase text-xs">Code Letter</TableHead>
                                    <TableHead className="w-1/2 border-b-2 border-slate-300 text-center font-bold text-slate-900 py-4 uppercase text-xs">Mark out of 100</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {valuationRows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center py-8 text-slate-500">
                                            No code letters assigned for this event.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    valuationRows.map((row, idx) => (
                                        <TableRow key={idx} className="hover:bg-slate-50">
                                            <TableCell className="border-b border-r border-slate-200 text-center py-4 font-bold text-lg text-slate-900">
                                                {row.codeLetter}
                                            </TableCell>
                                            <TableCell className="border-b border-slate-200 text-center py-4 font-bold text-lg text-emerald-700">
                                                {row.mark}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </div>
    );
}

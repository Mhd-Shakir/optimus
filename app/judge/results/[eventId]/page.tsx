"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
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
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
                
                // Extract unique code letters (ignore empty/null)
                const codes = new Set<string>();
                (data.registrations || []).forEach((reg: any) => {
                    if (reg.code_letter) codes.add(reg.code_letter);
                });
                
                // Create a row for each assigned code letter
                const initialRows = Array.from(codes).sort().map(code => ({ codeLetter: code, mark: "" }));
                setValuationRows(initialRows);
                
            } catch (error: any) {
                toast({ variant: "destructive", title: "Error", description: error.message });
            } finally {
                setLoading(false);
            }
        };

        fetchEventDetails();
    }, [eventId]);

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
            
            toast({ title: "Results Published!", description: "Results have been auto-calculated and saved to the scoreboard." });
            router.push('/judge');
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.response?.data?.error || error.message || "Failed to save results" });
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
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen flex flex-col items-center">
            <div className="w-full max-w-4xl space-y-4">
                <button onClick={() => router.push("/judge")} className="text-sm font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 mb-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
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
                                {new Date().toLocaleDateString('en-US')}
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
                                            <TableCell className="border-b border-r border-slate-200 text-center py-3 font-bold text-lg">
                                                {row.codeLetter}
                                            </TableCell>
                                            <TableCell className="border-b border-slate-200 p-0 text-center align-middle">
                                                <div className="px-4 py-1 h-full flex items-center justify-center">
                                                    <Input 
                                                        type="number" 
                                                        placeholder="Enter marks..." 
                                                        value={row.mark} 
                                                        onChange={(e) => handleMarkChange(idx, e.target.value)} 
                                                        className="w-full text-center font-bold text-lg border-none shadow-none focus-visible:ring-0 placeholder:text-slate-300 placeholder:font-normal h-full bg-transparent" 
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="p-6 bg-slate-50 border-t flex justify-end">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    disabled={saving || valuationRows.length === 0} 
                                    className="bg-slate-900 hover:bg-slate-800 text-white shadow-md text-lg px-8 py-6 h-auto transition-transform active:scale-95"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                                    Publish Results
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action will publish the marks to the main scoreboard and cannot be easily undone. Please double check all marks before confirming.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleSave} className="bg-slate-900 text-white hover:bg-slate-800">
                                        Yes, Publish Results
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </Card>
            </div>
        </div>
    );
}

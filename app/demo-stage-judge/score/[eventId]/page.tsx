"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
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

export default function DemoStageJudgeValuationSheet({ params }: { params: Promise<{ eventId: string }> }) {
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
                // MOCK DATA
                const mockEvent = { id: eventId, name: "Group Song", category: "General-A", is_group_event: true, status: "upcoming" };
                setEvent(mockEvent);
                
                const mockRows = [
                    { codeLetter: "X", mark: "" },
                    { codeLetter: "Y", mark: "" },
                    { codeLetter: "Z", mark: "" }
                ];
                setValuationRows(mockRows);
            } catch (error: any) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchEventDetails();
    }, [eventId, router]);

    const handleMarkChange = (index: number, mark: string) => {
        setValuationRows(prev => prev.map((row, i) => i === index ? { ...row, mark } : row));
    };


    const handleSave = async () => {
        setSaving(true);
        setTimeout(() => {
            toast({ title: "Demo Mode 🛡️", description: "Publishing results simulated locally." });
            setSaving(false);
            router.push('/demo-stage-judge');
        }, 500);
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
                <button onClick={() => router.push("/demo-stage-judge")} className="text-sm font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 mb-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>

                <Card className="overflow-hidden border border-slate-200 shadow-md bg-white">
                    <div className="p-6 border-b-2 border-slate-900">
                        <div className="flex justify-between items-start mb-4">
                            <div className="text-xs font-bold leading-tight">
                                <div>OPTIMUS ARTS FEST</div>
                                <div className="text-slate-500 font-normal">Score Management System</div>
                            </div>
                            <h1 className="text-xl font-bold tracking-widest text-center uppercase">Stage Valuation Sheet</h1>
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
                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-md text-lg px-8 py-6 h-auto transition-transform active:scale-95"
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
                                    <AlertDialogAction onClick={handleSave} className="bg-blue-600 text-white hover:bg-blue-700">
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

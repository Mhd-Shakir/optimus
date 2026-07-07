import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateGradeAndPoints } from "@/lib/points";

export const dynamic = "force-dynamic";

const normalizeString = (str: string) => {
    if (!str) return "";
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
};

// Legacy support for older records without marks (optional) but we can just use marks


export async function GET() {
    try {
        const [{ data: students }, { data: events }, { data: allRegistrations }, { count: totalEventsCount }] = await Promise.all([
            supabaseAdmin.from('students').select('*'),
            supabaseAdmin.from('events').select('*').eq('status', 'completed'),
            supabaseAdmin.from('registrations').select('*'),
            supabaseAdmin.from('events').select('*', { count: 'exact', head: true })
        ]);

        const totalStudents = students?.length || 0;
        const totalEvents = totalEventsCount || 0;
        const completedEventsCount = events?.length || 0;
        const registrationsCount = allRegistrations?.length || 0;

        let aurisScore = 0;
        let librasScore = 0;
        const studentScores: any = {};

        const initStudent = (id: string) => {
            if (!studentScores[id]) {
                const s = students?.find((std: any) => std.id === id);
                if (s) {
                    studentScores[id] = {
                        id: s.id,
                        name: s.name,
                        chestNo: s.chest_no,
                        team: s.team,
                        category: s.category,
                        totalPoints: 0,
                        stagePoints: 0,
                        nonStagePoints: 0
                    };
                }
            }
            return studentScores[id];
        };

        // Aggregation
        allRegistrations?.forEach((reg: any) => {
            if (reg.mark === null || reg.mark === undefined) return; // Only process graded entries

            const event = events?.find((e: any) => e.id === reg.event_id);
            if (!event) return;

            const student = students?.find((s: any) => s.id === reg.student_id);
            if (!student) return;

            const eventName = normalizeString(event.name || "");
            const isGroupEvent = event.is_group_event === true || ["histoart", "dictionarymaking", "swarafdebate", "swarfdebate"].includes(eventName);
            const individualPointExceptions = ["speechtranslation", "dictionarymaking", "swarafdebate", "swarfdebate"];
            const useGroupPoints = isGroupEvent && !individualPointExceptions.includes(eventName);

            const isStage = event.type === "Stage";
            const { points } = calculateGradeAndPoints(reg.mark, useGroupPoints);

            // Team Scores
            if (student.team === "Ignis") aurisScore += points;
            if (student.team === "Ventus") librasScore += points;

            // Individual Scores
            const studentStats = initStudent(student.id);
            if (studentStats) {
                if (isStage) {
                    studentStats.totalPoints += points;
                    studentStats.stagePoints += points;
                } else {
                    if (reg.is_star) {
                        studentStats.totalPoints += points;
                        studentStats.nonStagePoints += points;
                    }
                }
            }
        });

        // Champions calculation
        const allStudentsWithScores = Object.values(studentScores);
        const getChampions = (list: any[]) => {
            const star = [...list].sort((a: any, b: any) => b.stagePoints - a.stagePoints)[0] || null;
            const pen = [...list].sort((a: any, b: any) => b.nonStagePoints - a.nonStagePoints)[0] || null;
            return { star, pen };
        };

        const alpha = getChampions(allStudentsWithScores.filter((s: any) => s.category === "Protons"));
        const beta = getChampions(allStudentsWithScores.filter((s: any) => s.category === "Nexus"));
        const omega = getChampions(allStudentsWithScores.filter((s: any) => s.category === "Cosmos"));
        const globalChampions = getChampions(allStudentsWithScores);

        const categories: any = { Protons: 0, Nexus: 0, Cosmos: 0, "General-A": 0, "General-B": 0 };
        students?.forEach((s: any) => { if (categories[s.category] !== undefined) categories[s.category]++; });

        return NextResponse.json({
            counts: {
                students: totalStudents,
                events: totalEvents,
                results: completedEventsCount,
                registrations: registrationsCount
            },
            scores: {
                "Ignis": aurisScore,
                "Ventus": librasScore
            },
            champions: {
                alpha,
                beta,
                omega,
                star: globalChampions.star,
                pen: globalChampions.pen
            },
            categories
        });

    } catch (error) {
        console.error("Stats Error:", error);
        return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
    }
}
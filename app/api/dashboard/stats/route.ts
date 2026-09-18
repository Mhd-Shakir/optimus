import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateTotalPoints } from "@/lib/points";

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
            supabaseAdmin.from('events').select('*'),
            supabaseAdmin.from('registrations').select('*'),
            supabaseAdmin.from('events').select('*', { count: 'exact', head: true })
        ]);

        const totalStudents = students?.length || 0;
        const totalEvents = totalEventsCount || 0;
        const completedEventsCount = events?.filter(e => ['completed', 'announced'].includes(e.status)).length || 0;
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
                        nonStagePoints: 0,
                        events: []
                    };
                }
            }
            return studentScores[id];
        };

        const awardedGroupEventMarks = new Set<string>();

        // Aggregation
        allRegistrations?.forEach((reg: any) => {
            const event = events?.find((e: any) => e.id === reg.event_id);
            if (!event) return;

            const student = students?.find((s: any) => s.id === reg.student_id);
            if (!student) return;

            const eventName = normalizeString(event.name || "");
            const isGroupEvent = event.is_group_event === true || ["histoart", "dictionarymaking", "swarafdebate", "swarfdebate"].includes(eventName);
            const individualPointExceptions = ["speechtranslation", "dictionarymaking", "swarafdebate", "swarfdebate"];
            const useGroupScale = isGroupEvent && !individualPointExceptions.includes(eventName);

            const isStage = event.type === "Stage";
            const isCompleted = ['completed', 'announced'].includes(event.status);
            const hasMark = reg.mark !== null && reg.mark !== undefined;

            let points = 0;
            if (hasMark && isCompleted) {
                points = calculateTotalPoints(reg.mark, reg.position, useGroupScale).points;
            }

            // Individual Scores - Only for Non-Group Events (Star/Pen of the Fest)
            if (!isGroupEvent) {
                const studentStats = initStudent(student.id);
                if (studentStats) {
                    studentStats.events.push({
                        eventName: event.name,
                        mark: reg.mark,
                        position: reg.position,
                        points: points,
                        isStage: isStage,
                        isStar: reg.is_star,
                        isPublished: isCompleted && hasMark
                    });

                    if (isCompleted && hasMark) {
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
                }
            }

            // Team Scores
            if (isCompleted && hasMark) {
                if (isGroupEvent) {
                    const key = `${reg.event_id}-${student.team}-${reg.mark}`;
                    if (!awardedGroupEventMarks.has(key)) {
                        if (student.team === "Ignis") aurisScore += points;
                        if (student.team === "Ventus") librasScore += points;
                        awardedGroupEventMarks.add(key);
                    }
                } else {
                    if (student.team === "Ignis") aurisScore += points;
                    if (student.team === "Ventus") librasScore += points;
                }
            }
        });

        // Champions calculation
        const allStudentsWithScores = Object.values(studentScores);
        const getChampions = (list: any[]) => {
            const starList = [...list].filter(s => s.stagePoints > 0).sort((a: any, b: any) => b.stagePoints - a.stagePoints);
            const penList = [...list].filter(s => s.nonStagePoints > 0).sort((a: any, b: any) => b.nonStagePoints - a.nonStagePoints);
            
            return { 
                star: starList[0] || null, 
                pen: penList[0] || null,
                rankedStar: starList,
                rankedPen: penList
            };
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
                protons: alpha,
                nexus: beta,
                cosmos: omega,
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
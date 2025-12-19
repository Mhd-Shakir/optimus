import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import Student from "@/lib/models/student";
import Event from "@/lib/models/event";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDb();

    // 1. Fetch Data
    const students = await Student.find();
    const events = await Event.find({ status: "completed" }); 

    const totalStudents = students.length;
    const totalEvents = await Event.countDocuments();
    const completedEventsCount = events.length;
    const registrations = students.reduce((acc: number, s: any) => acc + (s.registeredEvents?.length || 0), 0);

    // 2. Initialize Score Trackers
    let aurisScore = 0;
    let librasScore = 0;
    const studentScores: any = {};

    const initStudent = (id: string) => {
        if (!studentScores[id]) {
            const s = students.find((std: any) => std._id.toString() === id);
            if (s) {
                studentScores[id] = {
                    id: s._id,
                    name: s.name,
                    chestNo: s.chestNo,
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

    // 3. Calculate Scores
    events.forEach((event: any) => {
        const { first, second, third, firstMark, secondMark, thirdMark } = event.results;
        const isStage = event.type === "Stage";
        const eventIdStr = event._id.toString();

        const processResult = (studentId: string, markStr: string) => {
            if (!studentId) return;
            const points = parseInt(markStr) || 0;
            const student = students.find((std: any) => std._id.toString() === studentId);

            if (student) {
                if (student.team === "Auris") aurisScore += points;
                if (student.team === "Libras") librasScore += points;

                const registration = student.registeredEvents?.find((r: any) => r.eventId === eventIdStr);
                const studentStats = initStudent(studentId);
                
                if (isStage) {
                    // STAGE: Count ALL points for "Star" titles
                    studentStats.totalPoints += points;
                    studentStats.stagePoints += points;
                } else {
                    // NON-STAGE: Count ONLY Star-Marked points for "Pen" titles
                    if (registration && registration.isStar) {
                        studentStats.totalPoints += points;
                        studentStats.nonStagePoints += points;
                    }
                }
            }
        };

        if (first) processResult(first, firstMark);
        if (second) processResult(second, secondMark);
        if (third) processResult(third, thirdMark);
    });

    // 4. Find Champions
    const allStudentsWithScores = Object.values(studentScores);

    // Helper to find Star & Pen for a specific list
    const getChampions = (list: any[]) => {
        // Star = Max Stage Points
        const star = [...list].sort((a: any, b: any) => b.stagePoints - a.stagePoints)[0] || null;
        // Pen = Max Non-Stage Points
        const pen = [...list].sort((a: any, b: any) => b.nonStagePoints - a.nonStagePoints)[0] || null;
        return { star, pen };
    };

    // Category-wise Champions
    const alpha = getChampions(allStudentsWithScores.filter((s:any) => s.category === "Alpha"));
    const beta = getChampions(allStudentsWithScores.filter((s:any) => s.category === "Beta"));
    const omega = getChampions(allStudentsWithScores.filter((s:any) => s.category === "Omega"));

    // Global Fest Champions
    const globalChampions = getChampions(allStudentsWithScores);

    // 5. Category Counts
    const categories: any = { Alpha: 0, Beta: 0, Omega: 0, "General-A": 0, "General-B": 0 };
    students.forEach((s: any) => { if (categories[s.category] !== undefined) categories[s.category]++; });

    return NextResponse.json({
        counts: {
            students: totalStudents,
            events: totalEvents,
            results: completedEventsCount,
            registrations
        },
        scores: {
            Auris: aurisScore,
            Libras: librasScore
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
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
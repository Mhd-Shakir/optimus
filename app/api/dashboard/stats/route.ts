import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import Student from "@/lib/models/student";
import Event from "@/lib/models/event";

export const dynamic = "force-dynamic";

// 👇 POINT SYSTEM CONFIGURATION
const INDIVIDUAL_POINTS: any = { "A+": 10, "A": 7, "B": 5, "C": 3 };
const GROUP_POINTS: any = { "A+": 25, "A": 20, "B": 13, "C": 7 };

const getPoints = (grade: string, isGroup: boolean) => {
    if (!grade) return 0;
    const g = grade.trim().toUpperCase();
    if (isGroup) return GROUP_POINTS[g] || 0;
    return INDIVIDUAL_POINTS[g] || 0;
};

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

    // 3. Calculate Scores based on Grades
    events.forEach((event: any) => {
        // 🛡️ SAFETY CHECK: Skip loop if results are missing to prevent 500 Crash
        if (!event.results) return;

        const { first, second, third, firstGrade, secondGrade, thirdGrade } = event.results;
        const isStage = event.type === "Stage";
        
        // 🛡️ NAME CHECK: Handle if 'name' is missing or casing differs
        const eventName = event.name || event.eventName || ""; 
        const isTargetEvent = eventName.toLowerCase().trim() === "speech translation";

        // ✅ LOGIC FIX: If event is "Speech Translation", force isGroup to FALSE
        const isGroup = event.groupEvent === true && !isTargetEvent; 
        
        const eventIdStr = event._id.toString();

        const processResult = (studentId: string, grade: string) => {
            if (!studentId) return;
            
            // Calculate Points based on Grade & Event Type
            const points = getPoints(grade, isGroup);
            
            // Ensure studentId is string for comparison
            const student = students.find((std: any) => std._id.toString() === studentId.toString());

            if (student) {
                // Team Scores
                if (student.team === "Auris") aurisScore += points;
                if (student.team === "Libras") librasScore += points;

                // Individual Champion Scores
                const registration = student.registeredEvents?.find((r: any) => r.eventId === eventIdStr);
                const studentStats = initStudent(studentId.toString());
                
                if (isStage) {
                    // Stage Points
                    studentStats.totalPoints += points;
                    studentStats.stagePoints += points;
                } else {
                    // Non-Stage Points (Only if Star marked)
                    if (registration && registration.isStar) {
                        studentStats.totalPoints += points;
                        studentStats.nonStagePoints += points;
                    }
                }
            }
        };

        if (first) processResult(first, firstGrade);
        if (second) processResult(second, secondGrade);
        if (third) processResult(third, thirdGrade);
    });

    // 4. Find Champions
    const allStudentsWithScores = Object.values(studentScores);

    const getChampions = (list: any[]) => {
        const star = [...list].sort((a: any, b: any) => b.stagePoints - a.stagePoints)[0] || null;
        const pen = [...list].sort((a: any, b: any) => b.nonStagePoints - a.nonStagePoints)[0] || null;
        return { star, pen };
    };

    const alpha = getChampions(allStudentsWithScores.filter((s:any) => s.category === "Alpha"));
    const beta = getChampions(allStudentsWithScores.filter((s:any) => s.category === "Beta"));
    const omega = getChampions(allStudentsWithScores.filter((s:any) => s.category === "Omega"));
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
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import Student from "@/lib/models/student";
import Event from "@/lib/models/event";

export const dynamic = "force-dynamic";

// ✅ UPDATED POINTS SYSTEM - Position-based for top 3, grade-based for others
const normalizeString = (str: string) => {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
};

// ✅ UPDATED: Position + grade points for top 3, grade-based for others
const getGradePoints = (grade: string, isGroup: boolean) => {
    if (isGroup) {
        if (grade === 'A+') return 15;
        if (grade === 'A') return 10;
        if (grade === 'B') return 5;
        if (grade === 'C') return 2;
        return 0;
    } else {
        if (grade === 'A+') return 6;
        if (grade === 'A') return 5;
        if (grade === 'B') return 3;
        if (grade === 'C') return 1;
        return 0;
    }
};

const getPoints = (grade: string, event: any, position: string) => {
    if (!grade && position !== 'first' && position !== 'second' && position !== 'third') return 0;

    const eventName = normalizeString(event.name);

    // Check if it's a group event
    const isGroupEvent = event.groupEvent === true ||
                         eventName === "histoart" ||
                         eventName === "dictionarymaking" ||
                         eventName === "swarafdebate" ||
                         eventName === "swarfdebate";

    // Events that use individual points even though they're group events
    const individualPointExceptions = [
        "speechtranslation",
        "dictionarymaking",
        "swarafdebate",
        "swarfdebate"
    ];

    const useGroupPoints = isGroupEvent && !individualPointExceptions.includes(eventName);
    const gradePoints = getGradePoints(grade, useGroupPoints);

    if (useGroupPoints) {
      // Group points: position + grade for top 3, grade-based for others
      if (position === 'first') return 10 + gradePoints;
      if (position === 'second') return 6 + gradePoints;
      if (position === 'third') return 3 + gradePoints;
      // for others: grade points only
      return gradePoints;
    } else {
      // Individual points: position + grade for top 3, grade-based for others
      if (position === 'first') return 5 + gradePoints;
      if (position === 'second') return 3 + gradePoints;
      if (position === 'third') return 1 + gradePoints;
      // for others: grade points only
      return gradePoints;
    }
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
        // 🛡️ SAFETY CHECK: Skip loop if results are missing
        if (!event.results) return;

        const { first, second, third, firstGrade, secondGrade, thirdGrade, others } = event.results;
        const isStage = event.type === "Stage";
        const eventIdStr = event._id.toString();

        const processResult = (studentId: string, grade: string, position: string) => {
            if (!studentId) return;

            // ✅ Calculate Points with new system
            const points = getPoints(grade, event, position);

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

        // Process top 3 positions with position-based points
        if (first) processResult(first, firstGrade, 'first');
        if (second) processResult(second, secondGrade, 'second');
        if (third) processResult(third, thirdGrade, 'third');

        // ✅ Process 4th+ positions with grade-based points
        if (others && Array.isArray(others)) {
            others.forEach((other: any) => {
                if (other.studentId) {
                    processResult(other.studentId, other.grade, 'other');
                }
            });
        }
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
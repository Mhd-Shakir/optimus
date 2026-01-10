import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import Student from "@/lib/models/student";
import Event from "@/lib/models/event";

export const dynamic = "force-dynamic";

// ✅ UPDATED POINTS SYSTEM - Matches results and team dashboard
const INDIVIDUAL_POINTS: any = { "A+": 11, "A": 10, "B": 7, "C": 5 };
const OTHER_GRADE_POINTS: any = { "A+": 6, "A": 4, "B": 3, "C": 1 };
const GROUP_POINTS: any = { "A+": 25, "A": 20, "B": 13, "C": 7 };

const normalizeString = (str: string) => {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
};

// ✅ UPDATED: Now handles "others" and uses correct point system
const getPoints = (grade: string, event: any, isOtherPosition: boolean = false) => {
    if (!grade) return 0;
    
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
    
    if (useGroupPoints) {
      // Group points
      return GROUP_POINTS[grade] || 0;
    } else {
      // Individual points
      if (isOtherPosition) {
        // 4th+ positions get reduced points
        return OTHER_GRADE_POINTS[grade] || 0;
      } else {
        // 1st, 2nd, 3rd get full individual points
        return INDIVIDUAL_POINTS[grade] || 0;
      }
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

        const processResult = (studentId: string, grade: string, isOtherPosition: boolean = false) => {
            if (!studentId || !grade) return;
            
            // ✅ Calculate Points with new system
            const points = getPoints(grade, event, isOtherPosition);
            
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

        // Process top 3 positions with full points
        if (first) processResult(first, firstGrade, false);
        if (second) processResult(second, secondGrade, false);
        if (third) processResult(third, thirdGrade, false);
        
        // ✅ Process 4th+ positions with reduced points
        if (others && Array.isArray(others)) {
            others.forEach((other: any) => {
                if (other.studentId && other.grade) {
                    processResult(other.studentId, other.grade, true);
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
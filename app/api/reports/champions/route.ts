import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { data: students, error: studentError } = await supabaseAdmin.from('students').select('*');
    const { data: events, error: eventError } = await supabaseAdmin.from('events').select('*').eq('status', 'completed');
    const { data: registrations, error: regError } = await supabaseAdmin.from('registrations').select('*');

    if (studentError || eventError || regError) throw new Error("DB Error");

    const championPoints: any = {};

    const getPoints = (grade: string) => {
        if (grade === "A+") return 10;
        if (grade === "A") return 7;
        if (grade === "B") return 5;
        if (grade === "C") return 3;
        return 0;
    };

    events.forEach((ev: any) => {
        const eventRegs = registrations.filter(r => r.event_id === ev.id && (r.position || r.grade));
        if (eventRegs.length === 0) return;
        
        // Rules (Case Insensitive)
        const isAlphaNonStage = ev.category === "Protons" && ev.type === "Non-Stage";
        const isSpeechTrans = ev.name.toLowerCase() === "speech translation" && ev.category === "Cosmos";

        const countsForChampion = !ev.is_group_event || isSpeechTrans;
        if (!countsForChampion) return; 

        eventRegs.forEach((reg: any) => {
            const studentId = reg.student_id;
            const grade = reg.grade;

            if (studentId && grade) {
                const student = students.find((s: any) => s.id === studentId);
                
                if (student) {
                    let pointsToAdd = getPoints(grade);

                    // Protons Rule: Only if Starred
                    if (isAlphaNonStage && !reg.is_star) {
                        pointsToAdd = 0;
                    }

                    if (!championPoints[studentId]) {
                        championPoints[studentId] = {
                            name: student.name,
                            team: student.team,
                            category: student.category,
                            totalPoints: 0
                        };
                    }
                    if (pointsToAdd > 0) {
                        championPoints[studentId].totalPoints += pointsToAdd;
                    }
                }
            }
        });
    });

    const ranking = Object.values(championPoints).sort((a: any, b: any) => b.totalPoints - a.totalPoints);
    return NextResponse.json(ranking, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
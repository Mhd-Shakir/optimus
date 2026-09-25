import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateTotalPoints } from "@/lib/points";

export async function GET(req: Request) {
  try {
    const { data: students, error: studentError } = await supabaseAdmin.from('students').select('*');
    const { data: events, error: eventError } = await supabaseAdmin.from('events').select('*').eq('status', 'completed');
    const { data: registrations, error: regError } = await supabaseAdmin.from('registrations').select('*');

    if (studentError || eventError || regError) throw new Error("DB Error");

    const championPoints: any = {};
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

            if (studentId && (grade || reg.mark)) {
                const student = students.find((s: any) => s.id === studentId);
                
                if (student) {
                    const { points } = calculateTotalPoints(reg.mark, reg.position, false); // Champion logic only applies to individual scale
                    let pointsToAdd = points;

                    // Protons Rule: Only if Starred
                    if (isAlphaNonStage && !reg.is_star) {
                        pointsToAdd = 0;
                    }

                    if (!championPoints[studentId]) {
                        championPoints[studentId] = {
                            name: student.name,
                            team: student.team,
                            category: student.category,
                            totalPoints: 0,
                            firstCount: 0,
                            secondCount: 0,
                            thirdCount: 0,
                            totalMarks: 0
                        };
                    }
                    if (pointsToAdd > 0) {
                        championPoints[studentId].totalPoints += pointsToAdd;
                        championPoints[studentId].totalMarks += (typeof reg.mark === 'number' ? reg.mark : (parseFloat(reg.mark) || 0));
                        const posNorm = (reg.position || '').toString().toLowerCase().trim();
                        if (posNorm === 'first' || posNorm === '1st') championPoints[studentId].firstCount++;
                        else if (posNorm === 'second' || posNorm === '2nd') championPoints[studentId].secondCount++;
                        else if (posNorm === 'third' || posNorm === '3rd') championPoints[studentId].thirdCount++;
                    }
                }
            }
        });
    });

    const ranking = Object.values(championPoints).sort((a: any, b: any) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (b.firstCount !== a.firstCount) return b.firstCount - a.firstCount;
        if (b.secondCount !== a.secondCount) return b.secondCount - a.secondCount;
        if (b.thirdCount !== a.thirdCount) return b.thirdCount - a.thirdCount;
        return (b.totalMarks || 0) - (a.totalMarks || 0);
    });
    return NextResponse.json(ranking, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
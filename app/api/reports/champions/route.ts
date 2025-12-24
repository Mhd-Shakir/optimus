import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import Student from "@/lib/models/student";
import Event from "@/lib/models/event";

export async function GET(req: Request) {
  try {
    await connectToDB();
    const students = await Student.find().lean();
    const events = await Event.find({ status: "completed" }).lean();

    const championPoints: any = {};

    const getPoints = (grade: string) => {
        if (grade === "A+") return 10;
        if (grade === "A") return 7;
        if (grade === "B") return 5;
        if (grade === "C") return 3;
        return 0;
    };

    events.forEach((ev: any) => {
        if (!ev.results) return;
        
        // Rules (Case Insensitive)
        const isAlphaNonStage = ev.category === "Alpha" && ev.type === "Non-Stage";
        const isSpeechTrans = ev.name.toLowerCase() === "speech translation" && ev.category === "Omega";

        // Logic: Group events usually don't count for Individual Champion
        // BUT Speech Translation (Group) DOES count as Normal Individual Non-Stage point
        const countsForChampion = !ev.groupEvent || isSpeechTrans;

        if (!countsForChampion) return; 

        ["first", "second", "third"].forEach((pos) => {
            const studentId = ev.results[pos];
            const grade = ev.results[`${pos}Grade`];

            if (studentId && grade) {
                const student = students.find((s: any) => s._id.toString() === studentId);
                
                if (student) {
                    let pointsToAdd = getPoints(grade);

                    // Alpha Rule: Only if Starred
                    if (isAlphaNonStage) {
                        const registeredEvent = student.registeredEvents?.find(
                            (re: any) => re.eventId === ev._id.toString()
                        );
                        if (!registeredEvent?.isStar) pointsToAdd = 0;
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
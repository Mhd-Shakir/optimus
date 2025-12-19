import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import Event from "@/lib/models/event";
import Student from "@/lib/models/student";

export async function GET() {
  try {
    await connectToDb();

    const events = await Event.find();
    const students = await Student.find();

    // 1. Team Totals (Teams get points for EVERYTHING)
    let aurisTotal = 0;
    let librasTotal = 0;
    events.forEach((event: any) => {
      if (event.teamPoints) {
        aurisTotal += event.teamPoints.Auris || 0;
        librasTotal += event.teamPoints.Libras || 0;
      }
    });

    // 2. Map Event Categories (Stage vs Non-Stage)
    const eventMap: Record<string, string> = {};
    events.forEach((e: any) => {
      eventMap[e._id.toString()] = e.category; // 'stage' or 'non-stage'
    });

    // 3. Calculate Individual Champions
    const categories = ["Alpha", "Beta", "Omega"];
    const champions: any = {};

    categories.forEach(cat => {
      const catStudents = students.filter((s: any) => s.category === cat);

      const studentScores = catStudents.map((student: any) => {
        let stagePoints = 0;
        let nonStagePoints = 0;

        student.registeredEvents.forEach((reg: any) => {
          const eventType = eventMap[reg.eventId.toString()];
          const points = reg.points || 0;

          if (points > 0) {
            if (eventType === "stage") {
              // Rule: Stage events ALWAYS count for individual (No star mark needed)
              stagePoints += points;
            } else {
              // Rule: Non-Stage events ONLY count if Star Marked
              if (reg.isStar) {
                nonStagePoints += points;
              }
            }
          }
        });

        return {
          name: student.name,
          chestNo: student.chestNo,
          team: student.team,
          stagePoints,
          nonStagePoints
        };
      });

      // Find Champions
      const star = studentScores
        .filter((s: any) => s.stagePoints > 0)
        .sort((a: any, b: any) => b.stagePoints - a.stagePoints)[0] || null;

      const pen = studentScores
        .filter((s: any) => s.nonStagePoints > 0)
        .sort((a: any, b: any) => b.nonStagePoints - a.nonStagePoints)[0] || null;

      champions[cat] = { star, pen };
    });

    return NextResponse.json({
      teams: { Auris: aurisTotal, Libras: librasTotal },
      champions
    });

  } catch (error) {
    return NextResponse.json({ error: "Stats failed" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateGradeAndPoints } from "@/lib/points";

const normalizeString = (str: string) => str ? str.toLowerCase().replace(/[^a-z0-9]/g, "") : "";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventId, results } = body;

    if (!eventId) return NextResponse.json({ error: "Event ID is missing" }, { status: 400 });

    const { data: event } = await supabaseAdmin.from('events').select('*').eq('id', eventId).single();
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const eventName = normalizeString(event.name || "");
    const isGroupEvent = event.is_group_event === true || ["histoart", "dictionarymaking", "swarafdebate", "swarfdebate"].includes(eventName);
    const individualPointExceptions = ["speechtranslation", "dictionarymaking", "swarafdebate", "swarfdebate"];
    const useGroupPoints = isGroupEvent && !individualPointExceptions.includes(eventName);

    // Fetch all registrations for this event to map Code Letters to Student IDs
    const { data: registrations } = await supabaseAdmin.from('registrations')
      .select('student_id, code_letter, group_no')
      .eq('event_id', eventId);

    const { data: students } = await supabaseAdmin.from('students').select('id, team');
    const studentTeamMap = new Map();
    students?.forEach((s: any) => studentTeamMap.set(s.id, s.team));

    const teamPoints: any = { "Ignis": 0, "Ventus": 0 };
    const registrationUpdates: any[] = [];

    const getStudentsByCode = (code: string) => {
        if (!code) return [];
        return (registrations || []).filter(r => r.code_letter === code).map(r => r.student_id);
    };

    // Sort results descending by mark
    const sortedResults = [...results].sort((a, b) => b.mark - a.mark);

    // Group by mark to handle ties
    let currentRank = 1;
    let previousMark = -1;

    sortedResults.forEach((winner, index) => {
      const mark = Number(winner.mark);
      if (mark === 0) return; // Skip 0 marks just in case

      if (previousMark !== -1 && mark < previousMark) {
         currentRank++;
      }
      previousMark = mark;

      let position = 'other';
      if (currentRank === 1) position = 'first';
      else if (currentRank === 2) position = 'second';
      else if (currentRank === 3) position = 'third';

      const { grade, points } = calculateGradeAndPoints(mark, useGroupPoints);
      
      const studentIds = getStudentsByCode(winner.codeLetter);
      
      studentIds.forEach(studentId => {
          const team = studentTeamMap.get(studentId);
          if (team && teamPoints[team] !== undefined) teamPoints[team] += points;

          registrationUpdates.push({
            student_id: studentId,
            event_id: eventId,
            position: position,
            grade: grade,
            mark: mark
          });
      });
    });

    // First clear existing results for this event
    await supabaseAdmin.from('registrations')
      .update({ position: null, grade: null, mark: null })
      .eq('event_id', eventId);

    // Apply new updates
    for (const update of registrationUpdates) {
      await supabaseAdmin.from('registrations')
        .update({ position: update.position, grade: update.grade, mark: update.mark })
        .match({ student_id: update.student_id, event_id: update.event_id });
    }

    const { data: updatedEvent, error: updateError } = await supabaseAdmin.from('events')
      .update({
        status: "completed",
        team_points_auris: teamPoints["Ignis"],
        team_points_libras: teamPoints["Ventus"]
      })
      .eq('id', eventId)
      .select()
      .single();

    if (updateError) throw updateError;
    return NextResponse.json({ message: "Result Updated via Judge", event: updatedEvent });

  } catch (error: any) {
    console.error("Error updating result:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

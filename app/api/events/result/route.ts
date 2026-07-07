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

    const { data: students } = await supabaseAdmin.from('students').select('id, team');
    const studentMap = new Map();
    students?.forEach((s: any) => studentMap.set(s.id, s.team));

    const teamPoints: any = { "Ignis": 0, "Ventus": 0 };
    const registrationUpdates: any[] = [];

    const processWinners = (winnerArray: any[], position: string) => {
      if (Array.isArray(winnerArray)) {
        winnerArray.forEach((winner: any) => {
          if (winner.studentId && winner.mark !== undefined) {
            const mark = Number(winner.mark);
            const { grade, points } = calculateGradeAndPoints(mark, useGroupPoints);
            
            const team = studentMap.get(winner.studentId);
            if (team && teamPoints[team] !== undefined) teamPoints[team] += points;

            registrationUpdates.push({
              student_id: winner.studentId,
              event_id: eventId,
              position: position,
              grade: grade,
              mark: mark
            });
          }
        });
      }
    };

    processWinners(results.first, 'first');
    processWinners(results.second, 'second');
    processWinners(results.third, 'third');
    processWinners(results.others, 'other');

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
    return NextResponse.json({ message: "Result Updated", event: updatedEvent });

  } catch (error: any) {
    console.error("Error updating result:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { eventId } = await req.json();
    if (!eventId) return NextResponse.json({ error: "Event ID is missing" }, { status: 400 });

    await supabaseAdmin.from('registrations')
      .update({ position: null, grade: null, mark: null })
      .eq('event_id', eventId);

    const { data: updatedEvent, error } = await supabaseAdmin.from('events')
      .update({
        status: "upcoming",
        team_points_auris: 0,
        team_points_libras: 0
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ message: "Result Deleted", event: updatedEvent });

  } catch (error: any) {
    console.error("Error deleting result:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
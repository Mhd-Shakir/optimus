import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const mapEvent = (dbEvent: any) => ({
  _id: dbEvent.id,
  name: dbEvent.name,
  category: dbEvent.category,
  type: dbEvent.type,
  status: dbEvent.status,
  groupEvent: dbEvent.is_group_event,
  teamPoints: {
    "Ignis": dbEvent.team_points_auris,
    "Ventus": dbEvent.team_points_libras
  },
  teamLimit: dbEvent.team_limit,
  createdAt: dbEvent.created_at,
  // Ensure we mock the results structure the frontend expects
  results: {
    first: [],
    second: [],
    third: [],
    others: []
  }
});

export async function GET() {
  try {
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (eventsError) throw eventsError;

    // Fetch all registrations that have a position OR a code letter
    const { data: registrations, error: regError } = await supabaseAdmin
      .from('registrations')
      .select('*, students(chest_no, name)')
      .or('position.not.is.null,code_letter.not.is.null');

    if (regError) throw regError;

    const mappedEvents = events.map((dbEvent: any) => {
      const eventRegs = registrations.filter((r: any) => r.event_id === dbEvent.id);
      
      const hasCodeLetters = eventRegs.some((r: any) => r.code_letter !== null && r.code_letter !== "");

      const formatWinner = (reg: any) => ({
        studentId: reg.student_id,
        chestNo: reg.students?.chest_no || "",
        name: reg.students?.name || "",
        codeLetter: reg.code_letter || "",
        mark: reg.mark || 0,
        grade: reg.grade || ""
      });

      const first = eventRegs.filter((r: any) => r.position === 'first').map(formatWinner);
      const second = eventRegs.filter((r: any) => r.position === 'second').map(formatWinner);
      const third = eventRegs.filter((r: any) => r.position === 'third').map(formatWinner);
      const others = eventRegs.filter((r: any) => r.position === 'other').map(formatWinner);

      return {
        _id: dbEvent.id,
        name: dbEvent.name,
        category: dbEvent.category,
        type: dbEvent.type,
        status: dbEvent.status,
        groupEvent: dbEvent.is_group_event,
        hasCodeLetters: hasCodeLetters,
        teamPoints: {
          "Ignis": dbEvent.team_points_auris,
          "Ventus": dbEvent.team_points_libras
        },
        teamLimit: dbEvent.team_limit,
        createdAt: dbEvent.created_at,
        results: { first, second, third, others }
      };
    });

    return NextResponse.json(mappedEvents);
  } catch (error: any) {
    console.error("Fetch Events Error:", error);
    return NextResponse.json({ error: "Failed to fetch events", details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || !body.category || !body.type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: newEvent, error } = await supabaseAdmin
      .from('events')
      .insert([{
        name: body.name,
        category: body.category,
        type: body.type,
        is_group_event: body.groupEvent || false,
        status: body.status || 'upcoming'
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: "Event Created", event: mapEvent(newEvent) }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create event" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('events').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete event", details: error.message }, { status: 500 });
  }
}
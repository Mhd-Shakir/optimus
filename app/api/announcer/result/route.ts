import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    // Fetch the event
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Fetch registrations that have a position or grade
    const { data: registrations, error: regError } = await supabaseAdmin
      .from('registrations')
      .select('*, students(chest_no, name, team)')
      .eq('event_id', eventId)
      .or('position.not.is.null,grade.not.is.null');

    if (regError) throw regError;

    const formatWinner = (reg: any) => ({
      studentId: reg.student_id,
      chestNo: reg.students?.chest_no || "",
      codeLetter: reg.code_letter || "-",
      name: reg.students?.name || "",
      team: reg.students?.team || "Unknown",
      mark: reg.mark || 0,
      grade: reg.grade || "",
      position: reg.position,
      isCaptain: reg.is_captain || false,
      groupNo: reg.group_no || null
    });

    const first = registrations.filter((r: any) => r.position === 'first').map(formatWinner);
    const second = registrations.filter((r: any) => r.position === 'second').map(formatWinner);
    const third = registrations.filter((r: any) => r.position === 'third').map(formatWinner);
    const others = registrations.filter((r: any) => r.position === 'other' || (!r.position && r.grade)).map(formatWinner);

    return NextResponse.json({
      event,
      results: { first, second, third, others }
    });
  } catch (error: any) {
    console.error("Fetch Announcer Result Error:", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { eventId, status } = await req.json();

    if (!eventId || status !== 'announced') {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { data: event } = await supabaseAdmin.from('events').select('topics').eq('id', eventId).single();
    let topics = event?.topics || [];
    if (!topics.some((t: string) => typeof t === 'string' && t.startsWith('__announced_at:'))) {
      topics.push(`__announced_at:${Date.now()}`);
    }

    const { error } = await supabaseAdmin
      .from('events')
      .update({ status: 'announced', topics })
      .eq('id', eventId);

    if (error) throw error;

    // 🚀 NEW LINE: Ping the public website to instantly trigger the sync
    fetch("https://optimusfest.in/api/webhooks/sync", { method: "POST" }).catch(console.error);

    return NextResponse.json({ message: "Event marked as announced" });
  } catch (error: any) {
    console.error("Mark Announced Error:", error);
    return NextResponse.json({ error: "Failed to mark as announced" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid format: Expected an array of events" }, { status: 400 });
    }

    const eventsToInsert = body.map((ev: any) => ({
      name: ev.name,
      category: ev.category,
      type: ev.type,
      is_group_event: ev.groupEvent || ev.is_group_event || false,
      team_limit: ev.teamLimit ? parseInt(ev.teamLimit) : null,
      status: ev.status || 'upcoming'
    }));

    const { error } = await supabaseAdmin.from('events').insert(eventsToInsert);

    if (error) throw error;

    return NextResponse.json({ message: "Events added successfully", count: eventsToInsert.length });
  } catch (error: any) {
    console.error("Bulk Upload Error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload events" }, { status: 500 });
  }
}
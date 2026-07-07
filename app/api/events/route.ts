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
    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(events.map(mapEvent));
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
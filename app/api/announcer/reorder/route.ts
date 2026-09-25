import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { eventIds } = await req.json();

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json({ error: "Invalid event IDs array" }, { status: 400 });
    }

    // Base timestamp so each step is +1 second
    const baseTime = Date.now() - (eventIds.length * 1000 * 60);

    // Update each event with sequential timestamp marker in topics
    for (let i = 0; i < eventIds.length; i++) {
      const id = eventIds[i];
      const timeMarker = baseTime + (i * 1000);

      const { data: event } = await supabaseAdmin.from('events').select('topics').eq('id', id).single();
      let topics = (event?.topics || []).filter((t: string) => typeof t === 'string' && !t.startsWith('__announced_at:'));
      topics.push(`__announced_at:${timeMarker}`);

      await supabaseAdmin
        .from('events')
        .update({ topics })
        .eq('id', id);
    }

    return NextResponse.json({ message: "Events reordered successfully" });
  } catch (error: any) {
    console.error("Reorder Announced Events Error:", error);
    return NextResponse.json({ error: "Failed to reorder events" }, { status: 500 });
  }
}

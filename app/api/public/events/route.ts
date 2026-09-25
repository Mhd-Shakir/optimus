import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { corsHeaders } from "../cors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('id, name, category, type, is_group_event, topics, created_at')
      .eq('status', 'announced');

    if (error) throw error;

    // Filter out the internal announcement markers from topics
    const cleanEvents = events.map(event => {
      const topics = (event.topics || []).filter((t: string) => typeof t === 'string' && !t.startsWith('__announced_at:'));
      return {
        id: event.id,
        name: event.name,
        category: event.category,
        type: event.type,
        isGroupEvent: event.is_group_event,
        topics,
        createdAt: event.created_at
      };
    });

    // Group by category to make frontend implementation easier
    const grouped = cleanEvents.reduce((acc: any, event) => {
      if (!acc[event.category]) {
        acc[event.category] = [];
      }
      acc[event.category].push(event);
      return acc;
    }, {});

    return NextResponse.json({
        events: cleanEvents,
        groupedByCategory: grouped
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("Public Fetch Events Error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

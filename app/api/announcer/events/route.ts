import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .in('status', ['completed', 'announced']);

    if (error) throw error;

    const getAnnouncedTime = (event: any) => {
      const marker = (event.topics || []).find((t: string) => typeof t === 'string' && t.startsWith('__announced_at:'));
      return marker ? parseInt(marker.split(':')[1]) : new Date(event.created_at || 0).getTime();
    };

    const completedEvents = (events || []).filter((e: any) => e.status !== 'announced');
    const announcedEvents = (events || []).filter((e: any) => e.status === 'announced');

    // Sort announced events chronologically by when they were announced
    announcedEvents.sort((a: any, b: any) => getAnnouncedTime(a) - getAnnouncedTime(b));

    // Assign the official announcement sequence number (#1, #2, ... #40)
    const announcedWithSeq = announcedEvents.map((e: any, index: number) => ({
      ...e,
      announcedNumber: index + 1
    }));

    return NextResponse.json([...completedEvents, ...announcedWithSeq]);
  } catch (error: any) {
    console.error("Announcer Fetch Events Error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .in('status', ['completed', 'announced'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(events);
  } catch (error: any) {
    console.error("Announcer Fetch Events Error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

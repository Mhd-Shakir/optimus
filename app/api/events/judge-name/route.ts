import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { eventId, judgeName } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const { data: event } = await supabaseAdmin.from('events').select('topics').eq('id', eventId).single();
    let topics = (event?.topics || []).filter((t: string) => typeof t === 'string' && !t.startsWith('__judge_name:'));
    
    if (judgeName && judgeName.trim()) {
      topics.push(`__judge_name:${judgeName.trim()}`);
    }

    const { error } = await supabaseAdmin
      .from('events')
      .update({ topics })
      .eq('id', eventId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Judge name saved successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

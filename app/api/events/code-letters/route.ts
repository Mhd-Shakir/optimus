import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    
    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { data: registrations, error: regError } = await supabaseAdmin
      .from('registrations')
      .select('*, students:student_id(id, name, chest_no, team)')
      .eq('event_id', eventId);

    if (regError) {
      return NextResponse.json({ error: regError.message }, { status: 500 });
    }

    return NextResponse.json({ event, registrations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { updates } = await req.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: "Updates must be an array" }, { status: 400 });
    }

    // We can do this concurrently to speed it up
    const promises = updates.map(update => {
      if (update.id && update.code_letter) {
        return supabaseAdmin
          .from('registrations')
          .update({ code_letter: update.code_letter })
          .eq('id', update.id);
      }
      return Promise.resolve();
    });

    await Promise.all(promises);

    return NextResponse.json({ success: true, message: "Code letters saved successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

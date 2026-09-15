import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { updates } = await req.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json({ error: "Updates must be an array" }, { status: 400 });
    }

    // Update each registration's assigned topic
    const promises = updates.map(update => {
      if (update.id && update.assigned_topic !== undefined) {
        return supabaseAdmin
          .from('registrations')
          .update({ assigned_topic: update.assigned_topic })
          .eq('id', update.id);
      }
      return Promise.resolve();
    });

    await Promise.all(promises);

    return NextResponse.json({ success: true, message: "Assigned topics saved successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { eventId, studentIds } = await req.json();

    if (!eventId) return NextResponse.json({ error: "Event is required" }, { status: 400 });
    if (!studentIds || !studentIds.length) return NextResponse.json({ error: "Participants are required" }, { status: 400 });

    // Insert new registrations for the group event
    const newRegistrations = studentIds.map((id: string) => ({
      student_id: id,
      event_id: eventId,
      is_star: false,
      status: 'registered'
    }));

    const { error } = await supabaseAdmin.from('registrations').insert(newRegistrations);

    if (error) {
        if (error.code === '23505') {
            // Unique violation (meaning some student might already be registered for this event)
            return NextResponse.json({ error: "One or more students are already registered for this event." }, { status: 400 });
        }
        throw error;
    }

    return NextResponse.json({ message: "Group Registered Successfully" });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Registration Failed" }, { status: 500 });
  }
}

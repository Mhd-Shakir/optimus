import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase"; 

export async function POST(req: Request) {
  try {
    const { studentId, eventId, status } = await req.json();

    if (!studentId || !eventId || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Update the specific event's status in the registrations table
    const { data: registration, error } = await supabaseAdmin
      .from('registrations')
      .update({ status })
      .eq('student_id', studentId)
      .eq('event_id', eventId)
      .select()
      .single();

    if (error || !registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Status updated", registration }, { status: 200 });

  } catch (error) {
    console.error("Stage Update Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
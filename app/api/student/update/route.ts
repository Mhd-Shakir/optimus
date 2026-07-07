import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { id, name, category, studentClass, selectedEvents } = await req.json();

    if (!id) return NextResponse.json({ error: "Student ID missing" }, { status: 400 });

    // 1. Update Student Table
    const { data: updatedStudent, error: updateError } = await supabaseAdmin
      .from('students')
      .update({ name, category, student_class: studentClass || "" })
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedStudent) {
      return NextResponse.json({ error: "Student not found or update failed" }, { status: 404 });
    }

    // 2. Refresh Registrations
    // Delete old
    await supabaseAdmin.from('registrations').delete().eq('student_id', id);

    // Insert new
    if (selectedEvents && selectedEvents.length > 0) {
      const newRegistrations = selectedEvents.map((ev: any) => ({
        student_id: id,
        event_id: ev.eventId,
        is_star: ev.isStar || false,
        status: 'registered'
      }));
      await supabaseAdmin.from('registrations').insert(newRegistrations);
    }

    return NextResponse.json({ message: "Student Updated Successfully", student: updatedStudent });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Update Failed" }, { status: 500 });
  }
}
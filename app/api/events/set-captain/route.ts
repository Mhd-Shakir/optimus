import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { eventId, team, groupNo, captainStudentId } = await req.json();

    if (!eventId || !team || !groupNo || !captainStudentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Get all registration IDs for this group so we can unset them first
    // We have to query the students table to find which students are in this team
    const { data: students, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, team')
      .eq('team', team);

    if (studentError) {
      return NextResponse.json({ error: studentError.message }, { status: 500 });
    }

    const studentIds = students.map(s => s.id);

    // 2. Unset is_captain for all students in this group
    await supabaseAdmin
      .from('registrations')
      .update({ is_captain: false })
      .eq('event_id', eventId)
      .eq('group_no', groupNo)
      .in('student_id', studentIds);

    // 3. Set is_captain for the selected student
    const { error: updateError } = await supabaseAdmin
      .from('registrations')
      .update({ is_captain: true })
      .eq('event_id', eventId)
      .eq('group_no', groupNo)
      .eq('student_id', captainStudentId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

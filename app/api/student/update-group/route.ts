import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { eventId, studentIds, team, groupNo, originalGroupNo } = await req.json();
    const resolvedGroupNo = groupNo || 1;
    const resolvedOriginalGroupNo = originalGroupNo || resolvedGroupNo;

    if (!eventId) return NextResponse.json({ error: "Event is required" }, { status: 400 });
    if (!team) return NextResponse.json({ error: "Team is required" }, { status: 400 });
    const resolvedStudentIds = studentIds || [];

    // Removed registration open checks to allow editing existing groups even if new registrations are closed.

    // 3. Fetch all student IDs of this team
    const { data: teamStudents, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('team', team);

    if (studentError) throw studentError;
    const teamStudentIds = teamStudents?.map(s => s.id) || [];

    // 4. Delete existing registrations for this event for all students in this team, matching the original group number
    if (teamStudentIds.length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from('registrations')
        .delete()
        .eq('event_id', eventId)
        .eq('group_no', resolvedOriginalGroupNo)
        .in('student_id', teamStudentIds);

      if (deleteError) throw deleteError;
    }

    // 5. Insert new registrations
    if (resolvedStudentIds.length > 0) {
      const newRegistrations = resolvedStudentIds.map((id: string) => ({
        student_id: id,
        event_id: eventId,
        is_star: false,
        status: 'registered',
        group_no: resolvedGroupNo
      }));

      const { error: insertError } = await supabaseAdmin
        .from('registrations')
        .insert(newRegistrations);

      if (insertError) {
        if (insertError.code === '23505') {
          return NextResponse.json({ error: "One or more students are already registered for this event." }, { status: 400 });
        }
        throw insertError;
      }
    }

    return NextResponse.json({ message: "Group updated successfully" });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Update Failed" }, { status: 500 });
  }
}

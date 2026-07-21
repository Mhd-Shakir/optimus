import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const mapStudent = (dbStudent: any, registrations: any[] = []) => ({
  _id: dbStudent.id,
  name: dbStudent.name,
  chestNo: dbStudent.chest_no,
  team: dbStudent.team,
  category: dbStudent.category,
  admissionNo: dbStudent.admission_no,
  studentClass: dbStudent.student_class,
  createdAt: dbStudent.created_at,
  registeredEvents: registrations.map((reg: any) => ({
    eventId: reg.event_id,
    isStar: reg.is_star,
    status: reg.status,
    position: reg.position,
    grade: reg.grade,
    groupNo: reg.group_no
  }))
});

export async function GET() {
  const { data: students, error: studentError } = await supabaseAdmin
    .from('students')
    .select('*')
    .order('created_at', { ascending: false });

  if (studentError) {
    return NextResponse.json({ error: studentError.message }, { status: 500 });
  }

  const { data: registrations, error: regError, count: regCount } = await supabaseAdmin
    .from('registrations')
    .select('*', { count: 'exact' })
    .limit(100000);

  if (regError) {
    return NextResponse.json({ error: regError.message }, { status: 500 });
  }

  console.log(`[student/list] students: ${students?.length}, registrations fetched: ${registrations?.length}, total in DB: ${regCount}`);

  // Map students and attach their registrations
  const mappedStudents = (students || []).map((s: any) => {
    const studentRegistrations = (registrations || []).filter((r: any) => r.student_id === s.id);
    return mapStudent(s, studentRegistrations);
  });

  return NextResponse.json(mappedStudents);
}
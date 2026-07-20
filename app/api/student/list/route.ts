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
    .select('*, registrations(*)')
    .order('created_at', { ascending: false });

  if (studentError) {
    return NextResponse.json({ error: studentError.message }, { status: 500 });
  }

  // Map students and attach their registrations
  const mappedStudents = students.map((s: any) => {
    return mapStudent(s, s.registrations || []);
  });

  return NextResponse.json(mappedStudents);
}
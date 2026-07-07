import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Helper to map Supabase Student to Frontend Student
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
    grade: reg.grade
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

  const { data: registrations, error: regError } = await supabaseAdmin
    .from('registrations')
    .select('*');

  if (regError) {
    return NextResponse.json({ error: regError.message }, { status: 500 });
  }

  // Map students and attach their registrations
  const mappedStudents = students.map((s: any) => {
    const studentRegs = registrations.filter((r: any) => r.student_id === s.id);
    return mapStudent(s, studentRegs);
  });

  return NextResponse.json(mappedStudents);
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('students').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ message: 'Student deleted successfully' }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete student', details: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { data: newStudent, error } = await supabaseAdmin
      .from('students')
      .insert([{
        name: body.name,
        chest_no: body.chestNo,
        team: body.team,
        category: body.category,
        admission_no: body.admissionNo || "",
        student_class: body.studentClass || ""
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Supabase Unique Violation
        return NextResponse.json(
          { error: `Duplicate detected! This chest number already exists.` }, 
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(mapStudent(newStudent, []), { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: 'Server Error', details: error.message }, { status: 500 });
  }
}
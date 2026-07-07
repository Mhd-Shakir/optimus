import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    // 1. Check if registration is open (we assume settings table has id=1)
    const { data: settings } = await supabaseAdmin
      .from('settings')
      .select('registration_open')
      .limit(1)
      .single();

    if (settings && settings.registration_open === false) {
      return NextResponse.json(
        { error: "Registration is currently CLOSED by Admin." }, 
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, chestNo, team, category, admissionNo, studentClass, selectedEvents } = body;

    if (!name || !chestNo || !team || !category || !studentClass) {
      return NextResponse.json({ error: "Missing required fields, including Class" }, { status: 400 });
    }

    // 2. Create Student
    const { data: newStudent, error: studentError } = await supabaseAdmin
      .from('students')
      .insert([{
        name,
        chest_no: chestNo,
        team,
        category,
        admission_no: admissionNo || "",
        student_class: studentClass || ""
      }])
      .select()
      .single();

    if (studentError) {
      if (studentError.code === '23505') {
        return NextResponse.json({ error: "Chest Number already exists!" }, { status: 400 });
      }
      throw studentError;
    }

    // 3. Create Registrations if selectedEvents exist
    if (selectedEvents && selectedEvents.length > 0) {
      const registrationsToInsert = selectedEvents.map((ev: any) => ({
        student_id: newStudent.id,
        event_id: ev.eventId,
        is_star: ev.isStar || false,
        status: 'registered'
      }));

      const { error: regError } = await supabaseAdmin
        .from('registrations')
        .insert(registrationsToInsert);

      if (regError) {
        console.error("Failed to insert registrations:", regError);
        // Continue anyway, but might want to rollback in production
      }
    }

    return NextResponse.json({ message: "Student Registered", student: newStudent }, { status: 201 });

  } catch (error: any) {
    console.error("Registration CRASH:", error); 
    return NextResponse.json({ error: error.message || "Registration Failed" }, { status: 500 });
  }
}
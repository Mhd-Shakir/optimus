import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request, { params }: { params: { chestNo: string } }) {
  try {
    const { chestNo } = await params;

    // 1. Fetch Student
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('chest_no', chestNo)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // 2. Fetch Registrations
    const { data: registrations, error: regError } = await supabaseAdmin
      .from('registrations')
      .select('*')
      .eq('student_id', student.id);

    if (regError) {
      return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 });
    }

    // 3. Fetch Event Details for these registrations
    const eventIds = registrations.map((r: any) => r.event_id);
    let events: any[] = [];
    
    if (eventIds.length > 0) {
      const { data: eventData, error: eventFetchError } = await supabaseAdmin
        .from('events')
        .select('id, name, category, is_group_event')
        .in('id', eventIds);
        
      if (!eventFetchError) {
        events = eventData;
      } else {
        console.error("Error fetching events:", eventFetchError);
      }
    }

    // Combine Data
    const fullRegistrations = registrations.map((reg: any) => {
      const eventDetails = events.find(e => e.id === reg.event_id);
      return {
        ...reg,
        eventName: eventDetails?.name || "Unknown Event",
        eventCategory: eventDetails?.category || "",
        isGroupEvent: eventDetails?.is_group_event || false
      };
    });

    return NextResponse.json({
      student,
      programs: fullRegistrations
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

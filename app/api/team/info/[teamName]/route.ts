import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request, { params }: { params: { teamName: string } }) {
  try {
    const { teamName } = await params;
    
    // Validate team name
    const validTeams = ["ignis", "ventus", "aqua", "terra", "aether"];
    const normalizedTeam = teamName.toLowerCase();
    
    if (!validTeams.includes(normalizedTeam)) {
      return NextResponse.json({ error: "Invalid team" }, { status: 400 });
    }

    // Capitalize team name
    const team = normalizedTeam.charAt(0).toUpperCase() + normalizedTeam.slice(1);

    // 1. Fetch Students in team
    const { data: students, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, name, chest_no, category')
      .eq('team', team)
      .order('name');

    if (studentError || !students) {
      return NextResponse.json({ error: "Students not found" }, { status: 404 });
    }

    // 2. Fetch all registrations for these students
    const studentIds = students.map((s: any) => s.id);
    let registrations: any[] = [];
    
    if (studentIds.length > 0) {
      const { data: regData, error: regError } = await supabaseAdmin
        .from('registrations')
        .select('student_id, event_id, is_star, group_no')
        .in('student_id', studentIds);
        
      if (!regError) {
        registrations = regData;
      }
    }

    // 3. Fetch all event details
    const eventIds = [...new Set(registrations.map((r: any) => r.event_id))];
    let events: any[] = [];
    
    if (eventIds.length > 0) {
      const { data: eventData, error: eventFetchError } = await supabaseAdmin
        .from('events')
        .select('id, name, is_group_event')
        .in('id', eventIds);
        
      if (!eventFetchError) {
        events = eventData;
      } else {
        console.error("Error fetching events:", eventFetchError);
      }
    }

    // Assemble Data
    const fullStudents = students.map((s: any) => {
      const studentRegs = registrations.filter(r => r.student_id === s.id);
      const programs = studentRegs.map(reg => {
        const eventDetails = events.find(e => e.id === reg.event_id);
        return {
          eventName: eventDetails?.name || "Unknown Event",
          isGroupEvent: eventDetails?.is_group_event || false,
          isStar: reg.is_star,
          groupNo: reg.group_no
        };
      });

      return {
        id: s.id,
        name: s.name,
        chestNo: s.chest_no,
        category: s.category,
        programs
      };
    });

    return NextResponse.json({
      team,
      students: fullStudents
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

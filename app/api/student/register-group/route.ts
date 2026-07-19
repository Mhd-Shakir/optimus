import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { eventId, studentIds, groupNo } = await req.json();
    const resolvedGroupNo = groupNo || 1;

    if (!eventId) return NextResponse.json({ error: "Event is required" }, { status: 400 });
    if (!studentIds || !studentIds.length) return NextResponse.json({ error: "Participants are required" }, { status: 400 });

    // Fetch the category from students table
    const { data: students } = await supabaseAdmin.from('students').select('category').in('id', studentIds).limit(1);
    const category = students?.[0]?.category;

    // Dynamic category-based auto close logic
    if (category) {
      const CATEGORY_IDS: Record<string, number> = {
        Cosmos: 2,
        Nexus: 3,
        Protons: 4,
        'General-A': 5,
        'General-B': 6
      };
      
      const catId = CATEGORY_IDS[category];
      if (catId) {
        const { data: catSettings } = await supabaseAdmin
          .from('settings')
          .select('registration_open')
          .eq('id', catId)
          .single();
          
        if (catSettings && catSettings.registration_open === false) {
          return NextResponse.json({ error: `Group Registration for ${category} is currently CLOSED.` }, { status: 403 });
        }
      }
    }

    // Insert new registrations for the group event
    const newRegistrations = studentIds.map((id: string) => ({
      student_id: id,
      event_id: eventId,
      is_star: false,
      status: 'registered',
      group_no: resolvedGroupNo
    }));

    const { error } = await supabaseAdmin.from('registrations').insert(newRegistrations);

    if (error) {
        if (error.code === '23505') {
            // Unique violation (meaning some student might already be registered for this event)
            return NextResponse.json({ error: "One or more students are already registered for this event." }, { status: 400 });
        }
        throw error;
    }

    return NextResponse.json({ message: "Group Registered Successfully" });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Registration Failed" }, { status: 500 });
  }
}

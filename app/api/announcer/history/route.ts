import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateGradeAndPoints } from "@/lib/points";

export const dynamic = "force-dynamic";

const normalizeString = (str: string) => {
    if (!str) return "";
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
};

export async function GET() {
    try {
        // Fetch all announced events, sorted by created_at
        const { data: events, error: eventsError } = await supabaseAdmin
            .from('events')
            .select('*')
            .eq('status', 'announced')
            .order('created_at', { ascending: true });

        if (eventsError) throw eventsError;

        // If no events, return empty milestones
        if (!events || events.length === 0) {
            return NextResponse.json({ milestones: [] });
        }

        // Fetch all students to map to teams
        const { data: students } = await supabaseAdmin.from('students').select('id, team');
        
        // Fetch all registrations for these events
        const eventIds = events.map(e => e.id);
        const { data: registrations } = await supabaseAdmin
            .from('registrations')
            .select('*')
            .in('event_id', eventIds)
            .not('mark', 'is', null);

        let aurisScore = 0;
        let librasScore = 0;
        const awardedGroupEventMarks = new Set<string>();

        const milestones = [];

        // Iterate through each event sequentially
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            
            // Get registrations for this specific event
            const eventRegs = registrations?.filter(r => r.event_id === event.id) || [];

            eventRegs.forEach(reg => {
                const student = students?.find(s => s.id === reg.student_id);
                if (!student) return;

                const eventName = normalizeString(event.name || "");
                const isGroupEvent = event.is_group_event === true || ["histoart", "dictionarymaking", "swarafdebate", "swarfdebate"].includes(eventName);
                const individualPointExceptions = ["speechtranslation", "dictionarymaking", "swarafdebate", "swarfdebate"];
                const useGroupScale = isGroupEvent && !individualPointExceptions.includes(eventName);

                const { points } = calculateGradeAndPoints(reg.mark, useGroupScale);

                // Add points
                if (isGroupEvent) {
                    const key = `${reg.event_id}-${student.team}-${reg.mark}`;
                    if (!awardedGroupEventMarks.has(key)) {
                        if (student.team === "Ignis") aurisScore += points;
                        if (student.team === "Ventus") librasScore += points;
                        awardedGroupEventMarks.add(key);
                    }
                } else {
                    if (student.team === "Ignis") aurisScore += points;
                    if (student.team === "Ventus") librasScore += points;
                }
            });

            const count = i + 1;
            // Record milestone every 5 events
            if (count % 5 === 0) {
                milestones.push({
                    count,
                    ventus: librasScore,
                    ignis: aurisScore
                });
            }
        }

        // Return the milestones
        return NextResponse.json({ milestones: milestones.reverse() }); // Reverse to show latest first

    } catch (error) {
        console.error("History API Error:", error);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const CATEGORY_IDS: Record<string, number> = {
  overall: 1,
  Cosmos: 2,
  Nexus: 3,
  Protons: 4,
  'General-A': 5,
  'General-B': 6
};

export async function GET() {
  const { data: settings, error } = await supabaseAdmin
    .from('settings')
    .select('*');

  if (error || !settings) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }

  // Map settings to categories
  const settingsMap: Record<string, boolean> = {};
  
  for (const [name, id] of Object.entries(CATEGORY_IDS)) {
    const row = settings.find(s => s.id === id);
    if (row) {
      settingsMap[name] = row.registration_open;
    } else {
      // Return default true for missing ones, no need to insert them dynamically unless they toggle
      settingsMap[name] = true;
    }
  }
  
  return NextResponse.json({ 
    registrationOpen: settingsMap.overall,
    categories: settingsMap
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  
  if (body.hasOwnProperty('registrationOpen')) {
    await supabaseAdmin.from('settings').upsert([{ id: 1, registration_open: body.registrationOpen }]);
  }
  
  if (body.hasOwnProperty('category') && body.hasOwnProperty('open')) {
    const id = CATEGORY_IDS[body.category];
    if (id) {
      await supabaseAdmin.from('settings').upsert([{ id, registration_open: body.open }]);
    }
  }

  return NextResponse.json({ success: true });
}
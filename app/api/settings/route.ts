import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  let { data: settings, error } = await supabaseAdmin
    .from('settings')
    .select('*')
    .limit(1)
    .single();

  if (error || !settings) {
    // If not found, create default
    const { data: newSettings } = await supabaseAdmin
      .from('settings')
      .insert([{ id: 1, registration_open: true }])
      .select()
      .single();
    settings = newSettings;
  }
  
  // Format for frontend
  return NextResponse.json({ registrationOpen: settings?.registration_open });
}

export async function POST(req: Request) {
  const { registrationOpen } = await req.json();
  
  const { data: settings, error } = await supabaseAdmin
    .from('settings')
    .upsert([{ id: 1, registration_open: registrationOpen }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
  
  return NextResponse.json({ registrationOpen: settings.registration_open });
}
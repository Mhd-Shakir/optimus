import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function DELETE() {
  try {
    // Delete all events. Supabase allows delete without eq if configured, 
    // but usually we need a condition like .neq('id', '00000000-0000-0000-0000-000000000000') 
    // or we can use a TRUNCATE if we had raw SQL.
    // Instead we can just match all by using 'neq' on something that always matches.
    const { error } = await supabaseAdmin.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (error) throw error;
    
    return NextResponse.json({ message: "All events deleted successfully" });
  } catch (error: any) {
    console.error("Delete All Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete events" }, { status: 500 });
  }
}
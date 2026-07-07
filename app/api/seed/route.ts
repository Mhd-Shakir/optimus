import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    // 1. Delete existing users (Clean Slate)
    await supabaseAdmin.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Deletes all

    // 2. Create passwords
    const adminPassword = await bcrypt.hash("123", 10);
    const aurisPassword = await bcrypt.hash("123", 10);
    const librasPassword = await bcrypt.hash("123", 10);

    // 3. Insert into Supabase
    const { error } = await supabaseAdmin.from('users').insert([
      { username: "admin", password: adminPassword, role: "super_admin", team: null },
      { username: "auris", password: aurisPassword, role: "auris_leader", team: "Team A" },
      { username: "libras", password: librasPassword, role: "libras_leader", team: "Team B" }
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to insert users", details: error }, { status: 500 });
    }

    return NextResponse.json({ message: "Users Reset Successfully in Supabase! Passwords are now '123'" });

  } catch (error) {
    return NextResponse.json({ error: "Seed Failed" }, { status: 500 });
  }
}
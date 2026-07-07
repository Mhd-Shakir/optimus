import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { team, newUsername, newPassword } = await req.json();

    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('team', team)
      .single();
    
    if (fetchError || !user) {
        return NextResponse.json({ error: "Team User not found." }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ username: newUsername, password: hashedPassword })
      .eq('id', user.id);
      
    if (updateError) throw updateError;

    return NextResponse.json({ message: "Team Credentials updated successfully!" });

  } catch (error: any) {
    console.error("Team Credential Update Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update credentials" }, { status: 500 });
  }
}
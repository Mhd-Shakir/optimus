import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { role, newUsername, newPassword } = await req.json();

    if (!role || !newUsername || !newPassword) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', role)
      .single();

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (existingUser) {
      // Update existing
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ username: newUsername, password: hashedPassword })
        .eq('id', existingUser.id);
        
      if (updateError) throw updateError;
    } else {
      // Create new
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert([{
          username: newUsername,
          password: hashedPassword,
          role: role,
          team: null
        }]);

      if (insertError) throw insertError;
    }

    return NextResponse.json({ message: `${role} Credentials updated successfully!` });

  } catch (error: any) {
    console.error("Staff Credential Update Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update credentials" }, { status: 500 });
  }
}

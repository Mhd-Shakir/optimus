import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { currentUsername, oldPassword, newUsername, newPassword } = await req.json();

    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', currentUsername)
      .single();
    
    if (fetchError || !user) {
        return NextResponse.json({ error: "User not found. Check username." }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
        return NextResponse.json({ error: "Incorrect old password!" }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ username: newUsername, password: hashedPassword })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ message: "Credentials updated successfully!" });

  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update credentials" }, { status: 500 });
  }
}
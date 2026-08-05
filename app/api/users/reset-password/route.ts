import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, newPassword } = body;

    if (!id || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const { error } = await supabaseAdmin
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}

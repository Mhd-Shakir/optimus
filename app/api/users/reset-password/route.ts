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

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "User not found or ID mismatched" }, { status: 404 });
    }

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error: any) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}

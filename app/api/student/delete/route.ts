import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Student ID missing" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('students').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: "Student Deleted Successfully" });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Delete Failed" }, { status: 500 });
  }
}
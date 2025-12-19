import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import Student from "@/lib/models/student";

export async function POST(request: Request) {
  try {
    await connectToDb();
    const { id } = await request.json();

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await Student.findByIdAndDelete(id);

    return NextResponse.json({ message: "Student deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
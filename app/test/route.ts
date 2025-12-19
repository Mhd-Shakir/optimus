import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import Student from "@/lib/models/student";

export async function GET() {
  try {
    await connectToDb();
    const students = await Student.find().sort({ chestNo: 1 });
    return NextResponse.json(students);
  } catch (error) {
    return NextResponse.json([], { status: 200 }); // Error വന്നാലും Empty Array കൊടുക്കും (Crash ഒഴിവാക്കാൻ)
  }
}
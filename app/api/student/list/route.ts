import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import Student from "@/lib/models/student";

// 👇 ഈ വരി നിർബന്ധമായും ചേർക്കുക (Cache ഒഴിവാക്കാൻ)
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDb();
    // Chest No ക്രമത്തിൽ ലിസ്റ്റ് എടുക്കുന്നു
    const students = await Student.find().sort({ chestNo: 1 });
    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}
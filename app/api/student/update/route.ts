import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import Student from "@/lib/models/student";

export async function POST(req: Request) {
  try {
    await connectToDb();
    const { id, name, category, selectedEvents } = await req.json();

    if (!id) return NextResponse.json({ error: "Student ID missing" }, { status: 400 });

    // Find and Update Student
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      {
        name,
        category,
        registeredEvents: selectedEvents || []
      },
      { new: true } // Return updated document
    );

    if (!updatedStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Student Updated Successfully", student: updatedStudent });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Update Failed" }, { status: 500 });
  }
}
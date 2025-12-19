import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import Student from "@/lib/models/student";

export async function POST(req: Request) {
  try {
    console.log("Connecting to DB...");
    await connectToDb();
    
    const body = await req.json();
    console.log("Received Data:", body); // ടെർമിനലിൽ ഡാറ്റ വരുന്നുണ്ടോ എന്ന് നോക്കാം

    const { name, chestNo, team, category, admissionNo, selectedEvents } = body;

    // Validation
    if (!name || !chestNo || !team || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check Duplicate
    const existingStudent = await Student.findOne({ chestNo });
    if (existingStudent) {
      return NextResponse.json({ error: "Chest Number already exists!" }, { status: 400 });
    }

    // Create Student
    const newStudent = await Student.create({
      name,
      chestNo,
      team,
      category,
      admissionNo: admissionNo || "", // admissionNo ഇല്ലെങ്കിൽ empty string കൊടുക്കും
      registeredEvents: selectedEvents || []
    });

    console.log("Student Created:", newStudent);
    return NextResponse.json({ message: "Student Registered", student: newStudent }, { status: 201 });

  } catch (error: any) {
    console.error("Registration CRASH:", error); // എറർ വന്നാൽ ഇവിടെ കാണാം
    return NextResponse.json({ error: error.message || "Registration Failed" }, { status: 500 });
  }
}
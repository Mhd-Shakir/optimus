import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import Student from "@/lib/models/student";
import Settings from "@/lib/models/settings"; // Import Settings Model

export async function POST(req: Request) {
  try {
    console.log("Connecting to DB...");
    await connectToDb();
    
    // --- NEW: CHECK IF REGISTRATION IS OPEN ---
    const settings = await Settings.findOne();
    if (settings && settings.registrationOpen === false) {
      return NextResponse.json(
        { error: "Registration is currently CLOSED by Admin." }, 
        { status: 403 }
      );
    }
    // ------------------------------------------

    const body = await req.json();
    console.log("Received Data:", body); 

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
      admissionNo: admissionNo || "", 
      registeredEvents: selectedEvents || []
    });

    console.log("Student Created:", newStudent);
    return NextResponse.json({ message: "Student Registered", student: newStudent }, { status: 201 });

  } catch (error: any) {
    console.error("Registration CRASH:", error); 
    return NextResponse.json({ error: error.message || "Registration Failed" }, { status: 500 });
  }
}
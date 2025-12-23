import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoose"; 
import Student from "@/lib/models/student"; 

export async function POST(req: Request) {
  try {
    await connectToDB();
    const { studentId, eventId, status } = await req.json();

    if (!studentId || !eventId || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Find student and update the specific event's status
    const student = await Student.findOneAndUpdate(
      { _id: studentId, "registeredEvents.eventId": eventId },
      { 
        $set: { "registeredEvents.$.status": status } 
      },
      { new: true }
    );

    if (!student) {
      return NextResponse.json({ error: "Student or Event not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Status updated", student }, { status: 200 });

  } catch (error) {
    console.error("Stage Update Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
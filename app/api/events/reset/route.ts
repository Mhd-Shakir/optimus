import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import Event from "@/lib/models/event";

export async function DELETE() {
  try {
    await connectToDb();
    
    // Delete all documents in the Event collection
    await Event.deleteMany({});
    
    return NextResponse.json({ message: "All events deleted successfully" });
  } catch (error) {
    console.error("Delete All Error:", error);
    return NextResponse.json({ error: "Failed to delete events" }, { status: 500 });
  }
}
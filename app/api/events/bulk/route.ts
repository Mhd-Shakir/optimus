import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import Event from "@/lib/models/event";

export async function POST(request: Request) {
  try {
    await connectToDb();
    const body = await request.json();

    // Check if body is array (Bulk) or object (Single)
    const eventsData = Array.isArray(body) ? body : [body];

    if (eventsData.length === 0) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    // Insert All Events
    const createdEvents = await Event.insertMany(eventsData);

    return NextResponse.json({ 
      message: "Events created successfully", 
      count: createdEvents.length, 
      events: createdEvents 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Bulk Create Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create events" }, { status: 500 });
  }
}
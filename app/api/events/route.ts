import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import Event from "@/lib/models/event";

// ✅ Important: This ensures the API is not cached statically
export const dynamic = "force-dynamic";

// ✅ GET: List all events
export async function GET() {
  try {
    await connectToDb();
    // Fetch all events sorted by newest first
    const events = await Event.find().sort({ createdAt: -1 });
    return NextResponse.json(events);
  } catch (error) {
    console.error("Fetch Events Error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// ✅ POST: Create a new event (Optional - Keep this if you use it for creating events)
export async function POST(req: Request) {
  try {
    await connectToDb();
    const body = await req.json();

    if (!body.name || !body.category || !body.type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newEvent = await Event.create(body);
    return NextResponse.json({ message: "Event Created", event: newEvent }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create event" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    await Event.findByIdAndDelete(id);
    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
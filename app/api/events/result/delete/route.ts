import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import Event from "@/lib/models/event";

export async function POST(req: Request) {
  try {
    await connectToDb();
    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    // Reset the event results
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        status: "upcoming", // Set back to upcoming
        results: {
            first: null,
            firstMark: "0",
            second: null,
            secondMark: "0",
            third: null,
            thirdMark: "0"
        }
      },
      { new: true }
    );

    if (!updatedEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Result Deleted Successfully", event: updatedEvent }, { status: 200 });

  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Failed to delete result" }, { status: 500 });
  }
}
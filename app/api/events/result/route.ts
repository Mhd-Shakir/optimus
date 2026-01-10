import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import Event from "@/lib/models/event";

export async function POST(req: Request) {
  try {
    await connectToDb();
    
    const body = await req.json();
    const { eventId, results } = body;

    if (!eventId) return NextResponse.json({ error: "Event ID is missing" }, { status: 400 });
    
    if (!results || !results.first) {
        return NextResponse.json({ error: "First Place Winner is required" }, { status: 400 });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        status: "completed",
        results: {
            first: results.first,
            firstGrade: results.firstGrade || "", 
            second: results.second || null,
            secondGrade: results.secondGrade || "",
            third: results.third || null,
            thirdGrade: results.thirdGrade || "",
            // ✅ FIX: Save the "others" array to the database
            others: results.others || [] 
        }
      },
      { new: true }
    );

    if (!updatedEvent) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    return NextResponse.json({ message: "Result Updated", event: updatedEvent });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDb();
    const { eventId } = await req.json();

    if (!eventId) return NextResponse.json({ error: "Event ID is missing" }, { status: 400 });

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        status: "upcoming", 
        results: {
            first: null, firstGrade: "",
            second: null, secondGrade: "",
            third: null, thirdGrade: "",
            // ✅ FIX: Reset the "others" array when deleting
            others: [] 
        }
      },
      { new: true }
    );

    if (!updatedEvent) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    return NextResponse.json({ message: "Result Deleted", event: updatedEvent });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
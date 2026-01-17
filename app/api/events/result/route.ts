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

    // ✅ UPDATED: Saving Code Letters
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        status: "completed",
        results: {
            first: results.first,
            firstGrade: results.firstGrade || "",
            firstMark: results.firstMark || "",
            firstCodeLetter: results.firstCodeLetter || "", // <--- Added
            
            second: results.second || null,
            secondGrade: results.secondGrade || "",
            secondMark: results.secondMark || "",
            secondCodeLetter: results.secondCodeLetter || "", // <--- Added
            
            third: results.third || null,
            thirdGrade: results.thirdGrade || "",
            thirdMark: results.thirdMark || "",
            thirdCodeLetter: results.thirdCodeLetter || "", // <--- Added
            
            // ✅ Save the "others" array (Schema now handles codeLetter inside this)
            others: results.others || [] 
        }
      },
      { new: true }
    );

    if (!updatedEvent) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    return NextResponse.json({ message: "Result Updated", event: updatedEvent });

  } catch (error: any) {
    console.error("Error updating result:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDb();
    const { eventId } = await req.json();

    if (!eventId) return NextResponse.json({ error: "Event ID is missing" }, { status: 400 });

    // ✅ UPDATED: Resetting Code Letters on delete
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        status: "upcoming", 
        results: {
            first: null, 
            firstGrade: "",
            firstMark: "",
            firstCodeLetter: "", // <--- Reset

            second: null, 
            secondGrade: "",
            secondMark: "",
            secondCodeLetter: "", // <--- Reset
            
            third: null, 
            thirdGrade: "",
            thirdMark: "",
            thirdCodeLetter: "", // <--- Reset
            
            others: [] 
        }
      },
      { new: true }
    );

    if (!updatedEvent) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    return NextResponse.json({ message: "Result Deleted", event: updatedEvent });

  } catch (error: any) {
    console.error("Error deleting result:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
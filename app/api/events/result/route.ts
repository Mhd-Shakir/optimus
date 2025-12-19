import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import Event from "@/lib/models/event";

export async function POST(req: Request) {
  try {
    await connectToDb();
    
    // പുതിയ ഫോർമാറ്റിലുള്ള ഡാറ്റ സ്വീകരിക്കുന്നു
    const body = await req.json();
    console.log("Received Result Data:", body); // ടെർമിനലിൽ ലോഗ് ചെയ്തു നോക്കാം

    // Destructure using the NEW structure (inside 'results' object)
    const { eventId, results } = body;

    // Validation Check
    if (!eventId) {
        return NextResponse.json({ error: "Event ID is missing" }, { status: 400 });
    }
    
    // Check if 'results' object exists and has 'first' winner
    if (!results || !results.first) {
        return NextResponse.json({ error: "First Place Winner is required" }, { status: 400 });
    }

    // Update Event in Database
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        status: "completed",
        results: {
            first: results.first,
            firstMark: results.firstMark || "0", // Mark കൂടി സേവ് ചെയ്യുന്നു
            second: results.second || null,
            secondMark: results.secondMark || "0",
            third: results.third || null,
            thirdMark: results.thirdMark || "0"
        }
      },
      { new: true }
    );

    if (!updatedEvent) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Result & Marks Updated", event: updatedEvent }, { status: 200 });

  } catch (error: any) {
    console.error("Save Error:", error);
    return NextResponse.json({ error: error.message || "Failed to save result" }, { status: 500 });
  }
}
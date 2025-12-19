import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import Event from "@/lib/models/event";

// 👇 ഈ വരിയാണ് പ്രധാനം! ഇത് പഴയ കാഷെ ഒഴിവാക്കി പുതിയ ഡാറ്റ കൊണ്ടുവരും
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDb();
    
    // എല്ലാ ഇവന്റുകളും പേര് അനുസരിച്ച് സോർട്ട് ചെയ്ത് എടുക്കുന്നു
    const events = await Event.find().sort({ name: 1 });
    
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
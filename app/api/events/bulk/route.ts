import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import Event from "@/lib/models/event";

export async function POST(req: Request) {
  try {
    await connectToDb();
    const body = await req.json();

    // Check if body is an array (JSON List)
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid format: Expected an array of events" }, { status: 400 });
    }

    // Insert all events at once
    await Event.insertMany(body);

    return NextResponse.json({ message: "Events added successfully", count: body.length });
  } catch (error) {
    console.error("Bulk Upload Error:", error);
    return NextResponse.json({ error: "Failed to upload events" }, { status: 500 });
  }
}
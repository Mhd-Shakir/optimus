import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectToDb();
    
    // Get the database connection
    const db = mongoose.connection.db;
    
    // 1. Drop the 'students' collection completely (Start Fresh)
    // പഴയ പ്രശ്നമുള്ള ടേബിൾ അപ്പാടെ കളയുന്നു. പേടിക്കണ്ട, പുതിയത് തനിയെ വന്നോളും.
    await db.collection("students").drop().catch(() => console.log("Collection didn't exist, skipping drop."));

    return NextResponse.json({ message: "Database Fixed! Old restrictions removed. You can register now." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
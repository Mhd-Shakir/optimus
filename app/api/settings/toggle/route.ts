import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import Settings from "@/lib/models/Settings";

export async function POST(request: Request) {
    await connectToDb();
    const { isOpen } = await request.json();
    
    await Settings.findOneAndUpdate(
        { key: "registration_status" },
        { isOpen },
        { upsert: true }
    );
    return NextResponse.json({ message: "Status updated" });
}

export async function GET() {
    await connectToDb();
    const settings = await Settings.findOne({ key: "registration_status" });
    return NextResponse.json({ isOpen: settings ? settings.isOpen : true });
}
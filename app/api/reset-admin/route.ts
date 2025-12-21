import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import User from "@/lib/models/user";

export async function GET() {
  try {
    await connectToDb();

    // 1. പഴയ 'admin' എന്ന പേരുള്ള എല്ലാ യൂസർമാരെയും നീക്കം ചെയ്യുന്നു
    await User.deleteMany({ username: "admin" });

    // 2. പുതിയ അഡ്മിനെ കൃത്യമായി ഉണ്ടാക്കുന്നു
    const newAdmin = await User.create({
      username: "admin",      // 👈 ഇത് വിട്ടുപോകരുത്
      password: "admin123",   // 👈 ഇത് വിട്ടുപോകരുത്
      role: "admin",
      team: "Admin"
    });

    return NextResponse.json({ 
      message: "Success! Admin reset done.", 
      credentials: { username: "admin", password: "admin123" } 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
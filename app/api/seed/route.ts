import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import User from "@/lib/models/user";

export async function GET() {
  try {
    await connectToDb();

    // 1. പഴയ യൂസർമാരെ എല്ലാവരെയും ഡിലീറ്റ് ചെയ്യുന്നു (Clean Slate)
    await User.deleteMany({}); 

    // 2. പുതിയ പാസ്‌വേഡിൽ വീണ്ടും ഉണ്ടാക്കുന്നു
    await User.insertMany([
      { username: "admin", password: "123", role: "admin", team: null },
      { username: "auris", password: "123", role: "auris_leader", team: "Auris" },
      { username: "libras", password: "123", role: "libras_leader", team: "Libras" }
    ]);

    return NextResponse.json({ message: "Users Reset Successfully! Passwords are now '123'" });

  } catch (error) {
    return NextResponse.json({ error: "Seed Failed" }, { status: 500 });
  }
}
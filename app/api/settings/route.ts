import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import Settings from "@/lib/models/Settings";

export async function GET() {
  await connectToDb();
  // ഉള്ള സെറ്റിംഗ്സ് എടുക്കുന്നു, ഇല്ലെങ്കിൽ പുതിയത് ഉണ്ടാക്കുന്നു
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({ registrationOpen: true });
  }
  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  await connectToDb();
  const { registrationOpen } = await req.json();
  
  // സെറ്റിംഗ്സ് അപ്ഡേറ്റ് ചെയ്യുന്നു
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({ registrationOpen });
  } else {
    settings.registrationOpen = registrationOpen;
    await settings.save();
  }
  
  return NextResponse.json(settings);
}
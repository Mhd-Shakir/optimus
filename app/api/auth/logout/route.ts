import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  // Destroy the role cookie
  cookies().delete("optimus_role");
  
  // Destroy the team cookie (if you set it)
  cookies().delete("optimus_team");

  return NextResponse.json({ message: "Logged out successfully" });
}
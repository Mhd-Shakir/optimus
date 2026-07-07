import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    console.log("Login Attempt for:", username); // Debugging Log

    // 1. Check if User exists in Supabase (case-insensitive by lowercasing)
    const normalizedUsername = username.toLowerCase().trim();
    
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('username', normalizedUsername)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Check Password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // 3. Generate Token
    const secret = process.env.JWT_SECRET || "optimus_secret_key_2025";
    const token = jwt.sign(
      { id: user.id, role: user.role, team: user.team },
      secret,
      { expiresIn: "1d" }
    );

    // 4. Return Response
    const response = NextResponse.json({
      message: "Login Successful",
      user: {
        username: user.username,
        role: user.role,
        team: user.team
      }
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
    });

    return response;

  } catch (error: any) {
    console.error("Login Error:", error); 
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
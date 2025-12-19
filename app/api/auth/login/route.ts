import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import User from "@/lib/models/user";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    await connectToDb();
    const { username, password } = await req.json();

    console.log("Login Attempt for:", username); // Debugging Log

    // 1. Check if User exists
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Check Password (Direct String Compare)
    if (user.password !== password) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // 3. Generate Token
    const secret = process.env.JWT_SECRET || "optimus_secret_key_2025";
    const token = jwt.sign(
      { id: user._id, role: user.role, team: user.team },
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
    console.error("Login Error:", error); // VS Code ടെർമിനലിൽ എറർ കാണിക്കും
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
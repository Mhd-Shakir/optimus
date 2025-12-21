import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import User from "@/lib/models/user";

export async function POST(req: Request) {
  try {
    await connectToDb();
    const { currentUsername, oldPassword, newUsername, newPassword } = await req.json();

    // 1. അഡ്മിനെ കണ്ടുപിടിക്കുന്നു
    const user = await User.findOne({ username: currentUsername });
    
    if (!user) {
        return NextResponse.json({ error: "User not found. Check username." }, { status: 404 });
    }

    // 2. പഴയ പാസ്‌വേഡ് ചെക്ക് ചെയ്യുന്നു
    if (user.password !== oldPassword) {
        return NextResponse.json({ error: "Incorrect old password!" }, { status: 401 });
    }

    // 3. പുതിയത് അപ്‌ഡേറ്റ് ചെയ്യുന്നു
    user.username = newUsername;
    user.password = newPassword;
    await user.save();

    return NextResponse.json({ message: "Credentials updated successfully!" });

  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Failed to update credentials" }, { status: 500 });
  }
}
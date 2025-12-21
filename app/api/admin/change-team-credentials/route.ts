import { NextResponse } from "next/server";
import connectToDb from "@/lib/db";
import User from "@/lib/models/user";

export async function POST(req: Request) {
  try {
    await connectToDb();
    const { team, newUsername, newPassword } = await req.json();

    // 1. ആ ടീമിന്റെ യൂസറിനെ കണ്ടുപിടിക്കുന്നു
    // (role: "user" എന്ന് കൊടുക്കുന്നത് അഡ്മിനെ മാറ്റാതിരിക്കാനാണ്)
    let user = await User.findOne({ team: team, role: { $ne: "admin" } });

    if (!user) {
        // ടീം യൂസർ ഇല്ലെങ്കിൽ പുതിയതിനെ ഉണ്ടാക്കുന്നു (Safety fallback)
        user = new User({
            username: newUsername,
            password: newPassword,
            team: team,
            role: "user" // Or whatever role you use for teams
        });
    } else {
        // ഉണ്ടെങ്കിൽ അപ്‌ഡേറ്റ് ചെയ്യുന്നു
        user.username = newUsername;
        user.password = newPassword;
    }

    await user.save();

    return NextResponse.json({ message: `Successfully updated credentials for Team ${team}!` });

  } catch (error: any) {
    console.error("Team Update Error:", error);
    return NextResponse.json({ error: "Failed to update team credentials" }, { status: 500 });
  }
}
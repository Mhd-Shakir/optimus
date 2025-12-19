import User from "@/lib/models/user";
import connectToDb from "@/lib/db";
import bcrypt from "bcryptjs";

export const seedDefaultUsers = async () => {
  try {
    await connectToDb();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: "admin" });
    if (existingAdmin) {
      console.log("⚠️ Admin already exists.");
    } else {
      // Create Admin
      const adminPassword = await bcrypt.hash("admin123", 10);
      
      await User.create({
        username: "admin",
        password: adminPassword,
        role: "admin",
        team: null,
      });
      console.log("✅ Admin user created!");
    }

    // Check if Auris/Libras exist (just in case)
    const existingUser = await User.findOne({ username: "auris" });
    if (!existingUser) {
        const aurisPassword = await bcrypt.hash("auris123", 10);
        const librasPassword = await bcrypt.hash("libras123", 10);

        await User.create([
            { username: "auris", password: aurisPassword, role: "auris_leader", team: "Auris" },
            { username: "libras", password: librasPassword, role: "libras_leader", team: "Libras" }
        ]);
        console.log("✅ Team leaders created!");
    }

    console.log("🌱 Seeding check complete.");
    
  } catch (error) {
    console.error("❌ Seeding Error:", error);
  }
};
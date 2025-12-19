import mongoose, { Schema, models } from "mongoose";

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true }, // 'admin', 'auris_leader', 'libras_leader'
    team: { type: String, default: null },   // 'Auris', 'Libras', or null
  },
  { timestamps: true }
);

const User = models.User || mongoose.model("User", userSchema);

export default User;
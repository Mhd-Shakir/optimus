import mongoose, { Schema, models } from "mongoose";

const settingsSchema = new Schema({
  key: { type: String, required: true, unique: true }, // e.g., "registration_status"
  isOpen: { type: Boolean, default: true },
});

const Settings = models.Settings || mongoose.model("Settings", settingsSchema);

export default Settings;
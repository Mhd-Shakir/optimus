import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema({
  registrationOpen: {
    type: Boolean,
    default: true,
  },
});

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
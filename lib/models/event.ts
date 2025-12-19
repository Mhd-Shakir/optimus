import mongoose, { Schema, models } from "mongoose";

const eventSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    type: { type: String, required: true }, // Stage / Non-Stage
    status: { type: String, default: "upcoming" },
    
    // 👇 റിസൾട്ടും മാർക്കും സേവ് ചെയ്യാനുള്ള സ്ഥലം
    results: {
      first: { type: String, default: null },
      firstMark: { type: String, default: "0" }, // New Field for Mark
      
      second: { type: String, default: null },
      secondMark: { type: String, default: "0" }, // New Field for Mark
      
      third: { type: String, default: null },
      thirdMark: { type: String, default: "0" } // New Field for Mark
    }
  },
  { timestamps: true }
);

const Event = models.Event || mongoose.model("Event", eventSchema);

export default Event;
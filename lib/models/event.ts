import mongoose, { Schema, models } from "mongoose";

const eventSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    type: { type: String, required: true }, // Stage / Non-Stage
    status: { type: String, default: "upcoming" },
    
    // 👇 Individual or Group Event distinction
    // (Default is Individual. For Group events, this should be true)
    groupEvent: { type: Boolean, default: false },

    // 👇 Results now store Grades (A+, A, B, C)
    results: {
      first: { type: String, default: null },
      firstGrade: { type: String, default: "" }, 
      
      second: { type: String, default: null },
      secondGrade: { type: String, default: "" }, 
      
      third: { type: String, default: null },
      thirdGrade: { type: String, default: "" } 
    }
  },
  { timestamps: true }
);

const Event = models.Event || mongoose.model("Event", eventSchema);

export default Event;
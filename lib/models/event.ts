import mongoose, { Schema, models } from "mongoose";

const eventSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    type: { type: String, required: true }, // Stage / Non-Stage
    status: { type: String, default: "upcoming" },
    
    // 👇 Individual or Group Event distinction
    groupEvent: { type: Boolean, default: false },

    // ✅ UPDATED: Added Code Letters to Schema
    results: {
      first: { type: String, default: null },
      firstGrade: { type: String, default: "" },
      firstMark: { type: String, default: "" },
      firstCodeLetter: { type: String, default: "" }, // <--- Added
      
      second: { type: String, default: null },
      secondGrade: { type: String, default: "" },
      secondMark: { type: String, default: "" },
      secondCodeLetter: { type: String, default: "" }, // <--- Added
      
      third: { type: String, default: null },
      thirdGrade: { type: String, default: "" },
      thirdMark: { type: String, default: "" },
      thirdCodeLetter: { type: String, default: "" }, // <--- Added
      
      // ✅ Added: Other positions (4th+)
      others: [{
        studentId: { type: String },
        grade: { type: String, default: "" },
        mark: { type: String, default: "" },
        codeLetter: { type: String, default: "" } // <--- Added
      }]
    }
  },
  { timestamps: true }
);

const Event = models.Event || mongoose.model("Event", eventSchema);

export default Event;
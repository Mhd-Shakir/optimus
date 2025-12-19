import mongoose, { Schema, models } from "mongoose";

const studentSchema = new Schema(
  {
    name: { type: String, required: true },
    chestNo: { type: String, required: true, unique: true },
    team: { type: String, required: true },
    category: { type: String, required: true },
    // admissionNo ഇവിടെ ഒഴിവാക്കി (Unique Error വരാതിരിക്കാൻ)
    admissionNo: { type: String, default: "" }, 
    registeredEvents: [
      {
        eventId: { type: String },
        name: { type: String },
        isStar: { type: Boolean, default: false }, // Note: Boolean (capital B)
        type: { type: String }
      }
    ]
  },
  { timestamps: true }
);

const Student = models.Student || mongoose.model("Student", studentSchema);

export default Student;
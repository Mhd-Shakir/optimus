import mongoose, { Schema, models } from "mongoose";

const studentSchema = new Schema(
  {
    name: { type: String, required: true },
    chestNo: { type: String, required: true, unique: true },
    team: { type: String, required: true }, // Auris / Libras
    category: { type: String, required: true }, // Alpha / Beta / Omega
    // admissionNo is optional/removed as per your previous code
    admissionNo: { type: String, default: "" }, 
    registeredEvents: [
      {
        eventId: { type: String, required: true },
        name: { type: String },
        type: { type: String }, // Stage / Non-Stage
        isStar: { type: Boolean, default: false },
        
        // ✅ CRITICAL UPDATE: ഈ 'status' ഫീൽഡ് നിർബന്ധമായും ഉണ്ടായിരിക്കണം
        status: { 
            type: String, 
            default: "registered",
            enum: ["registered", "sent", "reported", "completed"] 
        }, 
      },
    ],
  },
  { timestamps: true }
);

const Student = models.Student || mongoose.model("Student", studentSchema);

export default Student;
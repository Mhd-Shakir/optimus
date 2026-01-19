import mongoose, { Schema, models } from "mongoose";

const eventSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    type: { type: String, required: true }, // Stage / Non-Stage
    status: { type: String, default: "upcoming" },

    // 👇 Individual or Group Event distinction
    groupEvent: { type: Boolean, default: false },

    // Updated to support multiple winners per position
    results: {
      // Arrays to support multiple winners (e.g., 2 first places, 3 second places)
      first: {
        type: Schema.Types.Mixed,
        default: []
      },

      second: {
        type: Schema.Types.Mixed,
        default: []
      },

      third: {
        type: Schema.Types.Mixed,
        default: []
      },

      // Other positions (4th+)
      others: {
        type: Schema.Types.Mixed,
        default: []
      }
    },

    // Team points calculated from results
    teamPoints: {
      Auris: { type: Number, default: 0 },
      Libras: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

const Event = models.Event || mongoose.model("Event", eventSchema);

export default Event;
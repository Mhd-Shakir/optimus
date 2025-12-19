import mongoose, { Schema, model, models } from 'mongoose';

const ResultSchema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  type: { type: String, enum: ['Stage', 'Non-Stage'], required: true },
  mode: { type: String, enum: ['Individual', 'Group'], required: true },
  
  // Who won?
  winners: [{
    position: { type: String, enum: ['First', 'Second', 'Third'] },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student' }, // Null if group event
    team: { type: String, enum: ['Auris', 'Libras'], required: true },
    points: { type: Number, required: true }
  }]
}, { timestamps: true });

const Result = models.Result || model('Result', ResultSchema);
export default Result;
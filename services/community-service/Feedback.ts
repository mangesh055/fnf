import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  id: string;
  user_id: string;
  rating: number;
  feedback_text: string;
  category: string;
  full_name?: string;
  created_at: Date;
}

const FeedbackSchema = new Schema<IFeedback>({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  feedback_text: { type: String, default: null },
  category: { type: String, required: true, default: 'general' },
  full_name: { type: String, default: 'Anonymous' },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IRoommate extends Document {
  id: string;
  student_id: string;
  full_name?: string;
  email?: string;
  budget_min: number;
  budget_max: number;
  city: string;
  college: string;
  branch: string;
  gender: string;
  food_preference: string;
  smoking: boolean;
  sleep_schedule: string;
  looking_for: string;
  description?: string;
  active: boolean;
  verified?: boolean;
  rejected?: boolean;
  created_at: Date;
  updated_at: Date;
}

const RoommateSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    student_id: { type: String, required: true },
    full_name: { type: String, default: '' },
    email: { type: String, default: '' },
    budget_min: { type: Number, default: 0 },
    budget_max: { type: Number, default: 0 },
    city: { type: String, required: true, lowercase: true, trim: true },
    college: { type: String, required: true },
    branch: { type: String, default: '' },
    gender: { type: String, required: true },
    food_preference: { type: String, default: 'both' },
    smoking: { type: Boolean, default: false },
    sleep_schedule: { type: String, default: 'flexible' },
    looking_for: { type: String, default: 'any' },
    description: { type: String, default: '' },
    active: { type: Boolean, default: true },
    verified: { type: Boolean, default: false },
    rejected: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

RoommateSchema.index({ city: 1, active: 1 });
RoommateSchema.index({ student_id: 1 });

export default mongoose.model<IRoommate>('Roommate', RoommateSchema);

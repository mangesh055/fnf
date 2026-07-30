import mongoose, { Schema, Document } from 'mongoose';

export interface IMess extends Document {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  address?: string;
  city: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  contact_phone?: string;
  contact_email?: string;
  monthly_charge?: number;
  per_meal_charge?: number;
  status: string;
  service_hours?: string;
  day_service_time?: string;
  evening_service_time?: string;
  verified: boolean;
  featured: boolean;
  rating: number;
  review_count: number;
  photos: string[];
  meal_types: string[];
  menu_card?: any[] | null;
  created_at: Date;
  updated_at: Date;
}

const MessSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    owner_id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, required: true, trim: true, lowercase: true },
    state: { type: String, default: '' },
    latitude: { type: Number },
    longitude: { type: Number },
    contact_phone: { type: String, default: '' },
    contact_email: { type: String, default: '' },
    monthly_charge: { type: Number, default: 0 },
    per_meal_charge: { type: Number, default: 0 },
    status: { type: String, default: 'open' },
    service_hours: { type: String, default: '' },
    day_service_time: { type: String, default: '11:30 AM - 03:00 PM' },
    evening_service_time: { type: String, default: '07:00 PM - 10:30 PM' },
    verified: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    rating: { type: Number, default: 5.0 },
    review_count: { type: Number, default: 0 },
    photos: { type: [String], default: [] },
    meal_types: { type: [String], default: [] },
    menu_card: { type: [Schema.Types.Mixed], default: [] },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Indexes
MessSchema.index({ city: 1, verified: 1 });
MessSchema.index({ owner_id: 1 });

export default mongoose.model<IMess>('Mess', MessSchema);

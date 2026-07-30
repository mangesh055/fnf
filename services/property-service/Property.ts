import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
  id: string; // Maintain custom id format if needed
  owner_id: string;
  owner_name?: string;
  title: string;
  description?: string;
  property_type?: string;
  rent?: number;
  deposit?: number;
  address?: string;
  city: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  contact_phone?: string;
  contact_email?: string;
  availability: boolean;
  gender_preference?: string;
  total_rooms?: number;
  available_rooms?: number;
  verified: boolean;
  featured: boolean;
  rating: number;
  review_count: number;
  images: string[];
  video_url?: string;
  google_maps_url?: string;
  amenities?: Record<string, any>;
  sharing_configs?: any[];
  flat_config?: Record<string, any>;
  hostel_config?: Record<string, any>;
  pg_config?: Record<string, any>;
  brokerage_applied?: boolean;
  brokerage_amount?: number;
  created_at: Date;
  updated_at: Date;
}

const PropertySchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    owner_id: { type: String, required: true },
    owner_name: { type: String, default: '' },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    property_type: { type: String, default: 'flat' },
    rent: { type: Number, default: 0 },
    deposit: { type: Number, default: 0 },
    address: { type: String, default: '' },
    city: { type: String, required: true, trim: true, lowercase: true },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    latitude: { type: Number },
    longitude: { type: Number },
    contact_phone: { type: String, default: '' },
    contact_email: { type: String, default: '' },
    availability: { type: Boolean, default: true },
    gender_preference: { type: String, default: 'any' },
    total_rooms: { type: Number, default: 1 },
    available_rooms: { type: Number, default: 1 },
    verified: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    rating: { type: Number, default: 5.0 },
    review_count: { type: Number, default: 0 },
    images: { type: [String], default: [] },
    video_url: { type: String, default: '' },
    google_maps_url: { type: String, default: '' },
    amenities: { type: Schema.Types.Mixed, default: {} },
    sharing_configs: { type: Schema.Types.Mixed, default: [] },
    flat_config: { type: Schema.Types.Mixed, default: {} },
    hostel_config: { type: Schema.Types.Mixed, default: {} },
    pg_config: { type: Schema.Types.Mixed, default: {} },
    brokerage_applied: { type: Boolean, default: false },
    brokerage_amount: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Compound index on city and verified for fast search filters
PropertySchema.index({ city: 1, verified: 1 });
PropertySchema.index({ owner_id: 1 });

export default mongoose.model<IProperty>('Property', PropertySchema);

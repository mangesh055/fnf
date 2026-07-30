import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  role: string;
  college?: string;
  branch?: string;
  gender?: string;
  bio?: string;
  address?: string;
  email_notifications?: boolean;
  push_notifications?: boolean;
  is_profile_completed?: boolean;
  status?: string;
  created_at: Date;
  updated_at: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String },
    full_name: { type: String, default: '' },
    avatar_url: { type: String, default: '' },
    phone: { type: String, default: '' },
    role: { type: String, enum: ['student', 'property_owner', 'mess_owner', 'admin'], default: 'student' },
    college: { type: String, default: '' },
    branch: { type: String, default: '' },
    gender: { type: String, default: '' },
    bio: { type: String, default: '' },
    address: { type: String, default: '' },
    email_notifications: { type: Boolean, default: true },
    push_notifications: { type: Boolean, default: false },
    is_profile_completed: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

export default mongoose.model<IUser>('User', UserSchema);

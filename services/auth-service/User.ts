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
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Optimize querying by email (unique index is created automatically, but explicitly defined here)
UserSchema.index({ email: 1 });

import { getDBConnection } from '../shared/db';

export const UserModel = getDBConnection('MONGODB_PROPERTY_URI').model<IUser>('User', UserSchema);
export default UserModel;

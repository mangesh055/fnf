import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  id: string;
  property_id?: string;
  mess_id?: string;
  reviewer_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: Date;
  updated_at: Date;
}

const ReviewSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    property_id: { type: String },
    mess_id: { type: String },
    reviewer_id: { type: String, required: true },
    reviewer_name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Indexes for high performance querying
ReviewSchema.index({ property_id: 1 });
ReviewSchema.index({ mess_id: 1 });

import { getDBConnection } from '../shared/db';
export const ReviewModel = getDBConnection('MONGODB_PROPERTY_URI').model<IReview>('Review', ReviewSchema);
export default ReviewModel;

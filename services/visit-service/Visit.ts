import mongoose, { Schema, Document } from 'mongoose';

export interface IVisit extends Document {
  id: string;
  property_id: string;
  property_title: string;
  property_image?: string;
  owner_id: string;
  student_id: string;
  student_name: string;
  student_phone: string;
  visit_date: string;
  day_label: string;
  time_slot: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  created_at: Date;
  updated_at: Date;
}

const VisitSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    property_id: { type: String, required: true },
    property_title: { type: String, required: true },
    property_image: { type: String, default: '' },
    owner_id: { type: String, required: true },
    student_id: { type: String, required: true },
    student_name: { type: String, required: true },
    student_phone: { type: String, default: '' },
    visit_date: { type: String, required: true },
    day_label: { type: String, default: '' },
    time_slot: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined', 'completed'], default: 'pending' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

// Indexes
VisitSchema.index({ owner_id: 1 });
VisitSchema.index({ student_id: 1 });

import { getDBConnection } from '../shared/db';

export const VisitModel = getDBConnection('MONGODB_PROPERTY_URI').model<IVisit>('Visit', VisitSchema);
export default VisitModel;

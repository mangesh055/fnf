import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category: string;
  images: string[];
  price?: number;
  likes: number;
  comment_count: number;
  verified?: boolean;
  rejected?: boolean;
  created_at: Date;
  updated_at: Date;
}

const PostSchema: Schema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    author_id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: { type: String, required: true },
    images: { type: [String], default: [] },
    price: { type: Number },
    likes: { type: Number, default: 0 },
    comment_count: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    rejected: { type: Boolean, default: false }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

PostSchema.index({ category: 1 });
PostSchema.index({ author_id: 1 });

export default mongoose.model<IPost>('Post', PostSchema);

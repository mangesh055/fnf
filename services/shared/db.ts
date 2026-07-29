import mongoose from 'mongoose';

export async function connectDB(uri?: string) {
  const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/campusnest';
  try {
    if (mongoose.connection.readyState >= 1) {
      return;
    }
    await mongoose.connect(mongoUri);
    console.log('[Database] Connected to MongoDB');
  } catch (error) {
    console.error('[Database] Connection failed:', error);
    process.exit(1);
  }
}

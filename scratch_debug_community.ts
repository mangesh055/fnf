import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campusnest';

async function run() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB:', uri);

    const db = mongoose.connection.db;
    if (!db) {
      console.error('No connection db');
      return;
    }

    const posts = await db.collection('posts').find().toArray();
    const users = await db.collection('users').find().toArray();

    console.log(`Found ${posts.length} posts and ${users.length} users.`);

    console.log('\n--- Users in MongoDB ---');
    users.forEach(u => {
      console.log(`User ID: ${u._id.toString()} | Name: ${u.full_name} | Email: ${u.email}`);
    });

    console.log('\n--- Posts in MongoDB ---');
    posts.forEach(p => {
      console.log(`Post ID: ${p.id || p._id.toString()} | Author ID: ${p.author_id} | Title: ${p.title}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();

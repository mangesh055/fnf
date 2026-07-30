import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../shared/db';
import Post from './Post';
import Roommate from './Roommate';
import User from '../auth-service/User';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.COMMUNITY_SERVICE_PORT || 5004;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/health', (req: Request, res: Response) => {
  res.json({ service: 'community-service', status: 'healthy', timestamp: new Date().toISOString() });
});

// Community / Marketplace Posts endpoints
app.get('/api/community/posts', async (req: Request, res: Response) => {
  try {
    const posts = await Post.find().sort({ created_at: -1 });
    const populated = await Promise.all(posts.map(async (p) => {
      const obj = p.toObject();
      if (!obj.full_name || obj.full_name === '') {
        const u = await User.findById(obj.author_id);
        if (u) {
          obj.full_name = u.full_name;
          obj.email = u.email;
          obj.phone = u.phone;
        }
      }
      return obj;
    }));
    res.json({ success: true, data: populated });
  } catch (error: any) {
    console.error('[Get Posts Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to retrieve posts' });
  }
});

app.get('/api/community/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const post = await Post.findOne({ id });
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    const obj = post.toObject();
    if (!obj.full_name || obj.full_name === '') {
      const u = await User.findById(obj.author_id);
      if (u) {
        obj.full_name = u.full_name;
        obj.email = u.email;
        obj.phone = u.phone;
      }
    }
    res.json({ success: true, data: obj });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to retrieve post' });
  }
});

app.post('/api/community/posts', async (req: Request, res: Response) => {
  try {
    const postData = {
      id: req.body.id || 'post_' + Date.now(),
      ...req.body
    };

    const newPost = new Post(postData);
    await newPost.save();

    res.status(201).json({ success: true, data: newPost });
  } catch (error: any) {
    console.error('[Create Post Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create post' });
  }
});

app.put('/api/community/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedPost = await Post.findOneAndUpdate(
      { id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    res.json({ success: true, data: updatedPost });
  } catch (error: any) {
    console.error('[Update Post Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update post' });
  }
});

app.delete('/api/community/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Post.findOneAndDelete({ id });

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error: any) {
    console.error('[Delete Post Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete post' });
  }
});

// Roommate Profiles endpoints
app.get('/api/community/roommates', async (req: Request, res: Response) => {
  try {
    const roommates = await Roommate.find().sort({ created_at: -1 });
    
    // Dynamically populate full_name, email, and phone from User collection if missing
    const populated = await Promise.all(roommates.map(async (r) => {
      const obj = r.toObject();
      if (!obj.full_name || obj.full_name === '') {
        const u = await User.findById(obj.student_id);
        if (u) {
          obj.full_name = u.full_name;
          obj.email = u.email;
          obj.phone = u.phone;
        }
      }
      return obj;
    }));

    res.json({ success: true, data: populated });
  } catch (error: any) {
    console.error('[Get Roommates Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to retrieve roommates' });
  }
});

app.get('/api/community/roommates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roommate = await Roommate.findOne({ id });
    if (!roommate) {
      return res.status(404).json({ success: false, error: 'Roommate profile not found' });
    }

    // Populate full_name, email, and phone from User collection if missing
    const obj = roommate.toObject();
    if (!obj.full_name || obj.full_name === '') {
      const u = await User.findById(obj.student_id);
      if (u) {
        obj.full_name = u.full_name;
        obj.email = u.email;
        obj.phone = u.phone;
      }
    }

    res.json({ success: true, data: obj });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to retrieve roommate profile' });
  }
});

app.post('/api/community/roommates', async (req: Request, res: Response) => {
  try {
    const roommateData = {
      id: req.body.id || 'roommate_' + Date.now(),
      ...req.body
    };

    const newRoommate = new Roommate(roommateData);
    await newRoommate.save();

    res.status(201).json({ success: true, data: newRoommate });
  } catch (error: any) {
    console.error('[Create Roommate Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create roommate profile' });
  }
});

app.put('/api/community/roommates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedRoommate = await Roommate.findOneAndUpdate(
      { id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedRoommate) {
      return res.status(404).json({ success: false, error: 'Roommate profile not found' });
    }

    res.json({ success: true, data: updatedRoommate });
  } catch (error: any) {
    console.error('[Update Roommate Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update roommate profile' });
  }
});

app.delete('/api/community/roommates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Roommate.findOneAndDelete({ id });

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Roommate profile not found' });
    }

    res.json({ success: true, message: 'Roommate profile deleted successfully' });
  } catch (error: any) {
    console.error('[Delete Roommate Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete roommate profile' });
  }
});

app.listen(PORT, () => {
  console.log(`[Community Service] Running on port ${PORT}`);
});

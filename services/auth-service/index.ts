import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { connectDB } from '../shared/db';
import User from './User';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'campusnest-microservices-secret-key-2026';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'dummy_client_id';

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ service: 'auth-service', status: 'healthy', timestamp: new Date().toISOString() });
});

// Google Authentication verification route
app.post('/api/auth/google', async (req: Request, res: Response) => {
  try {
    const { credential, role, flow } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, error: 'Credential token is required' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, error: 'Invalid Google token payload' });
    }

    const { email, name, picture } = payload;

    // Find or create user in MongoDB
    let user = await User.findOne({ email: email.trim().toLowerCase() });
    if (user && user.status === 'suspended') {
      return res.status(403).json({ success: false, error: 'Your account has been suspended by the administrator.' });
    }
    const isAdminEmail = email.trim().toLowerCase() === 'pujari.h.mangesh750@gmail.com';
    if (user) {
      if (isAdminEmail && (user.role !== 'admin' || !user.is_profile_completed)) {
        user.role = 'admin';
        user.is_profile_completed = true;
        await user.save();
      }
    }
    if (!user) {
      if (flow === 'signin') {
        return res.status(400).json({ success: false, error: 'Account does not exist. Please sign up.' });
      }

      user = new User({
        email: email.trim().toLowerCase(),
        full_name: name || 'Google User',
        avatar_url: picture || '',
        role: isAdminEmail ? 'admin' : (role || 'student'), // Initial role chosen by user
        phone: '',
        is_profile_completed: isAdminEmail ? true : false
      });
      await user.save();
    }

    // Generate custom JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        profile: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          role: user.role,
          phone: user.phone,
          gender: user.gender,
          is_profile_completed: user.is_profile_completed
        }
      }
    });
  } catch (error: any) {
    console.error('[Google Auth Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Google verification failed' });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, role, name, phone } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ success: false, error: 'Email, password, and role are required' });
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const isAdminEmail = email.trim().toLowerCase() === 'pujari.h.mangesh750@gmail.com';
    const newUser = new User({
      email,
      password: hashedPassword,
      role: isAdminEmail ? 'admin' : role,
      full_name: name || email.split('@')[0],
      phone: phone || '',
      is_profile_completed: isAdminEmail ? true : false
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userObj = newUser.toObject();
    delete userObj.password;

    // Map _id to id for consistency with the frontend expectations
    const responseUser = { ...userObj, id: newUser._id.toString() };

    return res.json({ success: true, data: { user: responseUser, token } });
  } catch (error: any) {
    console.error('[Auth Register Error]:', error);
    return res.status(500).json({ success: false, error: error.message || 'Registration failed' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Account does not exist. Please sign up.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, error: 'Your account has been suspended by the administrator.' });
    }

    if (user.email.trim().toLowerCase() === 'pujari.h.mangesh750@gmail.com' && (user.role !== 'admin' || !user.is_profile_completed)) {
      user.role = 'admin';
      user.is_profile_completed = true;
      await user.save();
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Incorrect password. Please try again.' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userObj = user.toObject();
    delete userObj.password;

    const responseUser = { ...userObj, id: user._id.toString() };

    return res.json({ success: true, data: { user: responseUser, token } });
  } catch (error: any) {
    console.error('[Auth Login Error]:', error);
    return res.status(500).json({ success: false, error: error.message || 'Login failed' });
  }
});

// Get count of students
app.get('/api/auth/users/count', async (req: Request, res: Response) => {
  try {
    const count = await User.countDocuments({ role: 'student' });
    res.json({ success: true, count });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to count users' });
  }
});

// Get total count of all users (students, owners, admins)
app.get('/api/auth/users/total', async (req: Request, res: Response) => {
  try {
    const count = await User.countDocuments({});
    res.json({ success: true, count });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to count all users' });
  }
});

// Get User Profile
app.get('/api/auth/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const userObj = user.toObject();
    delete userObj.password;

    const responseUser = { ...userObj, id: user._id.toString() };
    return res.json({ success: true, data: responseUser });
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
});

// Update User Profile
app.put('/api/auth/profile', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const updates = req.body;
    
    // Prevent updating protected fields like email or password directly here
    delete updates.email;
    delete updates.password;

    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userObj = updatedUser.toObject();
    delete userObj.password;
    const responseUser = { ...userObj, id: updatedUser._id.toString() };

    return res.json({ success: true, data: responseUser });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to update profile' });
  }
});

// Get all users (Admin only)
app.get('/api/auth/users', async (req: Request, res: Response) => {
  try {
    const users = await User.find().sort({ created_at: -1 });
    const mappedUsers = users.map(user => {
      const userObj = user.toObject();
      delete userObj.password;
      return { ...userObj, id: user._id.toString() };
    });
    res.json({ success: true, data: mappedUsers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch users' });
  }
});

// Suspend/Reactivate user (Admin action)
app.put('/api/auth/users/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const userObj = updatedUser.toObject();
    delete userObj.password;
    res.json({ success: true, data: { ...userObj, id: updatedUser._id.toString() } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to update status' });
  }
});

// Delete user (Admin action)
app.delete('/api/auth/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to delete user' });
  }
});

app.listen(PORT, () => {
  console.log(`[Auth Service] Running on port ${PORT}`);
});
// Force reload index.ts for Google Auth profile completion checks

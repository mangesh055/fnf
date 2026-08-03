import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../shared/db';
import Property from './Property';
import Mess from './Mess';
import Review from './Review';

dotenv.config();

// Connect to MongoDB
connectDB().then(async () => {
  try {
    const result = await Property.updateMany(
      { serial_no: { $exists: false } },
      { $set: { serial_no: 999999 } }
    );
    console.log(`[Database Migration]: Updated ${result.modifiedCount} properties with default serial_no.`);
  } catch (err) {
    console.error('[Database Migration Error]:', err);
  }
});

const app = express();
const PORT = process.env.PROPERTY_SERVICE_PORT || 5002;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/health', (req: Request, res: Response) => {
  res.json({ service: 'property-service', status: 'healthy', timestamp: new Date().toISOString() });
});

// Property endpoints
app.get('/api/properties', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const city = req.query.city ? (req.query.city as string).toLowerCase().trim() : undefined;
    const owner_id = req.query.owner_id as string;
    const compact = req.query.compact === 'true';

    const query: any = {};
    if (city) {
      query.city = city;
    }
    if (owner_id) {
      query.owner_id = owner_id;
    }

    const selectFields = compact 
      ? 'id owner_id owner_name title property_type rent deposit address city verified featured rating images availability'
      : '';

    const total = await Property.countDocuments(query);
    const properties = await Property.find(query)
      .select(selectFields)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ serial_no: 1, created_at: -1 });

    res.json({
      success: true,
      data: properties,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('[Get Properties Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to retrieve properties' });
  }
});

// Reviews endpoints (declared first to avoid conflict with /api/properties/:id route matcher)
// 1. Get Reviews
app.get('/api/properties/reviews', async (req: Request, res: Response) => {
  try {
    const { propertyId, messId } = req.query;
    const filter: any = {};
    if (propertyId) filter.property_id = propertyId;
    if (messId) filter.mess_id = messId;

    const reviews = await Review.find(filter).sort({ created_at: -1 });
    
    // Format to match frontend expectations (include reviewer profile)
    const formatted = reviews.map(r => {
      const obj = r.toObject();
      return {
        ...obj,
        profiles: {
          full_name: r.reviewer_name
        }
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('[Get Reviews Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch reviews' });
  }
});

// Helper to recalculate ratings for Property or Mess
async function updateAverageRating(propertyId?: string, messId?: string) {
  const filter: any = {};
  if (propertyId) filter.property_id = propertyId;
  if (messId) filter.mess_id = messId;

  const reviews = await Review.find(filter);
  const count = reviews.length;
  const avg = count > 0 
    ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / count).toFixed(1)) 
    : 5.0;

  if (propertyId) {
    await Property.findOneAndUpdate(
      { id: propertyId },
      { $set: { rating: avg, review_count: count } }
    );
  } else if (messId) {
    await Mess.findOneAndUpdate(
      { id: messId },
      { $set: { rating: avg, review_count: count } }
    );
  }
}

// 2. Add Review
app.post('/api/properties/reviews', async (req: Request, res: Response) => {
  try {
    const { id, property_id, mess_id, reviewer_id, reviewer_name, rating, comment } = req.body;
    
    if (!id || !reviewer_id || !reviewer_name || !rating || !comment) {
      return res.status(400).json({ success: false, error: 'Required fields are missing' });
    }

    const newReview = new Review({
      id,
      property_id,
      mess_id,
      reviewer_id,
      reviewer_name,
      rating,
      comment
    });

    await newReview.save();

    // Recalculate average rating in MongoDB
    await updateAverageRating(property_id, mess_id);

    res.json({ success: true, data: newReview });
  } catch (error: any) {
    console.error('[Add Review Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to save review' });
  }
});

// 3. Delete Review
app.delete('/api/properties/reviews/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Review.findOneAndDelete({ id });

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    // Recalculate average rating in MongoDB
    await updateAverageRating(deleted.property_id, deleted.mess_id);

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error: any) {
    console.error('[Delete Review Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete review' });
  }
});

// Get Single Property by custom id
app.get('/api/properties/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const property = await Property.findOne({ id });
    if (!property) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }
    res.json({ success: true, data: property });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to retrieve property' });
  }
});

app.post('/api/properties', async (req: Request, res: Response) => {
  try {
    const propertyData = {
      id: req.body.id || 'prop_' + Date.now(),
      ...req.body
    };

    const newProperty = new Property(propertyData);
    await newProperty.save();

    res.status(201).json({ success: true, data: newProperty });
  } catch (error: any) {
    console.error('[Create Property Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create property' });
  }
});

app.put('/api/properties/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedProperty = await Property.findOneAndUpdate(
      { id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedProperty) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    res.json({ success: true, data: updatedProperty });
  } catch (error: any) {
    console.error('[Update Property Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update property' });
  }
});

app.delete('/api/properties/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Property.findOneAndDelete({ id });

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Property not found' });
    }

    // Cascade delete all reviews for this property
    await Review.deleteMany({ property_id: id });

    res.json({ success: true, message: 'Property deleted successfully' });
  } catch (error: any) {
    console.error('[Delete Property Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete property' });
  }
});

// Mess endpoints
app.get('/api/messes', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const city = req.query.city ? (req.query.city as string).toLowerCase().trim() : undefined;
    const owner_id = req.query.owner_id as string;

    const query: any = {};
    if (city) {
      query.city = city;
    }
    if (owner_id) {
      query.owner_id = owner_id;
    }

    const total = await Mess.countDocuments(query);
    const messes = await Mess.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ created_at: -1 });

    res.json({
      success: true,
      data: messes,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('[Get Messes Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to retrieve messes' });
  }
});

// Dynamic Mess Sub-features Models
const MessMenu = mongoose.model('MessMenu', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  owner_id: { type: String, required: true },
  date: { type: String, required: true },
  breakfast: { type: [String], default: [] },
  lunch: { type: [String], default: [] },
  dinner: { type: [String], default: [] },
  snack: { type: [String], default: [] },
  breakfast_image: { type: String, default: null },
  lunch_image: { type: String, default: null },
  dinner_image: { type: String, default: null },
  snack_image: { type: String, default: null },
  category_images: { type: mongoose.Schema.Types.Mixed, default: {} },
  image_url: { type: String, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }));

const MessPlan = mongoose.model('MessPlan', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  mess_id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  duration_days: { type: Number, default: 30 },
  total_meals: { type: Number },
  daily_scan_limit: { type: Number, default: 1 },
  meal_types: { type: [String], default: [] },
  active: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }));

const StudentSubscription = mongoose.model('StudentSubscription', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  student_id: { type: String, required: true },
  mess_id: { type: String, required: true },
  plan_id: { type: String, required: true },
  status: { type: String, default: 'active' },
  start_date: { type: String, required: true },
  end_date: { type: String, required: true },
  meals_remaining: { type: Number },
  payment_status: { type: String, default: 'paid' },
  auto_renew: { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }));

const MessPaymentSettings = mongoose.model('MessPaymentSettings', new mongoose.Schema({
  owner_id: { type: String, required: true, unique: true },
  upi_id: { type: String, default: '' },
  phone_number: { type: String, default: '' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }));

const MessTransaction = mongoose.model('MessTransaction', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  owner_id: { type: String, required: true },
  student_name: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  method: { type: String, required: true },
  status: { type: String, required: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }));

const StudentAttendance = mongoose.model('StudentAttendance', new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  student_id: { type: String, required: true },
  mess_id: { type: String, required: true },
  date: { type: String, required: true },
  breakfast: { type: Boolean, default: false },
  lunch: { type: Boolean, default: false },
  dinner: { type: Boolean, default: false },
  snack: { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }));

// Endpoints mapping
// Mess menus endpoints
app.post('/api/messes/menus', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    console.log('[Property Service] POST /api/messes/menus payload:', JSON.stringify(payload, null, 2));
    const existing = await MessMenu.findOne({ id: payload.id });
    if (existing) {
      console.log('[Property Service] Updating existing daily menu with id:', payload.id);
      await MessMenu.findOneAndUpdate({ id: payload.id }, { $set: payload });
    } else {
      console.log('[Property Service] Creating new daily menu with id:', payload.id);
      const newMenu = new MessMenu(payload);
      await newMenu.save();
    }
    console.log('[Property Service] Save successful for menu id:', payload.id);
    res.json({ success: true, data: payload });
  } catch (error: any) {
    console.error('[Property Service] Error saving menu:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/messes/menus', async (req: Request, res: Response) => {
  try {
    const { owner_id, date } = req.query;
    console.log('[Property Service] GET /api/messes/menus query params:', req.query);
    const query: any = {};
    if (owner_id) query.owner_id = owner_id;
    if (date) query.date = date;

    const menus = await MessMenu.find(query).sort({ date: -1 });
    console.log(`[Property Service] Found ${menus.length} menus matching query:`, query);
    res.json({ success: true, data: menus });
  } catch (error: any) {
    console.error('[Property Service] Error retrieving menus:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Plans endpoints
app.post('/api/messes/plans', async (req: Request, res: Response) => {
  try {
    const newPlan = new MessPlan(req.body);
    await newPlan.save();
    res.status(201).json({ success: true, data: newPlan });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/messes/plans/:id', async (req: Request, res: Response) => {
  try {
    const updated = await MessPlan.findOneAndUpdate({ id: req.params.id }, { $set: req.body }, { new: true });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/messes/plans', async (req: Request, res: Response) => {
  try {
    const { mess_id } = req.query;
    const query: any = {};
    if (mess_id) query.mess_id = mess_id;
    const plans = await MessPlan.find(query).sort({ created_at: -1 });
    res.json({ success: true, data: plans });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/messes/plans/:id', async (req: Request, res: Response) => {
  try {
    await MessPlan.findOneAndDelete({ id: req.params.id });
    res.json({ success: true, message: 'Plan deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Subscriptions
app.post('/api/messes/subscriptions', async (req: Request, res: Response) => {
  try {
    const newSub = new StudentSubscription(req.body);
    await newSub.save();
    res.status(201).json({ success: true, data: newSub });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/messes/subscriptions/:id', async (req: Request, res: Response) => {
  try {
    const updated = await StudentSubscription.findOneAndUpdate({ id: req.params.id }, { $set: req.body }, { new: true });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/messes/subscriptions', async (req: Request, res: Response) => {
  try {
    const { mess_id, student_id } = req.query;
    const query: any = {};
    if (mess_id) query.mess_id = mess_id;
    if (student_id) query.student_id = student_id;
    const subs = await StudentSubscription.find(query).sort({ created_at: -1 });
    res.json({ success: true, data: subs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/messes/subscriptions/:id', async (req: Request, res: Response) => {
  try {
    await StudentSubscription.findOneAndDelete({ id: req.params.id });
    res.json({ success: true, message: 'Subscription deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Payment settings
app.post('/api/messes/payment-settings', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const existing = await MessPaymentSettings.findOne({ owner_id: payload.owner_id });
    if (existing) {
      await MessPaymentSettings.findOneAndUpdate({ owner_id: payload.owner_id }, { $set: payload });
    } else {
      const newSettings = new MessPaymentSettings(payload);
      await newSettings.save();
    }
    res.json({ success: true, data: payload });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/messes/payment-settings', async (req: Request, res: Response) => {
  try {
    const { owner_id } = req.query;
    const settings = await MessPaymentSettings.findOne({ owner_id });
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Transactions
app.post('/api/messes/transactions', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const existing = await MessTransaction.findOne({ id: payload.id });
    if (existing) {
      await MessTransaction.findOneAndUpdate({ id: payload.id }, { $set: payload });
    } else {
      const newTxn = new MessTransaction(payload);
      await newTxn.save();
    }
    res.json({ success: true, data: payload });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/messes/transactions', async (req: Request, res: Response) => {
  try {
    const { owner_id } = req.query;
    const txns = await MessTransaction.find({ owner_id }).sort({ date: -1 });
    res.json({ success: true, data: txns });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Attendance
app.post('/api/messes/attendance', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const existing = await StudentAttendance.findOne({ id: payload.id });
    if (existing) {
      await StudentAttendance.findOneAndUpdate({ id: payload.id }, { $set: payload });
    } else {
      const newAttendance = new StudentAttendance(payload);
      await newAttendance.save();
    }
    res.json({ success: true, data: payload });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/messes/attendance', async (req: Request, res: Response) => {
  try {
    const { mess_id, student_id } = req.query;
    const query: any = {};
    if (mess_id) query.mess_id = mess_id;
    if (student_id) query.student_id = student_id;
    const logs = await StudentAttendance.find(query).sort({ date: -1 });
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Single Mess by custom id or owner_id
app.get('/api/messes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let mess = await Mess.findOne({ id });
    if (!mess) {
      // Fallback to match by owner_id if requested
      mess = await Mess.findOne({ owner_id: id });
    }
    if (!mess) {
      return res.status(404).json({ success: false, error: 'Mess not found' });
    }
    res.json({ success: true, data: mess });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to retrieve mess' });
  }
});

app.post('/api/messes', async (req: Request, res: Response) => {
  try {
    const messData = {
      id: req.body.id || 'mess_' + Date.now(),
      ...req.body
    };

    const newMess = new Mess(messData);
    await newMess.save();

    res.status(201).json({ success: true, data: newMess });
  } catch (error: any) {
    console.error('[Create Mess Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create mess' });
  }
});

app.put('/api/messes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedMess = await Mess.findOneAndUpdate(
      { id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedMess) {
      return res.status(404).json({ success: false, error: 'Mess not found' });
    }

    res.json({ success: true, data: updatedMess });
  } catch (error: any) {
    console.error('[Update Mess Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update mess' });
  }
});

app.delete('/api/messes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Mess.findOneAndDelete({ id });

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Mess not found' });
    }

    // Cascade delete all reviews for this mess
    await Review.deleteMany({ mess_id: id });

    res.json({ success: true, message: 'Mess deleted successfully' });
  } catch (error: any) {
    console.error('[Delete Mess Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete mess' });
  }
});

app.listen(PORT, () => {
  console.log(`[Property Service] Running on port ${PORT}`);
});
// Force reload index.ts for reverted MONGODB_URI to test database

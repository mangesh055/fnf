import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../shared/db';
import Property from './Property';
import Mess from './Mess';

dotenv.config();



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
      .sort({ created_at: -1 });

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

    res.json({ success: true, message: 'Mess deleted successfully' });
  } catch (error: any) {
    console.error('[Delete Mess Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete mess' });
  }
});

app.listen(PORT, () => {
  console.log(`[Property Service] Running on port ${PORT}`);
});

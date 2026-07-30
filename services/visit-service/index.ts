import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../shared/db';
import Visit from './Visit';

dotenv.config();



const app = express();
const PORT = process.env.VISIT_SERVICE_PORT || 5003;

app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ service: 'visit-service', status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/visits', async (req: Request, res: Response) => {
  try {
    const visits = await Visit.find().sort({ created_at: -1 });
    res.json({ success: true, data: visits });
  } catch (error: any) {
    console.error('[Get Visits Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to retrieve visits' });
  }
});

app.post('/api/visits', async (req: Request, res: Response) => {
  try {
    const visitData = {
      id: req.body.id || 'vst_' + Date.now(),
      status: 'pending',
      ...req.body
    };

    const newVisit = new Visit(visitData);
    await newVisit.save();

    res.status(201).json({ success: true, data: newVisit });
  } catch (error: any) {
    console.error('[Create Visit Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create visit' });
  }
});

app.patch('/api/visits/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedVisit = await Visit.findOneAndUpdate(
      { id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedVisit) {
      return res.status(404).json({ success: false, error: 'Visit not found' });
    }

    return res.json({ success: true, data: updatedVisit });
  } catch (error: any) {
    console.error('[Update Visit Error]:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update visit' });
  }
});

app.listen(PORT, () => {
  console.log(`[Visit Service] Running on port ${PORT}`);
});

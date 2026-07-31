import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || process.env.GATEWAY_PORT || 5000;

app.use(cors());

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'FlatsNFood Microservices API Gateway',
    status: 'online',
    healthCheck: '/health',
    endpoints: ['/api/auth', '/api/properties', '/api/messes', '/api/visits', '/api/community']
  });
});

// Health check endpoint for the Gateway
app.get('/health', (req: Request, res: Response) => {
  res.json({
    service: 'api-gateway',
    status: 'healthy',
    routes: {
      auth: 'http://localhost:5001',
      property: 'http://localhost:5002',
      visit: 'http://localhost:5003',
      community: 'http://localhost:5004'
    },
    timestamp: new Date().toISOString()
  });
});

// Proxy routes using http-proxy-middleware v3 pathFilter option to preserve prefixes
app.use(
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
    changeOrigin: true,
    pathFilter: '/api/auth'
  })
);

app.use(
  createProxyMiddleware({
    target: process.env.PROPERTY_SERVICE_URL || 'http://localhost:5002',
    changeOrigin: true,
    pathFilter: '/api/properties'
  })
);

app.use(
  createProxyMiddleware({
    target: process.env.PROPERTY_SERVICE_URL || 'http://localhost:5002',
    changeOrigin: true,
    pathFilter: '/api/messes'
  })
);

app.use(
  createProxyMiddleware({
    target: process.env.VISIT_SERVICE_URL || 'http://localhost:5003',
    changeOrigin: true,
    pathFilter: '/api/visits'
  })
);

app.use(
  createProxyMiddleware({
    target: process.env.COMMUNITY_SERVICE_URL || 'http://localhost:5004',
    changeOrigin: true,
    pathFilter: '/api/community'
  })
);

app.listen(PORT, () => {
  console.log(`[API Gateway] Running on port ${PORT}`);
});
import mongoose, { Connection } from 'mongoose';

const connections: { [key: string]: Connection } = {};

/**
 * Retrieves or establishes a cached database connection pool for a specific microservice URI.
 */
export function getDBConnection(uriKey: string): Connection {
  const uri = process.env[uriKey] || process.env.MONGODB_URI || 'mongodb://localhost:27017/campusnest';
  if (!connections[uri]) {
    connections[uri] = mongoose.createConnection(uri);
    console.log(`[Database] Connection pool created for key: ${uriKey}`);
    
    connections[uri].on('connected', () => {
      console.log(`[Database] Connected successfully to database via key: ${uriKey}`);
    });
    
    connections[uri].on('error', (err) => {
      console.error(`[Database] Connection error for key ${uriKey}:`, err);
    });
  }
  return connections[uri];
}

/**
 * Standard global connection fallback (kept for backwards compatibility)
 */
export async function connectDB(uri?: string) {
  const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/campusnest';
  try {
    if (mongoose.connection.readyState >= 1) {
      return;
    }
    await mongoose.connect(mongoUri);
    console.log('[Database] Connected to MongoDB via default connection');
  } catch (error) {
    console.error('[Database] Connection failed:', error);
    process.exit(1);
  }
}

import mongoose from 'mongoose';
import { env } from './env';

let isConnected = false;
let memoryServer: any = null;

export const connectDatabase = async (): Promise<void> => {
  if (isConnected) {
    return;
  }

  try {
    // Attempt connecting to configured MONGODB_URI with a 4s timeout
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
    });
    isConnected = true;
    console.log(`✅ MongoDB connected successfully to: ${env.MONGODB_URI}`);
  } catch (error: any) {
    console.warn(`⚠️ Could not connect to primary MongoDB at ${env.MONGODB_URI}: ${error.message}`);
    
    // In development or test, fall back to MongoMemoryServer so the app runs without external setup
    if (env.NODE_ENV !== 'production') {
      try {
        console.log('🔄 Initializing in-process MongoDB instance (MongoMemoryServer) for development/testing...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const memUri = memoryServer.getUri();
        await mongoose.connect(memUri);
        isConnected = true;
        console.log(`✅ MongoDB in-process engine ready at: ${memUri}`);
        return;
      } catch (memErr: any) {
        console.error('❌ Failed to start in-process MongoDB fallback:', memErr);
      }
    }
    
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (!isConnected) return;
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
  isConnected = false;
  console.log('🔌 MongoDB connection closed.');
};

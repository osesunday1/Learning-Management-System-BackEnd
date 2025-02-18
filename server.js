import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import mongoose from 'mongoose';
import { clerkWebhooks } from './controllers/webhooks.js';

const app = express();

// Middleware for regular JSON requests
app.use(express.json());
app.use(cors());

// Clerk Webhook must use `express.raw()`
app.post('/clerk', express.raw({ type: 'application/json' }), clerkWebhooks);

// Connect to MongoDB
const connect = async () => {
  try {
      await mongoose.connect(process.env.MONGO);
      console.log('✅ Connected to MongoDB');
  } catch (error) {
      console.error('❌ MongoDB Connection Error:', error);
      throw error;
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB Disconnected");
});

mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB Connected");
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    connect();
    console.log(`🚀 Server running on port ${PORT}`);
});
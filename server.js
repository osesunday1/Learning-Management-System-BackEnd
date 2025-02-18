import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import mongoose from 'mongoose';
import { clerkWebhooks } from './controllers/webhooks.js';

const app = express();

// Apply `express.json()` for normal API requests
app.use(express.json());
app.use(cors());

// Apply `express.raw()` only for Clerk Webhook route
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

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the GHS Apartment API!');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    connect();
    console.log(`🚀 Server running on port ${PORT}`);
});
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import mongoose from 'mongoose';
import { clerkWebhooks } from './controllers/webhooks.js';
import userRoutes from "./routes/user.js";

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/clerk', express.raw({ type: 'application/json' })); // Important for Clerk webhooks

// MongoDB Connection
const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

mongoose.connection.on("disconnected", () => console.log("MongoDB Disconnected"));
mongoose.connection.on("connected", () => console.log("MongoDB Connected"));

// Routes
app.get('/', (req, res) => res.send('Welcome to the API!'));
app.use("/api/users", userRoutes);
app.post('/clerk', clerkWebhooks);

// Start Server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  connect();
  console.log(`App running on port ${port}...`);
});
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js'
import educatorRoutes from './routes/educatorRoutes.js';
import userRoutes from './routes/userRoutes.js'
import connectCloudinary from './configs/cloudinary.js';
import courseRoutes from './routes/courseRoutes.js'


const app = express();
dotenv.config();// Load environment variables


// Apply `express.json()` for normal API requests
app.use(cors());
app.use(cookieParser());
app.use(express.json());

// Connect to MongoDB
const connect = async () => {
  try {
      await mongoose.connect(`${process.env.MONGO}/lms`);
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

//connect to cloudinary
await connectCloudinary()

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the GHS Apartment API!');
});


//use route
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/educators', educatorRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/courses', courseRoutes);



// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    connect();
    console.log(`🚀 Server running on port ${PORT}`);
});
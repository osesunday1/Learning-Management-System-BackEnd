import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import mongoose from 'mongoose';
import { clerkWebhooks } from './controllers/webhooks.js'; 





// Initialize Express
const app = express()

// Middlewares
app.use(cors())



// Initialize database connection
const connect = async () => {
  try {
      await mongoose.connect(process.env.MONGO);
      console.log('connected to MongoDB');
  } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw error;
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB Disconnected");
});

mongoose.connection.on("connected", () => {
  console.log("MongoDB Connected");
});



// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the GHS Apartment API!');
});

app.post('/clerk', express.json(), clerkWebhooks);




// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    connect();
    console.log(`App running on port ${port}...`);
});
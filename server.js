import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js'
import { clerkWebhooks } from './controllers/webhooks'

// Initialize Express
const app = express()

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



// Middlewares
app.use(cors())

// Routes
app.get('/', (req, res) => res.send("API Working"))
app.post('/clerk', express.raw({ type: 'application/json' }), clerkWebhooks);

// Port
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
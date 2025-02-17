import express from "express";
import User from "../models/User.js";  // Ensure the path is correct

const router = express.Router();

// Create a new user
router.post("/", async (req, res) => {
  try {
    const { _id, name, email, imageUrl, enrolledCourses } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }

    // Create a new user
    const newUser = new User({
      _id,
      name,
      email,
      imageUrl,
      enrolledCourses,
    });

    // Save user to DB
    await newUser.save();
    res.status(201).json({ message: "User created successfully!", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
});

export default router;
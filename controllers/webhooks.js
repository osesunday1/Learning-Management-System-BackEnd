import User from "../models/User.js";

export const clerkWebhooks = async (req, res) => {
  try {
    const payload = JSON.parse(req.body); // Clerk sends raw JSON data

    if (payload.type === "user.created") {
      const { id, first_name, last_name, email_addresses, image_url } = payload.data;

      // Check if user already exists
      const existingUser = await User.findOne({ email: email_addresses[0].email_address });
      if (existingUser) {
        return res.status(200).json({ message: "User already exists in DB" });
      }

      // Create new user
      const newUser = new User({
        _id: id, // Clerk ID as _id
        name: `${first_name} ${last_name}`,
        email: email_addresses[0].email_address,
        imageUrl: image_url,
        enrolledCourses: [],
      });

      await newUser.save();
      console.log("User saved to MongoDB:", newUser);
    }

    res.status(200).send("Webhook received successfully");
  } catch (error) {
    console.error("Error processing Clerk webhook:", error);
    res.status(500).json({ message: "Webhook error", error: error.message });
  }
};
import { Webhook } from "svix";
import User from "../models/User.js";

export const clerkWebhooks = async (req, res) => {
  try {
    console.log("Webhook received:", req.body);

    // Parse raw body
    const payload = JSON.parse(req.body);

    // Extract necessary data
    const { data, type } = payload;

    if (type === "user.created") {
      console.log("Creating user in MongoDB:", data);

      const userData = {
        _id: data.id,
        email: data.email_addresses[0].email_address,
        name: `${data.first_name} ${data.last_name}`,
        imageUrl: data.image_url,
      };

      await User.create(userData);
      console.log("User saved successfully:", userData);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
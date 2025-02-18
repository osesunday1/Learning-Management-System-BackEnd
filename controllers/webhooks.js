import { Webhook } from "svix";
import User from "../models/User.js";

export const clerkWebhooks = async (req, res) => {
  try {
    console.log("📢 Webhook received:", req.body);

    // Clerk Webhook Verification
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    const payload = req.body; // DO NOT parse JSON again
    const headers = {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    };

    try {
      whook.verify(JSON.stringify(payload), headers);
    } catch (err) {
      console.error("❌ Webhook Verification Failed:", err.message);
      return res.status(401).json({ success: false, message: "Unauthorized webhook" });
    }

    const { data, type } = payload;

    if (type === "user.created") {
      console.log("🔹 Processing user.created event:", data);

      if (!data.email_addresses || data.email_addresses.length === 0) {
        console.error("❌ No email found in webhook data");
        return res.status(400).json({ success: false, message: "Missing email address" });
      }

      const userData = {
        email: data.email_addresses[0].email_address,
        name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
        imageUrl: data.image_url || "",
      };

      console.log("📌 User Data to Save:", userData);

      const newUser = await User.create(userData);
      console.log("✅ User saved successfully:", newUser);

      return res.status(200).json({ success: true });
    }

    console.warn("⚠️ Unhandled webhook event:", type);
    return res.status(400).json({ success: false, message: "Unhandled event type" });

  } catch (error) {
    console.error("❌ Error handling webhook:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
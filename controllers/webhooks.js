import { Webhook } from "svix";
import User from "../models/User.js";

export const clerkWebhooks = async (req, res) => {
  try {
    console.log("📢 Webhook received from Clerk");

    // Convert raw body to string (this is required for Svix verification)
    const payload = req.body.toString();  
    const headers = {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    };

    // Verify webhook signature
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    try {
      whook.verify(payload, headers);
    } catch (err) {
      console.error("❌ Webhook Verification Failed:", err.message);
      return res.status(401).json({ success: false, message: "Unauthorized webhook" });
    }

    console.log("✅ Webhook Verified Successfully");

    const { data, type } = JSON.parse(payload);

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

      try {
        const newUser = await User.create(userData);
        console.log("✅ User saved successfully:", newUser);
        return res.status(200).json({ success: true });
      } catch (dbError) {
        console.error("❌ MongoDB Error:", dbError);
        return res.status(500).json({ success: false, message: dbError.message });
      }
    }

    console.warn("⚠️ Unhandled webhook event:", type);
    return res.status(400).json({ success: false, message: "Unhandled event type" });

  } catch (error) {
    console.error("❌ Error handling webhook:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
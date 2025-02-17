import { Webhook } from "svix";
import User from "../models/User.js";


// API Controller Function to Manage Clerk User with database
export const clerkWebhooks = async (req, res) => {
    try {
        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

        const payload = req.body; // Use raw body data
        await whook.verify(payload, {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"]
        });

        const { data, type } = payload;

        switch (type) {
            case 'user.created': {
                const userData = {
                    _id: data.id,
                    email: data.email_addresses[0].email_address, // Fixed key name
                    name: `${data.first_name} ${data.last_name}`,
                    imageUrl: data.image_url,
                };
                await User.create(userData);
                return res.json({});
            }
            case 'user.updated': {
                const userData = {
                    email: data.email_addresses[0].email_address, // Fixed key name
                    name: `${data.first_name} ${data.last_name}`,
                    imageUrl: data.image_url,
                };
                await User.findByIdAndUpdate(data.id, userData);
                return res.json({});
            }
            case 'user.deleted': {
                await User.findByIdAndDelete(data.id);
                return res.json({});
            }
            default:
                return res.status(400).json({ error: "Unhandled event type" });
        }
    } catch (error) {
        return res.status(404).json({ error: error.message }); // Fixed error handling
    }
};
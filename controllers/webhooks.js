export const clerkWebhooks = async (req, res) => {
  try {
    console.log("Webhook received:", req.body); // Debugging log

    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    await whook.verify(JSON.stringify(req.body), {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    console.log("Webhook verified:", req.body.type); // Debugging log

    const { data, type } = req.body;

    switch (type) {
      case 'user.created': {
        console.log("Creating user in MongoDB:", data);

        const userData = {
          _id: data.id,
          email: data.email_addresses[0].email_address,
          name: `${data.first_name} ${data.last_name}`,
          imageUrl: data.image_url,
        };

        await User.create(userData);
        console.log("User saved successfully:", userData);

        res.status(200).json({ success: true });
        break;
      }
      case 'user.updated': {
        console.log("Updating user in MongoDB:", data);

        const userData = {
          email: data.email_addresses[0].email_address,
          name: `${data.first_name} ${data.last_name}`,
          imageUrl: data.image_url,
        };

        await User.findByIdAndUpdate(data.id, userData);
        res.status(200).json({ success: true });
        break;
      }
      case 'user.deleted': {
        console.log("Deleting user in MongoDB:", data.id);
        await User.findByIdAndDelete(data.id);
        res.status(200).json({ success: true });
        break;
      }
      default:
        res.status(400).json({ success: false, message: "Unhandled event type" });
        break;
    }
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
import nodemailer from 'nodemailer';
import Contact from '../models/Contact.js';

// @desc    Send email and save contact to database
// @route   POST /api/contacts
// @access  Public
const sendContactEmail = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Save contact to database
    const contact = await Contact.create({
      name,
      email,
      phone,
      message
    });

    // Send email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: "ucsmodulars.chennai@gmail.com",
      subject: `New message from ${name}`,
      text: `
        Name: ${name}
        Email: ${email}
        Phone: ${phone || "Not provided"}
        Message: ${message}
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ 
      success: true, 
      message: "Email sent successfully!",
      contact
    });
  } catch (error) {
    console.error("❌ Error sending email:", error);
    res
      .status(500)
      .json({ success: false, message: error.message || "Failed to send email" });
  }
};

// @desc    Get all contacts
// @route   GET /api/contacts
// @access  Private (would require auth middleware in production)
const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({}).sort({ createdAt: -1 });
    res.status(200).json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch contacts" });
  }
};

export { sendContactEmail, getContacts };
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import database connection
import connectDB from './config/db.js';

// Connect to MongoDB using the configured connection
// The connection will fall back to local MongoDB if Atlas connection fails
connectDB().then(connected => {
  if (connected) {
    console.log('✅ Database connection established successfully');
  } else {
    console.log('⚠️ Running with limited database functionality');
  }
});

// Contact Schema
const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

const Contact = mongoose.model('Contact', contactSchema);

// API Routes
app.post('/api/contacts', async (req, res) => {
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
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.EMAIL_TO || "ucsmodulars.chennai@gmail.com",
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
    
    // Handle specific error types
    if (error.code === 'EAUTH' || error.code === 'ESOCKET') {
      return res.status(500).json({ 
        success: false, 
        message: "Email server connection failed. Your message was saved but email notification couldn't be sent." 
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid data provided. Please check your form inputs." 
      });
    }
    
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "This contact information has already been submitted." 
      });
    }
    
    // Save contact even if email fails
    try {
      if (!req.body.savedToDb) {
        const contact = await Contact.create({
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone || "",
          message: req.body.message
        });
        
        return res.status(201).json({ 
          success: true, 
          message: "Your message was saved but we couldn't send an email notification. We'll still contact you soon.",
          contact
        });
      }
    } catch (dbError) {
      console.error("❌ Error saving to database:", dbError);
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Something went wrong. Please try again or contact us directly." 
    });
  }
});

// For backward compatibility with old API endpoint
app.post("/api/send-email", (req, res) => {
  // Redirect to new endpoint
  req.url = '/api/contacts';
  app.handle(req, res);
});

// Get all contacts
app.get('/api/contacts', async (_req, res) => {
  try {
    // Add timeout promise to handle MongoDB operation timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 8000);
    });
    
    // Race the database query against the timeout
    const contacts = await Promise.race([
      Contact.find({}).sort({ createdAt: -1 }).exec(),
      timeoutPromise
    ]);
    
    res.status(200).json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    
    // Handle timeout error specifically
    if (error.message.includes('timed out')) {
      return res.status(503).json({ 
        success: false, 
        message: "Database is currently slow to respond. Please try again in a moment." 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Unable to retrieve contacts. Please try again later." 
    });
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../dist')));

  // Any route that is not api will be redirected to index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 5000;
const SERVER_URL = process.env.API_URL || `http://localhost:${PORT}`;
app.listen(PORT, () => console.log(`✅ Server running on ${SERVER_URL}`));

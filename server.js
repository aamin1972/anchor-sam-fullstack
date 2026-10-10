const express = require('express');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Booking = require("./models/Booking");
require("dotenv").config();
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const app = express();
const PORT = process.env.PORT || 5000;
const bookingsFile = path.join(__dirname, 'data', 'bookings.json');
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });
app.use(express.json());
app.use(
 session({
  secret: process.env.SESSION_SECRET,

  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }),

  resave: false,
  saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax"
    }
  })
);
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/bookings', async (req, res) => {
  try {
    const { name, phone, eventType, eventDate, location, message } = req.body;

    if (!name || !phone || !eventType || !eventDate) {
      return res.status(400).json({
        message: 'Please fill all required fields.'
      });
    }

    const booking = await Booking.create({
      name,
      phone,
      eventType,
      eventDate,
      location: location || '',
      message: message || ''
    });

    res.status(201).json({
      message: 'Booking request received! I will contact you soon.',
      bookingId: booking._id
    });

  } catch (error) {
    console.error("Booking save error:", error);

    res.status(500).json({
      message: 'Unable to save booking.'
    });
  }
});
app.get('/api/health', (_, res) => res.json({status:'ok'}));
// app.get('*', (_, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    req.session.isAdmin = true;

    return res.json({
      success: true,
      message: "Login successful"
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid username or password"
  });
});

// Check if admin is logged in
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "Unauthorized"
  });
}


// Get all bookings for Admin Dashboard
// Get all bookings for Admin Dashboard
app.get("/api/admin/bookings", requireAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Booking read error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load bookings"
    });
  }
});


app.listen(PORT, () => {
  console.log(`Website running on port ${PORT}`);
});
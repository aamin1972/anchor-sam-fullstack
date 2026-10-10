const express = require('express');
const path = require('path');
const fs = require('fs');
require("dotenv").config();
const session = require("express-session");
const app = express();
const PORT = process.env.PORT || 5000;
const bookingsFile = path.join(__dirname, 'data', 'bookings.json');
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax"
    }
  })
);
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/bookings', (req, res) => {
  const { name, phone, eventType, eventDate, location, message } = req.body;
  if (!name || !phone || !eventType || !eventDate) return res.status(400).json({message:'Please fill all required fields.'});
  let bookings = [];
  try { bookings = JSON.parse(fs.readFileSync(bookingsFile, 'utf8') || '[]'); } catch (_) {}
  const booking = { id: Date.now(), name, phone, eventType, eventDate, location: location || '', message: message || '', createdAt: new Date().toISOString() };
  bookings.push(booking);
  fs.writeFileSync(bookingsFile, JSON.stringify(bookings, null, 2));
  res.status(201).json({message:'Booking request received! I will contact you soon.', bookingId: booking.id});
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
app.get("/api/admin/bookings", requireAdmin, (req, res) => {

  try {

    const bookingsFile = path.join(__dirname, "data", "bookings.json");

    if (!fs.existsSync(bookingsFile)) {
      return res.json([]);
    }

    const fileData = fs.readFileSync(bookingsFile, "utf8");

    const bookings = fileData
      ? JSON.parse(fileData)
      : [];

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
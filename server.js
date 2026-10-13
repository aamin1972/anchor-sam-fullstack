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
const bcrypt = require("bcrypt");
const User = require("./models/User");

const multer = require("multer");
const cloudinary = require("./config/cloudinary");
const WeddingPhoto = require("./models/WeddingPhoto");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

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
      userId: req.session.userId || null,
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

// User Signup
app.post("/api/signup", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields"
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase()
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Signup error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create account"
    });
  }
});

// User Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter email and password"
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    req.session.userId = user._id.toString();

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      }
    });

  } catch (error) {
    console.error("User login error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to login"
    });
  }
});


// Get Current Logged-in User
app.get("/api/me", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first"
      });
    }

    const user = await User.findById(req.session.userId)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error("Current user error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load account"
    });
  }
});

// Logged-in User Bookings
app.get("/api/my-bookings", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        success: false,
        message: "Please login first"
      });
    }

    const bookings = await Booking.find({
      userId: req.session.userId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings
    });

  } catch (error) {
    console.error("My bookings error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load bookings"
    });
  }
});


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

app.post(
  "/api/admin/wedding-photos",
  requireAdmin,
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select a photo"
        });
      }

      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "anchor-sam/weddings"
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        stream.end(req.file.buffer);
      });

      const photo = await WeddingPhoto.create({
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id
      });

      res.status(201).json({
        success: true,
        message: "Wedding photo uploaded successfully",
        photo
      });

    } catch (error) {
      console.error("Wedding photo upload error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to upload wedding photo"
      });
    }
  }
);



// Public Wedding Gallery Photos
app.get("/api/wedding-photos", async (req, res) => {
  try {
    const photos = await WeddingPhoto.find()
      .sort({ createdAt: -1 });

    res.json(photos);

  } catch (error) {
    console.error("Wedding photos read error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load wedding photos"
    });
  }
});

// Admin - Delete Wedding Photo
app.delete(
  "/api/admin/wedding-photos/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const photo = await WeddingPhoto.findById(req.params.id);

      if (!photo) {
        return res.status(404).json({
          success: false,
          message: "Photo not found"
        });
      }

      // Delete from Cloudinary
      await cloudinary.uploader.destroy(photo.publicId);

      // Delete from MongoDB
      await WeddingPhoto.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: "Photo deleted successfully"
      });

    } catch (error) {
      console.error("Wedding photo delete error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to delete photo"
      });
    }
  }
);

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

// Update booking status
app.patch("/api/admin/bookings/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "New",
      "Confirmed",
      "Completed",
      "Cancelled"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status"
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    res.json({
      success: true,
      message: "Booking status updated",
      booking
    });

  } catch (error) {
    console.error("Status update error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update booking status"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Website running on port ${PORT}`);
});
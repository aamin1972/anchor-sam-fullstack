const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    eventType: {
      type: String,
      required: true
    },
    eventDate: {
      type: String,
      required: true
    },
    location: {
      type: String,
      default: ""
    },
    message: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      default: "New"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Booking", bookingSchema);
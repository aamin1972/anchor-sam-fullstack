const mongoose = require("mongoose");

const weddingPhotoSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("WeddingPhoto", weddingPhotoSchema);
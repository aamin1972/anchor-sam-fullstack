const form=document.getElementById('bookingForm');const msg=document.getElementById('formMessage');
form.addEventListener('submit',async(e)=>{e.preventDefault();msg.textContent='Sending...';const data=Object.fromEntries(new FormData(form).entries());try{const r=await fetch('/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const out=await r.json();msg.textContent=out.message;if(r.ok){form.reset();msg.style.color='#16833b'}else msg.style.color='#b42318'}catch{msg.textContent='Could not send request. Please try again.';msg.style.color='#b42318'}});
async function loadWeddingPhotos() {
  try {
    const response = await fetch("/api/wedding-photos");

    if (!response.ok) {
      throw new Error("Unable to load wedding photos");
    }

    const photos = await response.json();

    const container = document.getElementById("weddingGalleryContent");

    // Remove previously loaded uploaded photos
    container
      .querySelectorAll(".uploaded-wedding-photo")
      .forEach((img) => img.remove());

    // Add photos uploaded by admin
    photos.forEach((photo) => {
      const img = document.createElement("img");

      img.src = photo.imageUrl;
      img.alt = "Wedding Event";
      img.className = "uploaded-wedding-photo";

      container.appendChild(img);
    });

  } catch (error) {
    console.error("Wedding gallery error:", error);
  }
}

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

      // Delete image from Cloudinary
      await cloudinary.uploader.destroy(photo.publicId);

      // Delete record from MongoDB
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

async function openWeddingGallery() {
  document
    .getElementById("weddingGallery")
    .classList.add("active");

  document.body.style.overflow = "hidden";

  await loadWeddingPhotos();
}

function closeWeddingGallery() {
  document.getElementById("weddingGallery").classList.remove("active");
  document.body.style.overflow = "";
}
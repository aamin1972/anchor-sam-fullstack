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


async function updateUserNavbar() {
  try {
    const response = await fetch("/api/me");
    const userNavLink = document.getElementById("userNavLink");

    if (!userNavLink) return;

    if (response.ok) {
      userNavLink.textContent = "My Account";
      userNavLink.href = "/account.html";
    } else {
      userNavLink.textContent = "Login";
      userNavLink.href = "/login.html";
    }
  } catch (error) {
    console.error("Navbar user check error:", error);
  }
}

updateUserNavbar();
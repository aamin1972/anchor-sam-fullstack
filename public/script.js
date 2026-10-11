const form=document.getElementById('bookingForm');const msg=document.getElementById('formMessage');
form.addEventListener('submit',async(e)=>{e.preventDefault();msg.textContent='Sending...';const data=Object.fromEntries(new FormData(form).entries());try{const r=await fetch('/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const out=await r.json();msg.textContent=out.message;if(r.ok){form.reset();msg.style.color='#16833b'}else msg.style.color='#b42318'}catch{msg.textContent='Could not send request. Please try again.';msg.style.color='#b42318'}});
function openWeddingGallery() {
  document.getElementById("weddingGallery").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeWeddingGallery() {
  document.getElementById("weddingGallery").classList.remove("active");
  document.body.style.overflow = "";
}
const IMAGE_BASE = "Assets/Images/";
const WEB_BASE = "Assets/";

let images = [];
let currentIndex = 0;
let slideshowTimer = null;
let isPlaying = false;

const liveSlide = document.getElementById("live-slide");
const slideCounter = document.getElementById("slide-counter");
const galleryGrid = document.getElementById("gallery-grid");
const playBtn = document.getElementById("play-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const video = document.getElementById("slideshow-video");
const fullscreenBtn = document.getElementById("fullscreen-btn");
const downloadBtn = document.getElementById("download-btn");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");

function imagePath(entry) {
  const name = typeof entry === "string" ? entry : entry.src;
  const base = name.startsWith("web/") ? WEB_BASE : IMAGE_BASE;
  return `${base}${encodeURIComponent(name).replace(/%2F/g, "/")}`;
}

function showSlide(index) {
  if (!images.length) return;
  currentIndex = (index + images.length) % images.length;
  const entry = images[currentIndex];
  liveSlide.src = imagePath(entry);
  liveSlide.alt = `Memory photo ${currentIndex + 1}`;
  slideCounter.textContent = `${currentIndex + 1} / ${images.length}`;
}

function stopSlideshow() {
  isPlaying = false;
  playBtn.textContent = "Play Slideshow";
  if (slideshowTimer) {
    clearInterval(slideshowTimer);
    slideshowTimer = null;
  }
}

function startSlideshow() {
  isPlaying = true;
  playBtn.textContent = "Pause";
  slideshowTimer = setInterval(() => showSlide(currentIndex + 1), 3500);
}

function toggleSlideshow() {
  if (isPlaying) stopSlideshow();
  else startSlideshow();
}

function buildGallery() {
  galleryGrid.innerHTML = "";
  images.forEach((entry, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gallery-item";
    btn.setAttribute("aria-label", `Open photo ${index + 1}`);

    const img = document.createElement("img");
    img.src = imagePath(entry);
    img.alt = `Gallery photo ${index + 1}`;
    img.loading = "lazy";

    btn.appendChild(img);
    btn.addEventListener("click", () => openLightbox(index));
    galleryGrid.appendChild(btn);
  });
}

function openLightbox(index) {
  currentIndex = index;
  lightboxImg.src = imagePath(images[index]);
  lightboxImg.alt = `Gallery photo ${index + 1}`;
  lightbox.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.add("hidden");
  document.body.style.overflow = "";
}

function stepLightbox(delta) {
  showSlide(currentIndex + delta);
  lightboxImg.src = imagePath(images[currentIndex]);
  lightboxImg.alt = `Gallery photo ${currentIndex + 1}`;
}

playBtn.addEventListener("click", toggleSlideshow);
prevBtn.addEventListener("click", () => showSlide(currentIndex - 1));
nextBtn.addEventListener("click", () => showSlide(currentIndex + 1));

fullscreenBtn.addEventListener("click", () => {
  if (video.requestFullscreen) video.requestFullscreen();
  else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
});

downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.href = "Assets/bubba-slideshow.mp4";
  link.download = "bubba-celebration-slideshow.mp4";
  link.click();
});

lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
lightbox.querySelector(".lightbox-prev").addEventListener("click", () => stepLightbox(-1));
lightbox.querySelector(".lightbox-next").addEventListener("click", () => stepLightbox(1));

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (lightbox.classList.contains("hidden")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") stepLightbox(-1);
  if (e.key === "ArrowRight") stepLightbox(1);
});

async function init() {
  try {
    const res = await fetch("images.json");
    images = await res.json();
  } catch {
    images = [];
  }

  if (images.length) {
    showSlide(0);
    buildGallery();
    video.poster = imagePath(images[0]);
  }
}

init();

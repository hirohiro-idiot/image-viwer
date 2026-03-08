const pickFolderBtn = document.getElementById("pickFolderBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const fitBtn = document.getElementById("fitBtn");
const fillBtn = document.getElementById("fillBtn");
const mainImage = document.getElementById("mainImage");
const emptyMessage = document.getElementById("emptyMessage");
const thumbbar = document.getElementById("thumbbar");
const statusText = document.getElementById("status");

let imageFiles = [];
let imageURLs = [];
let currentIndex = 0;
let currentMode = "fit"; // fit / fill

const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];

function isImageFile(filename) {
  const lower = filename.toLowerCase();
  return imageExtensions.some(ext => lower.endsWith(ext));
}

function updateStatus() {
  if (imageFiles.length === 0) {
    statusText.textContent = "画像がありません";
    return;
  }
  statusText.textContent = `${currentIndex + 1} / ${imageFiles.length} : ${imageFiles[currentIndex].name}`;
}

function clearViewer() {
  for (const url of imageURLs) {
    URL.revokeObjectURL(url);
  }
  imageFiles = [];
  imageURLs = [];
  currentIndex = 0;
  thumbbar.innerHTML = "";
  mainImage.style.display = "none";
  emptyMessage.style.display = "block";
  statusText.textContent = "フォルダを選んでください";
}

function applyImageMode() {
  if (currentMode === "fit") {
    mainImage.classList.remove("fill-mode");
    mainImage.style.objectFit = "contain";
  } else {
    mainImage.classList.add("fill-mode");
    mainImage.style.objectFit = "cover";
  }
}

function showImage(index) {
  if (imageURLs.length === 0) return;

  if (index < 0) index = imageURLs.length - 1;
  if (index >= imageURLs.length) index = 0;
  currentIndex = index;

  mainImage.src = imageURLs[currentIndex];
  mainImage.style.display = "block";
  emptyMessage.style.display = "none";

  document.querySelectorAll(".thumb").forEach((thumb, i) => {
    thumb.classList.toggle("active", i === currentIndex);
  });

  const activeThumb = document.querySelector(`.thumb[data-index="${currentIndex}"]`);
  if (activeThumb) {
    activeThumb.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest"
    });
  }

  updateStatus();
}

function renderThumbnails() {
  thumbbar.innerHTML = "";

  imageURLs.forEach((url, index) => {
    const thumb = document.createElement("div");
    thumb.className = "thumb";
    thumb.dataset.index = index;

    const img = document.createElement("img");
    img.src = url;
    img.alt = imageFiles[index].name;

    thumb.appendChild(img);
    thumb.addEventListener("click", () => showImage(index));

    thumbbar.appendChild(thumb);
  });
}

async function pickFolder() {
  if (!window.showDirectoryPicker) {
    alert("このブラウザはフォルダ選択APIに未対応です。MacのChromeまたはEdgeで試してください。");
    return;
  }

  clearViewer();

  try {
    const dirHandle = await window.showDirectoryPicker();

    for await (const entry of dirHandle.values()) {
      if (entry.kind === "file" && isImageFile(entry.name)) {
        const file = await entry.getFile();
        imageFiles.push(file);
      }
    }

    imageFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    if (imageFiles.length === 0) {
      statusText.textContent = "このフォルダには画像がありません";
      return;
    }

    imageURLs = imageFiles.map(file => URL.createObjectURL(file));

    renderThumbnails();
    applyImageMode();
    showImage(0);
  } catch (error) {
    console.error(error);
    statusText.textContent = "フォルダ選択がキャンセルされたか、読み込みに失敗しました";
  }
}

function nextImage() {
  showImage(currentIndex + 1);
}

function prevImage() {
  showImage(currentIndex - 1);
}

pickFolderBtn.addEventListener("click", pickFolder);
nextBtn.addEventListener("click", nextImage);
prevBtn.addEventListener("click", prevImage);

fitBtn.addEventListener("click", () => {
  currentMode = "fit";
  applyImageMode();
});

fillBtn.addEventListener("click", () => {
  currentMode = "fill";
  applyImageMode();
});

document.addEventListener("keydown", (e) => {
  if (imageURLs.length === 0) return;

  if (e.key === "ArrowRight") nextImage();
  if (e.key === "ArrowLeft") prevImage();
});

document.addEventListener("wheel", (e) => {
  if (imageURLs.length === 0) return;

  e.preventDefault();
  if (e.deltaY > 0) {
    nextImage();
  } else {
    prevImage();
  }
}, { passive: false });

// タッチスワイプ
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener("touchstart", (e) => {
  if (e.touches.length > 0) {
    touchStartX = e.touches[0].clientX;
  }
}, { passive: true });

document.addEventListener("touchend", (e) => {
  if (e.changedTouches.length > 0) {
    touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX;

    if (Math.abs(diff) > 50) {
      if (diff < 0) {
        nextImage();
      } else {
        prevImage();
      }
    }
  }
}, { passive: true });

applyImageMode();

const fileInput = document.getElementById("fileInput");

fileInput.addEventListener("change", (event) => {
  clearViewer();

  const files = Array.from(event.target.files);

  imageFiles = files.filter(file =>
    file.type.startsWith("image/")
  );

  imageFiles.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true })
  );

  if (imageFiles.length === 0) {
    statusText.textContent = "画像が選択されていません";
    return;
  }

  imageURLs = imageFiles.map(file =>
    URL.createObjectURL(file)
  );

  renderThumbnails();
  applyImageMode();
  showImage(0);
});

let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 50;

const defaultFilters = {
  brightness: { value: 100, min: 0, max: 200, unit: "%" },
  contrast: { value: 100, min: 0, max: 200, unit: "%" },
  saturation: { value: 100, min: 0, max: 200, unit: "%" },
  hueRotation: { value: 0, min: 0, max: 360, unit: "deg" },
  blur: { value: 0, min: 0, max: 20, unit: "px" },
  grayscale: { value: 0, min: 0, max: 100, unit: "%" },
  sepia: { value: 0, min: 0, max: 100, unit: "%" },
  opacity: { value: 100, min: 0, max: 100, unit: "%" },
  invert: { value: 0, min: 0, max: 100, unit: "%" },
};

let filters = JSON.parse(JSON.stringify(defaultFilters));

// PRESETS
const presets = {
  normal: {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hueRotation: 0,
    blur: 0,
    grayscale: 0,
    sepia: 0,
    opacity: 100,
    invert: 0,
  },
  vintage: {
    brightness: 110,
    contrast: 90,
    saturation: 80,
    hueRotation: 10,
    blur: 0,
    grayscale: 10,
    sepia: 40,
    opacity: 100,
    invert: 0,
  },
  blackAndWhite: {
    brightness: 105,
    contrast: 120,
    saturation: 0,
    hueRotation: 0,
    blur: 0,
    grayscale: 100,
    sepia: 0,
    opacity: 100,
    invert: 0,
  },
  warm: {
    brightness: 110,
    contrast: 105,
    saturation: 120,
    hueRotation: 15,
    blur: 0,
    grayscale: 0,
    sepia: 20,
    opacity: 100,
    invert: 0,
  },
  cool: {
    brightness: 100,
    contrast: 110,
    saturation: 110,
    hueRotation: 200,
    blur: 0,
    grayscale: 0,
    sepia: 0,
    opacity: 100,
    invert: 0,
  },
  dramatic: {
    brightness: 95,
    contrast: 140,
    saturation: 130,
    hueRotation: 0,
    blur: 0,
    grayscale: 0,
    sepia: 0,
    opacity: 100,
    invert: 0,
  },
  faded: {
    brightness: 115,
    contrast: 80,
    saturation: 85,
    hueRotation: 0,
    blur: 0,
    grayscale: 5,
    sepia: 10,
    opacity: 100,
    invert: 0,
  },
  blurFocus: {
    brightness: 100,
    contrast: 100,
    saturation: 110,
    hueRotation: 0,
    blur: 3,
    grayscale: 0,
    sepia: 0,
    opacity: 100,
    invert: 0,
  },
  inverted: {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hueRotation: 0,
    blur: 0,
    grayscale: 0,
    sepia: 0,
    opacity: 100,
    invert: 100,
  },
};

// DOM ELEMENTS
const filtersContainer = document.querySelector(".filters");
const imageCanvas = document.querySelector("#image-canvas");
const imgInput = document.querySelector("#image-input");
const canvasCtx = imageCanvas.getContext("2d");
const resetButton = document.querySelector("#reset-btn");
const downloadButton = document.querySelector("#download-btn");
const presetsContainer = document.querySelector(".presets");

let image = null;

function formatLabel(name) {
  return (
    name
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (char) => char.toUpperCase())
  );
}



// FILTER UI
function createFilterElement(name, unit, value, min, max) {
  const div = document.createElement("div");
  div.classList.add("filter");

  const p = document.createElement("p");

  p.innerText = formatLabel(name);

  const valueSpan = document.createElement("span");
  valueSpan.innerText = `${value}${unit}`;
  p.appendChild(valueSpan);

  const input = document.createElement("input");
  input.type = "range";
  input.min = min;
  input.max = max;
  input.value = value;

  const resetBtn = document.createElement("button");
  resetBtn.classList.add("btn");
  resetBtn.innerText = "Reset";

  resetBtn.onclick = () => {
    if (!image) return;
    saveState();
    filters[name].value = defaultFilters[name].value;
    createFilters();
    applyFilters();
  };

  input.onmousedown = () => image && saveState();
  input.oninput = () => {
    filters[name].value = input.value;
    valueSpan.innerText = `${input.value}${unit}`;
    applyFilters();
  };

  div.append(p, input, resetBtn);
  return div;
}

function createFilters() {
  filtersContainer.innerHTML = "";
  Object.keys(filters).forEach((k) =>
    filtersContainer.appendChild(
      createFilterElement(
        k,
        filters[k].unit,
        filters[k].value,
        filters[k].min,
        filters[k].max
      )
    )
  );
}

// CONFIG
const MOBILE_MAX_WIDTH = 440; 
const MOBILE_MAX_HEIGHT = 500; 

const isMobile = () => window.matchMedia("(max-width: 900px)").matches;

// IMAGE LOAD
imgInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  document.querySelector(".placeholder").style.display = "none";
  imageCanvas.style.display = "block";

  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = () => {
    image = img;

    if (!isMobile()) {
      imageCanvas.width = img.width;
      imageCanvas.height = img.height;

      canvasCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
      canvasCtx.drawImage(img, 0, 0);
    }

    else {
      const canvasW = MOBILE_MAX_WIDTH;
      const canvasH = MOBILE_MAX_HEIGHT;

      imageCanvas.width = canvasW;
      imageCanvas.height = canvasH;


      canvasCtx.clearRect(0, 0, canvasW, canvasH);

      const scale = Math.min(canvasW / img.width, canvasH / img.height);

      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;

      const offsetX = (canvasW - drawWidth) / 2;
      const offsetY = (canvasH - drawHeight) / 2;


      mobileDraw = { offsetX, offsetY, drawWidth, drawHeight };
      canvasCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }

    undoStack = [];
    redoStack = [];
    saveState();
    setControlsEnabled(true);

    const hint = document.querySelector(".preset-hint");
    if (hint) hint.style.display = "none";

    presetsContainer.innerHTML = "";
    Object.keys(presets).forEach((name) => {
      const btn = document.createElement("button");
      btn.className = "btn";
      btn.innerText = formatLabel(name);
      btn.prepend(createPresetThumbnail(presets[name]));
      btn.onclick = () => {
        saveState();
        Object.assign(filters, JSON.parse(JSON.stringify(defaultFilters)));
        Object.keys(presets[name]).forEach(
          (k) => (filters[k].value = presets[name][k])
        );
        createFilters();
        applyFilters();
      };
      presetsContainer.appendChild(btn);
    });
  };
});

// APPLY FILTERS
function applyFilters() {
  if (!image) return;

  canvasCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);

  canvasCtx.filter = `
    brightness(${filters.brightness.value}%)
    contrast(${filters.contrast.value}%)
    saturate(${filters.saturation.value}%)
    hue-rotate(${filters.hueRotation.value}deg)
    blur(${filters.blur.value}px)
    grayscale(${filters.grayscale.value}%)
    sepia(${filters.sepia.value}%)
    opacity(${filters.opacity.value}%)
    invert(${filters.invert.value}%)
  `;


  if (!isMobile()) {
    canvasCtx.drawImage(image, 0, 0);
  }

  else if (mobileDraw) {
    const { offsetX, offsetY, drawWidth, drawHeight } = mobileDraw;
    canvasCtx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  }
}

resetButton.onclick = () => {
  if (!image) return;
  saveState();
  filters = JSON.parse(JSON.stringify(defaultFilters));
  createFilters();
  applyFilters();
};

downloadButton.onclick = () => {
  const a = document.createElement("a");
  a.download = "edited-image.png";
  a.href = imageCanvas.toDataURL();
  a.click();

  const modal = document.getElementById("download-modal");
  modal.style.display = "grid";

  setTimeout(() => {
    modal.style.display = "none";
  }, 1500);
};

// UNDO / REDO
function saveState() {
  const state = JSON.stringify(filters);
  if (undoStack.at(-1) !== state) undoStack.push(state);
  redoStack = [];
}

function undo() {
  if (undoStack.length <= 1) return;
  redoStack.push(undoStack.pop());
  filters = JSON.parse(undoStack.at(-1));
  createFilters();
  applyFilters();
}

function redo() {
  if (!redoStack.length) return;
  const s = redoStack.pop();
  undoStack.push(s);
  filters = JSON.parse(s);
  createFilters();
  applyFilters();
}

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "z") undo();
  if ((e.ctrlKey || e.metaKey) && e.key === "y") redo();
});

function drawImageCover(ctx, img, cw, ch) {
  const iw = img.width;
  const ih = img.height;
  if (!iw || !ih) {
    ctx.clearRect(0, 0, cw, ch);
    return;
  }

  const scale = Math.max(cw / iw, ch / ih);
  const sw = cw / scale;
  const sh = ch / scale;
  const sx = Math.max(0, (iw - sw) / 2);
  const sy = Math.max(0, (ih - sh) / 2);

  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
}

function createPresetThumbnail(preset) {
  const c = document.createElement("canvas");
  c.width = 100;
  c.height = 64;
  const ctx = c.getContext("2d");
  ctx.filter = `
    brightness(${preset.brightness}%)
    contrast(${preset.contrast}%)
    saturate(${preset.saturation}%)
    hue-rotate(${preset.hueRotation}deg)
    blur(${preset.blur}px)
    grayscale(${preset.grayscale}%)
    sepia(${preset.sepia}%)
    opacity(${preset.opacity}%)
    invert(${preset.invert}%)
  `;

  if (image) drawImageCover(ctx, image, c.width, c.height);

  c.style.width = "64px";
  c.style.height = "48px";
  c.style.display = "block";

  return c;
}

// INIT
createFilters();
setControlsEnabled(false);

// DRAG & DROP
const dropZone = document.querySelector(".bottom");
dropZone.ondragover = (e) => e.preventDefault();
dropZone.ondrop = (e) => {
  e.preventDefault();
  imgInput.files = e.dataTransfer.files;
  imgInput.dispatchEvent(new Event("change"));
};

function setControlsEnabled(enabled) {
  document
    .querySelectorAll(
      ".filters input, .filters button, #reset-btn, #download-btn, .presets button"
    )
    .forEach((el) => (el.disabled = !enabled));
}

if (isMobile()) {
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  const sheet = document.querySelector(".right");
  const handle = document.querySelector(".drag-handle");

  let startY = 0;
  let startHeight = 0;
  let dragging = false;

  const DESIRED_COLLAPSED_HEIGHT = 295; 
  const MIN_SAFE_HEIGHT = 240; 
  const MAX_COLLAPSED_RATIO = 0.35; 

  const MIN_HEIGHT = clamp(
    DESIRED_COLLAPSED_HEIGHT,
    MIN_SAFE_HEIGHT,
    window.innerHeight * MAX_COLLAPSED_RATIO
  );

  const MAX_HEIGHT = window.innerHeight * 0.85;

  if (isMobile()) {
    sheet.style.height = `${MIN_HEIGHT}px`;
  }

  handle.addEventListener("touchstart", (e) => {
    dragging = true;
    startY = e.touches[0].clientY;
    startHeight = sheet.offsetHeight;
    sheet.style.transition = "none";
  });

  handle.addEventListener("touchmove", (e) => {
    if (!dragging) return;

    const currentY = e.touches[0].clientY;
    const delta = startY - currentY; 
    let newHeight = startHeight + delta;

    newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, newHeight));
    sheet.style.height = `${newHeight}px`;
  });

  handle.addEventListener("touchend", () => {
    dragging = false;
    sheet.style.transition = "height 0.25s ease";

    const mid = (MIN_HEIGHT + MAX_HEIGHT) / 2;
    const currentHeight = sheet.offsetHeight;

    // snap
    sheet.style.height =
      currentHeight > mid ? `${MAX_HEIGHT}px` : `${MIN_HEIGHT}px`;
  });
}

if (!isMobile()) {
  const sheet = document.querySelector(".right");
  sheet.style.height = "";
}

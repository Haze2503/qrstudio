const state = {
  mode: "link",
  logoDataUrl: "",
  imageDataUrl: "",
  history: loadHistory(),
};

const elements = {
  tabs: [...document.querySelectorAll(".mode-tab")],
  panels: [...document.querySelectorAll(".mode-panel")],
  payloadLength: document.getElementById("payload-length"),
  statusText: document.getElementById("status-text"),
  modeLabel: document.getElementById("mode-label"),
  sizeLabel: document.getElementById("size-label"),
  capacityLabel: document.getElementById("capacity-label"),
  historyList: document.getElementById("history-list"),
  qrCanvas: document.getElementById("qr-canvas"),
  generateButton: document.getElementById("generate-button"),
  refreshButton: document.getElementById("refresh-button"),
  copyImageButton: document.getElementById("copy-image-button"),
  downloadPngButton: document.getElementById("download-png-button"),
  downloadSvgButton: document.getElementById("download-svg-button"),
  copyTextButton: document.getElementById("copy-text-button"),
  resetButton: document.getElementById("reset-button"),
  fillExampleButton: document.getElementById("fill-example"),
  clearHistoryButton: document.getElementById("clear-history"),
  clearLogoButton: document.getElementById("clear-logo"),
  linkInput: document.getElementById("link-input"),
  textInput: document.getElementById("text-input"),
  wifiSsid: document.getElementById("wifi-ssid"),
  wifiPassword: document.getElementById("wifi-password"),
  wifiSecurity: document.getElementById("wifi-security"),
  wifiHidden: document.getElementById("wifi-hidden"),
  contactName: document.getElementById("contact-name"),
  contactOrg: document.getElementById("contact-org"),
  contactPhone: document.getElementById("contact-phone"),
  contactEmail: document.getElementById("contact-email"),
  contactWebsite: document.getElementById("contact-website"),
  imageInput: document.getElementById("image-input"),
  imageLink: document.getElementById("image-link"),
  sizeInput: document.getElementById("size-input"),
  marginInput: document.getElementById("margin-input"),
  errorCorrection: document.getElementById("error-correction"),
  foregroundInput: document.getElementById("foreground-input"),
  backgroundInput: document.getElementById("background-input"),
  frameColor: document.getElementById("frame-color"),
  logoInput: document.getElementById("logo-input"),
  installButton: document.getElementById("install-button"),
};

const recentLimit = 8;
let deferredInstallPrompt = null;

function init() {
  bindModeTabs();
  bindInputs();
  bindInstallPrompt();
  registerServiceWorker();
  renderHistory();
  setActiveMode("link");
  populateExample(false);
  renderQr();
}

function bindModeTabs() {
  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => setActiveMode(tab.dataset.mode));
  });
}

function bindInputs() {
  const liveInputs = [
    elements.linkInput,
    elements.textInput,
    elements.wifiSsid,
    elements.wifiPassword,
    elements.wifiSecurity,
    elements.wifiHidden,
    elements.contactName,
    elements.contactOrg,
    elements.contactPhone,
    elements.contactEmail,
    elements.contactWebsite,
    elements.imageLink,
    elements.sizeInput,
    elements.marginInput,
    elements.errorCorrection,
    elements.foregroundInput,
    elements.backgroundInput,
    elements.frameColor,
  ];

  liveInputs.forEach((input) => {
    input.addEventListener("input", () => renderQr());
    input.addEventListener("change", () => renderQr());
  });

  elements.generateButton.addEventListener("click", () => renderQr(true));
  elements.refreshButton.addEventListener("click", () => renderQr(true));
  elements.copyImageButton.addEventListener("click", copyQrImage);
  elements.downloadPngButton.addEventListener("click", downloadPng);
  elements.downloadSvgButton.addEventListener("click", downloadSvg);
  elements.copyTextButton.addEventListener("click", copyPayloadText);
  elements.resetButton.addEventListener("click", resetForm);
  elements.fillExampleButton.addEventListener("click", populateExample);
  elements.clearHistoryButton.addEventListener("click", clearHistory);
  elements.clearLogoButton.addEventListener("click", clearLogo);

  elements.imageInput.addEventListener("change", handleImageFile);
  elements.logoInput.addEventListener("change", handleLogoFile);
}

function bindInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    elements.installButton.classList.remove("hidden");
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    elements.installButton.classList.add("hidden");
    setStatus("Installed", "The app is now installed on this device.");
  });

  elements.installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
      return;
    }

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    elements.installButton.classList.add("hidden");
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  });
}

function setActiveMode(mode) {
  state.mode = mode;
  elements.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  elements.panels.forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === mode));
  elements.modeLabel.textContent = formatMode(mode);
  renderQr();
}

function formatMode(mode) {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function readPayload() {
  switch (state.mode) {
    case "link":
      return elements.linkInput.value.trim();
    case "text":
      return elements.textInput.value;
    case "wifi":
      return buildWifiPayload();
    case "contact":
      return buildContactPayload();
    case "image":
      return buildImagePayload();
    default:
      return "";
  }
}

function buildWifiPayload() {
  const ssid = escapeQrValue(elements.wifiSsid.value.trim());
  const password = escapeQrValue(elements.wifiPassword.value);
  const hidden = elements.wifiHidden.checked ? "true" : "false";
  const security = elements.wifiSecurity.value;
  const type = security === "nopass" ? "nopass" : security;
  return `WIFI:T:${type};S:${ssid};P:${password};H:${hidden};;`;
}

function buildContactPayload() {
  const name = elements.contactName.value.trim();
  const organization = elements.contactOrg.value.trim();
  const phone = elements.contactPhone.value.trim();
  const email = elements.contactEmail.value.trim();
  const website = elements.contactWebsite.value.trim();
  const nameParts = name.split(/\s+/).filter(Boolean);
  const lastName = escapeVCardValue(nameParts.pop() || "");
  const firstName = escapeVCardValue(nameParts.join(" "));

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${lastName};${firstName};;;`,
    `FN:${escapeVCardValue(name)}`,
  ];

  if (organization) {
    lines.push(`ORG:${escapeVCardValue(organization)}`);
  }

  if (phone) {
    lines.push(`TEL;TYPE=CELL:${escapeVCardValue(phone)}`);
  }

  if (email) {
    lines.push(`EMAIL:${escapeVCardValue(email)}`);
  }

  if (website) {
    lines.push(`URL:${escapeVCardValue(website)}`);
  }

  lines.push("END:VCARD");
  return lines.join("\n");
}

function buildImagePayload() {
  const fromFile = elements.imageInput.files?.[0];
  if (fromFile) {
    return state.imageDataUrl || "";
  }

  return elements.imageLink.value.trim();
}

function escapeQrValue(value) {
  return value.replace(/([\\;,:,])/g, "\\$1");
}

function escapeVCardValue(value) {
  return value.replace(/([\\;,])/g, "\\$1").replace(/\n/g, "\\n");
}

function getConfig() {
  return {
    width: Number(elements.sizeInput.value),
    margin: Number(elements.marginInput.value),
    errorCorrectionLevel: elements.errorCorrection.value,
    color: {
      dark: elements.foregroundInput.value,
      light: elements.backgroundInput.value,
    },
  };
}

async function renderQr(saveToHistory = false) {
  const payload = readPayload();
  const bytes = payload ? new TextEncoder().encode(payload).length : 0;
  elements.payloadLength.textContent = `${payload.length} characters`;
  elements.sizeLabel.textContent = `${bytes} bytes`;
  elements.modeLabel.textContent = formatMode(state.mode);

  if (!payload) {
    setStatus("Waiting for input", "Add content to generate a code.");
    drawEmptyCanvas();
    elements.capacityLabel.textContent = "Waiting for input";
    return;
  }

  try {
    const qr = buildQrCode(payload);
    const svg = buildColoredSvg(qr);
    await drawSvgToCanvas(svg);
    await applyLogoOverlay();
    setStatus("Ready", `Generated ${formatMode(state.mode)} QR successfully.`);
    elements.capacityLabel.textContent = bytes > 1000 ? "Large payload" : "Within safe range";

    if (saveToHistory) {
      addToHistory(payload);
    }
  } catch (error) {
    console.error(error);
    drawErrorCanvas();
    const message = error?.message || String(error);
    setStatus("Needs attention", message.includes("overflow") ? "Payload is too large for the selected settings." : "The QR could not be generated.");
    elements.capacityLabel.textContent = "Reduce size or shorten content";
  }
}

function buildQrCode(payload) {
  const qr = qrcode(0, elements.errorCorrection.value);
  qr.addData(payload, state.mode === "text" ? "Byte" : "Byte");
  qr.make();
  return qr;
}

function buildColoredSvg(qr) {
  const size = Number(elements.sizeInput.value);
  const cellSize = Math.max(4, Math.floor(size / (qr.getModuleCount() + 8)));
  const margin = Number(elements.marginInput.value) * cellSize;
  const svg = qr.createSvgTag({
    cellSize,
    margin,
    scalable: true,
    alt: "QR code preview",
    title: "Proper QR Studio preview",
  });

  return svg
    .replace('fill="white"', `fill="${elements.backgroundInput.value}"`)
    .replace('fill="black"', `fill="${elements.foregroundInput.value}"`);
}

async function drawSvgToCanvas(svgText) {
  const size = Number(elements.sizeInput.value);
  const ctx = elements.qrCanvas.getContext("2d");
  const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`);

  elements.qrCanvas.width = size;
  elements.qrCanvas.height = size;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = elements.backgroundInput.value;
  ctx.fillRect(0, 0, size, size);

  const scale = Math.min(size / image.width, size / image.height);
  const drawWidth = Math.round(image.width * scale);
  const drawHeight = Math.round(image.height * scale);
  const x = Math.round((size - drawWidth) / 2);
  const y = Math.round((size - drawHeight) / 2);
  ctx.drawImage(image, x, y, drawWidth, drawHeight);
}

function setStatus(headline, detail) {
  elements.statusText.textContent = headline;
  elements.statusText.title = detail;
}

function drawEmptyCanvas() {
  const ctx = elements.qrCanvas.getContext("2d");
  const size = Number(elements.sizeInput.value);
  elements.qrCanvas.width = size;
  elements.qrCanvas.height = size;
  ctx.fillStyle = elements.backgroundInput.value;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = elements.frameColor.value;
  ctx.lineWidth = Math.max(4, size * 0.01);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, size - ctx.lineWidth, size - ctx.lineWidth);
  ctx.fillStyle = "rgba(16,24,39,0.28)";
  ctx.textAlign = "center";
  ctx.font = `${Math.max(20, size * 0.05)}px Space Grotesk`;
  ctx.fillText("Your QR preview will appear here", size / 2, size / 2);
}

function drawErrorCanvas() {
  const ctx = elements.qrCanvas.getContext("2d");
  const size = Number(elements.sizeInput.value);
  elements.qrCanvas.width = size;
  elements.qrCanvas.height = size;
  ctx.fillStyle = elements.backgroundInput.value;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = elements.foregroundInput.value;
  ctx.textAlign = "center";
  ctx.font = `${Math.max(20, size * 0.045)}px Space Grotesk`;
  ctx.fillText("QR generation failed", size / 2, size / 2 - 8);
  ctx.font = `${Math.max(14, size * 0.028)}px Manrope`;
  ctx.fillStyle = "rgba(16,24,39,0.68)";
  ctx.fillText("Shorten the payload or lower logo use.", size / 2, size / 2 + 28);
}

async function applyLogoOverlay() {
  if (!state.logoDataUrl) {
    return;
  }

  const ctx = elements.qrCanvas.getContext("2d");
  const size = elements.qrCanvas.width;
  const image = await loadImage(state.logoDataUrl);
  const logoSize = Math.max(52, Math.round(size * 0.18));
  const x = Math.round((size - logoSize) / 2);
  const y = Math.round((size - logoSize) / 2);
  const radius = Math.max(12, Math.round(logoSize * 0.22));

  ctx.save();
  roundRect(ctx, x - 8, y - 8, logoSize + 16, logoSize + 16, radius + 8);
  ctx.fillStyle = elements.backgroundInput.value;
  ctx.fill();
  ctx.shadowColor = "rgba(15, 23, 42, 0.18)";
  ctx.shadowBlur = 18;
  ctx.fill();
  ctx.shadowBlur = 0;
  clipRoundRect(ctx, x, y, logoSize, logoSize, radius);
  ctx.drawImage(image, x, y, logoSize, logoSize);
  ctx.restore();
}

function clipRoundRect(ctx, x, y, width, height, radius) {
  roundRect(ctx, x, y, width, height, radius);
  ctx.clip();
}

function roundRect(ctx, x, y, width, height, radius) {
  const corner = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + corner, y);
  ctx.arcTo(x + width, y, x + width, y + height, corner);
  ctx.arcTo(x + width, y + height, x, y + height, corner);
  ctx.arcTo(x, y + height, x, y, corner);
  ctx.arcTo(x, y, x + width, y, corner);
  ctx.closePath();
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function handleImageFile(event) {
  const file = event.target.files?.[0];
  if (!file) {
    state.imageDataUrl = "";
    renderQr();
    return;
  }

  const dataUrl = await readFileAsDataUrl(file);
  state.imageDataUrl = dataUrl;
  elements.imageLink.value = dataUrl;
  elements.statusText.textContent = "Image loaded";
  renderQr(true);
}

async function handleLogoFile(event) {
  const file = event.target.files?.[0];
  if (!file) {
    state.logoDataUrl = "";
    renderQr();
    return;
  }

  state.logoDataUrl = await readFileAsDataUrl(file);
  renderQr();
}

function clearLogo() {
  state.logoDataUrl = "";
  elements.logoInput.value = "";
  renderQr();
}

async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function resetForm() {
  elements.linkInput.value = "";
  elements.textInput.value = "";
  elements.wifiSsid.value = "";
  elements.wifiPassword.value = "";
  elements.wifiSecurity.value = "WPA";
  elements.wifiHidden.checked = false;
  elements.contactName.value = "";
  elements.contactOrg.value = "";
  elements.contactPhone.value = "";
  elements.contactEmail.value = "";
  elements.contactWebsite.value = "";
  elements.imageInput.value = "";
  elements.imageLink.value = "";
  state.imageDataUrl = "";
  clearLogo();
  setStatus("Ready", "Form cleared.");
  renderQr();
}

function populateExample(saveToHistory = false) {
  if (state.mode === "link") {
    elements.linkInput.value = "https://example.com";
  } else if (state.mode === "text") {
    elements.textInput.value = "Meet me at 7pm near the north entrance.";
  } else if (state.mode === "wifi") {
    elements.wifiSsid.value = "Studio Guest";
    elements.wifiPassword.value = "guest-access-2026";
    elements.wifiSecurity.value = "WPA";
    elements.wifiHidden.checked = false;
  } else if (state.mode === "contact") {
    elements.contactName.value = "Avery Stone";
    elements.contactOrg.value = "Proper Studio";
    elements.contactPhone.value = "+1 555 012 3456";
    elements.contactEmail.value = "avery@example.com";
    elements.contactWebsite.value = "https://properstudio.dev";
  } else {
    elements.imageLink.value = "https://images.example.com/sample.png";
  }
  renderQr(saveToHistory);
}

async function copyPayloadText() {
  const payload = readPayload();
  if (!payload) {
    setStatus("Nothing to copy", "Generate a payload first.");
    return;
  }

  await navigator.clipboard.writeText(payload);
  setStatus("Copied", "Payload text copied to clipboard.");
}

async function copyQrImage() {
  try {
    const blob = await canvasToBlob(elements.qrCanvas, "image/png");
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    setStatus("Copied", "PNG copied to clipboard.");
  } catch (error) {
    console.error(error);
    setStatus("Clipboard blocked", "Your browser may not allow image clipboard writes. Use Save PNG instead.");
  }
}

async function downloadPng() {
  const payload = readPayload();
  if (!payload) {
    setStatus("Nothing to save", "Add content before exporting.");
    return;
  }

  const blob = await canvasToBlob(elements.qrCanvas, "image/png");
  triggerDownload(blob, `${buildFileName()}.png`);
  setStatus("Saved", "PNG file downloaded.");
}

async function downloadSvg() {
  const payload = readPayload();
  if (!payload) {
    setStatus("Nothing to save", "Add content before exporting.");
    return;
  }

  const qr = buildQrCode(payload);
  const svg = buildColoredSvg(qr);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  triggerDownload(blob, `${buildFileName()}.svg`);
  setStatus("Saved", "SVG file downloaded.");
}

function buildFileName() {
  return `proper-qr-${state.mode}-${Date.now()}`;
}

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function canvasToBlob(canvas, mimeType) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Could not export image"));
      }
    }, mimeType);
  });
}

function addToHistory(payload) {
  const summary = buildSummary(payload);
  const entry = {
    mode: state.mode,
    payload,
    summary,
    savedAt: new Date().toISOString(),
  };

  state.history = [entry, ...state.history.filter((item) => item.payload !== payload)].slice(0, recentLimit);
  persistHistory();
  renderHistory();
}

function buildSummary(payload) {
  if (state.mode === "link") return payload.slice(0, 42) || "Link";
  if (state.mode === "text") return payload.slice(0, 42) || "Text";
  if (state.mode === "wifi") return `Wi-Fi: ${elements.wifiSsid.value.trim() || "network"}`;
  if (state.mode === "contact") return `Contact: ${elements.contactName.value.trim() || "card"}`;
  return `Image payload (${payload.length} chars)`;
}

function renderHistory() {
  if (!state.history.length) {
    elements.historyList.innerHTML = `<div class="history-item"><strong>No saved payloads yet.</strong><span>Generate a QR and it will appear here.</span></div>`;
    return;
  }

  elements.historyList.innerHTML = state.history
    .map(
      (entry, index) => `
        <button class="history-item" data-index="${index}" type="button">
          <strong>${escapeHtml(entry.summary)}</strong>
          <span>${formatMode(entry.mode)} · ${formatTime(entry.savedAt)}</span>
        </button>`
    )
    .join("");

  elements.historyList.querySelectorAll("[data-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const entry = state.history[Number(button.dataset.index)];
      restoreHistoryEntry(entry);
    });
  });
}

function restoreHistoryEntry(entry) {
  setActiveMode(entry.mode);
  if (entry.mode === "link") elements.linkInput.value = entry.payload;
  if (entry.mode === "text") elements.textInput.value = entry.payload;
  if (entry.mode === "wifi") {
    const parts = parseWifiPayload(entry.payload);
    elements.wifiSsid.value = parts.ssid;
    elements.wifiPassword.value = parts.password;
    elements.wifiSecurity.value = parts.security;
    elements.wifiHidden.checked = parts.hidden;
  }
  if (entry.mode === "contact") {
    elements.contactName.value = entry.payload.includes("FN:") ? extractVCardField(entry.payload, "FN") : elements.contactName.value;
    elements.contactOrg.value = extractVCardField(entry.payload, "ORG");
    elements.contactPhone.value = extractVCardField(entry.payload, "TEL");
    elements.contactEmail.value = extractVCardField(entry.payload, "EMAIL");
    elements.contactWebsite.value = extractVCardField(entry.payload, "URL");
  }
  if (entry.mode === "image") elements.imageLink.value = entry.payload;
  renderQr();
}

function parseWifiPayload(payload) {
  const match = payload.match(/^WIFI:T:([^;]*);S:([^;]*);P:([^;]*);H:([^;]*);;$/);
  if (!match) {
    return { security: "WPA", ssid: "", password: "", hidden: false };
  }

  return {
    security: match[1] === "nopass" ? "nopass" : match[1],
    ssid: unescapeQrValue(match[2]),
    password: unescapeQrValue(match[3]),
    hidden: match[4] === "true",
  };
}

function extractVCardField(payload, key) {
  const match = payload.match(new RegExp(`^${key}:(.*)$`, "m"));
  if (!match) {
    return "";
  }
  return match[1].replace(/\\n/g, "\n").replace(/\\([\\;,])/g, "$1");
}

function unescapeQrValue(value) {
  return value.replace(/\\([\\;:,])/g, "$1");
}

function clearHistory() {
  state.history = [];
  persistHistory();
  renderHistory();
}

function persistHistory() {
  localStorage.setItem("proper-qr-history", JSON.stringify(state.history));
}

function loadHistory() {
  try {
    const raw = localStorage.getItem("proper-qr-history");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function formatTime(iso) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

init();

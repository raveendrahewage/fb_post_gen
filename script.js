const $ = id => document.getElementById(id);

// Core Elements
const text = $("text");
const preview = $("preview");
const post = $("post");
const font = $("font");
const alignment = $("alignment");
const size = $("size");
const line = $("line");
const red = $("red");
const black = $("black");
const bg = $("bg");
const postSize = $("postSize");
const customSize = $("customSize");
const customWidth = $("customWidth");
const customHeight = $("customHeight");
const watermarkEnabled = $("watermarkEnabled");
const watermarkText = $("watermarkText");
const watermarkPosition = $("watermarkPosition");
const watermarkSize = $("watermarkSize");
const watermarkOpacity = $("watermarkOpacity");
const watermark = $("watermark");

// Enhanced Elements
const charCount = $("charCount");
const templateSelect = $("templateSelect");
const bgImageInput = $("bgImageInput");
const bgImageName = $("bgImageName");
const removeBgImage = $("removeBgImage");
const photoControls = $("photoControls");
const bgOverlay = $("bgOverlay");
const bgBlur = $("bgBlur");
const postBgLayer = $("postBgLayer");
const postOverlayLayer = $("postOverlayLayer");

// Branding Elements
const brandingEnabled = $("brandingEnabled");
const brandingFields = $("brandingFields");
const brandNameInput = $("brandNameInput");
const brandHandleInput = $("brandHandleInput");
const brandAvatarInput = $("brandAvatarInput");
const brandAvatarThumb = $("brandAvatarThumb");
const removeBrandAvatar = $("removeBrandAvatar");
const brandTextColor = $("brandTextColor");
const brandVerified = $("brandVerified");
const brandPositionBottom = $("brandPositionBottom");
const branding = $("branding");
const brandingAvatar = $("brandingAvatar");
const brandingName = $("brandingName");
const brandingBadge = $("brandingBadge");
const brandingHandle = $("brandingHandle");

// Action & Draft Elements
const copyCaption = $("copyCaption");
const copyImage = $("copyImage");
const download = $("download");
const saveDraftBtn = $("saveDraftBtn");
const draftsSelect = $("draftsSelect");

// Mobile Elements
const mobileTabEditor = $("mobileTabEditor");
const mobileTabPreview = $("mobileTabPreview");
const mobileSaveBtn = $("mobileSaveBtn");

// Save Modal Elements
const saveModal = $("saveModal");
const modalBackdrop = $("modalBackdrop");
const modalClose = $("modalClose");
const modalImage = $("modalImage");
const modalDownloadBtn = $("modalDownloadBtn");
const modalCopyBtn = $("modalCopyBtn");
const modalDoneBtn = $("modalDoneBtn");
const iosTip = $("iosTip");
const toast = $("toast");

let actualFontSize = Number(size.value);
let currentGradient = "none";
let bgImageData = null;
let bgImageObj = null;
let brandAvatarData = null;
let lastGeneratedBlob = null;

const fontMap = {
  "noto-sans": '"Noto Sans Sinhala", "Noto Sans", Arial, sans-serif',
  "noto-serif": '"Noto Serif Sinhala", "Noto Serif", Georgia, serif',
  "abhaya": '"Abhaya Libre", "Noto Sans Sinhala", serif',
  "maname": '"Maname", "Noto Sans Sinhala", sans-serif',
  "poppins": '"Poppins", "Noto Sans Sinhala", sans-serif',
  "roboto": '"Roboto", "Noto Sans Sinhala", sans-serif',
  "inter": '"Inter", "Noto Sans Sinhala", sans-serif'
};

const gradientCSS = {
  none: "",
  sunset: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  ocean: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
  dark: "linear-gradient(135deg, #141e30 0%, #243b55 100%)",
  crimson: "linear-gradient(135deg, #870000 0%, #190a05 100%)",
  emerald: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  midnight: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)"
};

function getFontFamily() {
  return fontMap[font.value] || fontMap["noto-sans"];
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const NAMED_COLORS = {
  red: "#ff0000", green: "#008000", blue: "#0000ff",
  yellow: "#ffff00", orange: "#ffa500", purple: "#800080",
  pink: "#ffc0cb", black: "#000000", white: "#ffffff",
  gray: "#808080", grey: "#808080", brown: "#a52a2a",
  cyan: "#00ffff", magenta: "#ff00ff", lime: "#00ff00",
  navy: "#000080", teal: "#008080", maroon: "#800000",
  olive: "#808000", silver: "#c0c0c0"
};

function normalizeColor(value) {
  const v = String(value || "").trim();
  if (!v) return null;

  const lower = v.toLowerCase();
  if (NAMED_COLORS[lower]) return NAMED_COLORS[lower];

  // #RGB, #RGBA, #RRGGBB, #RRGGBBAA
  if (/^#[0-9a-f]{3,4}$/i.test(v) || /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v)) {
    return v;
  }

  // rgb()/rgba()/hsl()/hsla()
  if (/^(rgb|rgba|hsl|hsla|hwb|lab|lch|oklch|oklab|color)\(/i.test(v)) {
    return v;
  }

  return null;
}

function getTagColor(tag) {
  return normalizeColor(tag) || normalizeColor(red.value) || "#ff0000";
}

function getPostDimensions() {
  if (postSize.value === "custom") {
    return {
      width: Math.max(200, Math.min(5000, Number(customWidth.value) || 1080)),
      height: Math.max(200, Math.min(5000, Number(customHeight.value) || 1080))
    };
  }

  const [width, height] = postSize.value.split("x").map(Number);
  return { width, height };
}

function updateCustomVisibility() {
  customSize.classList.toggle("hidden", postSize.value !== "custom");
}

/*
 * Line Parser with Nested Tags Support
 */
function parseLine(lineText) {
  const baseStyle = {
    color: normalizeColor(black.value) || "#000000",
    bold: false,
    italic: false,
    underline: false
  };

  const stack = [baseStyle];
  const parts = [];
  const tokenRe = /\[\/([^\]]+)\]|\[([^\]]+)\]/gi;
  let last = 0;
  let match;

  function cloneStyle(s) {
    return {
      color: s.color,
      bold: s.bold,
      italic: s.italic,
      underline: s.underline
    };
  }

  function addText(value) {
    if (!value) return;
    const s = stack[stack.length - 1];
    parts.push({
      text: value,
      color: s.color,
      bold: s.bold,
      italic: s.italic,
      underline: s.underline
    });
  }

  while ((match = tokenRe.exec(lineText)) !== null) {
    addText(lineText.slice(last, match.index));

    if (match[2]) {
      const rawTag = match[2].trim();
      const tag = rawTag.toLowerCase();
      const next = cloneStyle(stack[stack.length - 1]);

      if (tag === "bold") {
        next.bold = true;
        stack.push(next);
      } else if (tag === "italic") {
        next.italic = true;
        stack.push(next);
      } else if (tag === "underline") {
        next.underline = true;
        stack.push(next);
      } else if (tag.startsWith("color=")) {
        next.color = getTagColor(rawTag.slice(rawTag.indexOf("=") + 1));
        stack.push(next);
      } else {
        next.color = getTagColor(rawTag);
        stack.push(next);
      }
    } else if (match[1]) {
      if (stack.length > 1) stack.pop();
    }

    last = tokenRe.lastIndex;
  }

  addText(lineText.slice(last));

  return parts.length
    ? parts
    : [{ text: "", color: normalizeColor(black.value) || "#000000", bold: false, italic: false, underline: false }];
}

function cssPreviewHTML() {
  if (!text.value.trim()) {
    return '<span class="line" style="opacity:0.4; font-weight:400; font-style:italic;">(Enter your post text here)</span>';
  }

  return text.value.split("\n").map(lineText => {
    const parts = parseLine(lineText);

    const html = parts.map(part => {
      let s = escapeHtml(part.text);
      if (part.bold) s = `<strong>${s}</strong>`;
      if (part.italic) s = `<em>${s}</em>`;
      if (part.underline) s = `<u>${s}</u>`;
      return `<span style="color:${escapeHtml(normalizeColor(part.color) || "#000000")}">${s}</span>`;
    }).join("");

    return `<span class="line">${html || "&nbsp;"}</span>`;
  }).join("");
}

function calculateAutoFontSize() {
  const maxSize = Number(size.value);
  const minSize = 12;

  const availableWidth = preview.clientWidth;
  const availableHeight = preview.clientHeight;

  if (!availableWidth || !availableHeight || !text.value.trim()) return maxSize;

  preview.style.fontSize = maxSize + "px";
  preview.style.lineHeight = line.value;

  if (preview.scrollWidth <= availableWidth + 1 &&
      preview.scrollHeight <= availableHeight + 1) {
    return maxSize;
  }

  let low = minSize;
  let high = maxSize;

  for (let i = 0; i < 14; i++) {
    const mid = (low + high) / 2;
    preview.style.fontSize = mid + "px";

    if (preview.scrollWidth <= availableWidth + 1 &&
        preview.scrollHeight <= availableHeight + 1) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return Math.floor(low * 10) / 10;
}

function isCurrentBgDark() {
  if (bgImageData) return Number(bgOverlay.value) >= 40;
  if (currentGradient !== "none") {
    return ["dark", "ocean", "midnight", "crimson"].includes(currentGradient);
  }
  const hex = normalizeColor(bg.value) || "#ffffff";
  if (hex.startsWith("#") && hex.length >= 7) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) < 140;
  }
  return false;
}

function updateWatermark() {
  const enabled = watermarkEnabled.checked && watermarkText.value.trim();
  watermark.textContent = enabled ? watermarkText.value.trim() : "";
  watermark.className = `watermark ${watermarkPosition.value}${enabled ? "" : " hidden"}`;
  watermark.style.fontSize = `${Number(watermarkSize.value)}px`;
  watermark.style.opacity = Number(watermarkOpacity.value) / 100;
  watermark.style.fontFamily = getFontFamily();

  // Watermark text color matches post background contrast
  const isDarkBg = isCurrentBgDark();
  watermark.style.color = isDarkBg ? "#ffffff" : "#111111";

  $("watermarkSizeOut").textContent = `${watermarkSize.value}px`;
  $("watermarkOpacityOut").textContent = `${watermarkOpacity.value}%`;
}

function updateBranding() {
  const isEnabled = brandingEnabled.checked;
  brandingFields.classList.toggle("hidden", !isEnabled);
  branding.classList.toggle("hidden", !isEnabled);

  if (!isEnabled) {
    post.classList.remove("has-branding-top", "has-branding-bottom");
    return;
  }

  const nameVal = brandNameInput.value.trim();
  const handleVal = brandHandleInput.value.trim();

  brandingName.textContent = nameVal || "Page Name";
  brandingHandle.textContent = handleVal;
  brandingHandle.classList.toggle("hidden", !handleVal);

  brandingBadge.classList.toggle("hidden", !brandVerified.checked);

  // Position at top or bottom
  const atBottom = brandPositionBottom.checked;
  branding.classList.toggle("at-bottom", atBottom);
  post.classList.toggle("has-branding-bottom", atBottom);
  post.classList.toggle("has-branding-top", !atBottom);

  // Avatar Logo
  if (brandAvatarData) {
    brandingAvatar.src = brandAvatarData;
    brandingAvatar.classList.remove("hidden");
    brandAvatarThumb.src = brandAvatarData;
    brandAvatarThumb.classList.remove("hidden");
    removeBrandAvatar.classList.remove("hidden");
  } else {
    brandingAvatar.src = "";
    brandingAvatar.classList.add("hidden");
    brandAvatarThumb.src = "";
    brandAvatarThumb.classList.add("hidden");
    removeBrandAvatar.classList.add("hidden");
  }

  // Branding Text Color
  if (brandTextColor.value === "auto") {
    branding.style.color = isCurrentBgDark() ? "#ffffff" : "#0f172a";
  } else {
    branding.style.color = brandTextColor.value;
  }

  branding.style.fontFamily = getFontFamily();
}

function updateBackgroundLayer() {
  $("bgOverlayOut").textContent = `${bgOverlay.value}%`;
  $("bgBlurOut").textContent = `${bgBlur.value}px`;

  if (bgImageData) {
    postBgLayer.style.backgroundImage = `url("${bgImageData}")`;
    postBgLayer.style.filter = `blur(${bgBlur.value}px)`;
    postBgLayer.classList.remove("hidden");

    const overlayAlpha = Number(bgOverlay.value) / 100;
    postOverlayLayer.style.backgroundColor = `rgba(0, 0, 0, ${overlayAlpha})`;
    postOverlayLayer.classList.remove("hidden");
    photoControls.classList.remove("hidden");
    removeBgImage.classList.remove("hidden");
  } else {
    postBgLayer.style.backgroundImage = "none";
    postBgLayer.classList.add("hidden");
    postOverlayLayer.classList.add("hidden");
    photoControls.classList.add("hidden");
    removeBgImage.classList.add("hidden");
  }
}

function render() {
  updateCustomVisibility();
  updateBackgroundLayer();
  updateWatermark();
  updateBranding();

  const d = getPostDimensions();
  post.style.aspectRatio = `${d.width} / ${d.height}`;

  // Apply Background Color / Gradient directly
  const selectedBackground = normalizeColor(bg.value) || "#ffffff";
  const solidSwatch = document.querySelector(".swatchSolid");
  if (solidSwatch) {
    solidSwatch.style.backgroundColor = selectedBackground;
  }

  if (currentGradient !== "none" && gradientCSS[currentGradient]) {
    post.style.backgroundImage = gradientCSS[currentGradient];
    post.style.backgroundColor = "transparent";
  } else {
    post.style.backgroundImage = "none";
    post.style.backgroundColor = selectedBackground;
  }

  preview.style.backgroundColor = "transparent";
  preview.innerHTML = cssPreviewHTML();
  preview.style.color = normalizeColor(black.value) || "#000000";
  preview.style.fontFamily = getFontFamily();
  preview.style.textAlign = alignment.value;
  preview.style.lineHeight = line.value;
  preview.style.fontSize = Number(size.value) + "px";

  // Character counter
  charCount.textContent = `${text.value.length} characters`;

  requestAnimationFrame(() => {
    actualFontSize = calculateAutoFontSize();
    preview.style.fontSize = actualFontSize + "px";

    $("sizeOut").textContent = size.value + "px";
    $("lineOut").textContent = Number(line.value).toFixed(2);
    $("actualSize").textContent =
      `Actual: ${actualFontSize}px` +
      (actualFontSize < Number(size.value) ? " (auto reduced)" : "");

    $("previewLabel").textContent = `${d.width} × ${d.height} PREVIEW`;
  });

  debouncedAutoSave();
}

/*
 * Quick Formatting Toolbar Helpers
 */
function insertTag(openTag, closeTag) {
  const start = text.selectionStart;
  const end = text.selectionEnd;
  const val = text.value;
  const selected = val.substring(start, end);

  const replacement = openTag + (selected || "Text") + closeTag;
  text.value = val.substring(0, start) + replacement + val.substring(end);

  const newCursorPos = selected
    ? start + replacement.length
    : start + openTag.length;

  text.focus();
  text.setSelectionRange(newCursorPos, newCursorPos + (selected ? 0 : 4));
  render();
}

function insertEmoji(emoji) {
  const start = text.selectionStart;
  const end = text.selectionEnd;
  const val = text.value;

  text.value = val.substring(0, start) + emoji + val.substring(end);
  const newPos = start + emoji.length;
  text.focus();
  text.setSelectionRange(newPos, newPos);
  render();
}

// Bind Toolbar Tag Buttons
document.querySelectorAll(".tagBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    const tag = btn.dataset.tag;
    if (tag.startsWith("#")) {
      insertTag(`[${tag}]`, `[/${tag}]`);
    } else {
      insertTag(`[${tag}]`, `[/${tag}]`);
    }
  });
});

// Bind Emoji Buttons
document.querySelectorAll(".emojiBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    insertEmoji(btn.dataset.emoji);
  });
});

// Background Color Picker & Gradient Presets Interaction
bg.addEventListener("input", () => {
  currentGradient = "none";
  document.querySelectorAll(".gradBtn").forEach(b => {
    b.classList.toggle("active", b.dataset.grad === "none");
  });
  render();
});

document.querySelectorAll(".gradBtn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".gradBtn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentGradient = btn.dataset.grad;
    render();
  });
});

/*
 * Professional Sinhala & English Post Templates
 */
const TEMPLATES = {
  blank: {
    text: "",
    font: "noto-sans",
    alignment: "center",
    bg: "#ffffff",
    black: "#111111",
    red: "#e53935",
    size: "48",
    line: "1.25",
    gradient: "none"
  },
  announcement: {
    text: `[red][bold]නිල නිවේදනයයි[/bold][/red]\n\n[bold]මහජනතාවගේ විශේෂ අවධානය පිණිසයි[/bold]\n\nරට තුළ පවතින කාලගුණික තත්ත්වය සැලකිල්ලට ගනිමින් නිකුත් කර ඇති අනතුරු ඇඟවීම තවදුරටත් දීර්ඝ කර තිබේ.\n\n[#64748b]ජාතික ආපදා කළමනාකරණ මධ්‍යස්ථානය[/#64748b]`,
    font: "noto-sans",
    alignment: "center",
    bg: "#ffffff",
    black: "#0f172a",
    red: "#b91c1c",
    size: "46",
    line: "1.35",
    gradient: "none"
  },
  breaking: {
    text: `[bold][#dc2626]විශේෂ පුවත් වාර්තාව[/#dc2626][/bold]\n\n[bold]ඉන්ධන මිල සංශෝධනය අද මධ්‍යම රාත්‍රියේ සිට[/bold]\n\nලෝක වෙළඳපොළේ මිල ගණන් සැලකිල්ලට ගනිමින් නව මිල සංශෝධනය ක්‍රියාත්මක කිරීමට තීරණය කර ඇත.\n\n[#64748b]මුදල් අමාත්‍යාංශය | කොළඹ[/#64748b]`,
    font: "noto-sans",
    alignment: "center",
    bg: "#f8fafc",
    black: "#0f172a",
    red: "#dc2626",
    size: "46",
    line: "1.35",
    gradient: "none"
  },
  editorial: {
    text: `[italic]“රටක ආර්ථික ස්ථාවරත්වය සඳහා වඩාත්ම වැදගත් වන්නේ නිවැරදි ප්‍රතිපත්තිමය තීන්දු කඩිනමින් ක්‍රියාත්මක කිරීමයි.”[/italic]\n\n[bold][red]— ආචාර්ය නිමල් පෙරේරා[/red][/bold]\n[#64748b]ජ්‍යෙෂ්ඨ ආර්ථික විශ්ලේෂක[/#64748b]`,
    font: "noto-serif",
    alignment: "center",
    bg: "#fcfaf7",
    black: "#1e293b",
    red: "#991b1b",
    size: "44",
    line: "1.45",
    gradient: "none"
  },
  market: {
    text: `[#38ef7d][bold]කොළඹ කොටස් වෙළඳපොළ[/bold][/#38ef7d]\n\n[bold]සියලු කොටස් මිල දර්ශකය ඉහළට[/bold]\n\nදිනය අවසානයේ සියලු කොටස් මිල දර්ශකය ඒකක 85කින් ඉහළ ගොස් ගනුදෙනු අවසන් විය.\n\n[#94a3b8]දෛනික වෙළඳපොළ වාර්තාව[/#94a3b8]`,
    font: "poppins",
    alignment: "center",
    bg: "#0f172a",
    black: "#f8fafc",
    red: "#38ef7d",
    size: "44",
    line: "1.35",
    gradient: "dark"
  },
  advisory: {
    text: `[#2563eb][bold]මහජන දැනුවත් කිරීමයි[/bold][/#2563eb]\n\n[bold]ඔන්ලයින් මූල්‍ය වංචාවලින් ආරක්ෂා වන්න[/bold]\n\nඔබගේ බැංකු ගිණුම් තොරතුරු හෝ OTP රහස් අංක කිසිදු අවස්ථාවක වෙනත් පාර්ශ්වයන් වෙත ලබා නොදෙන්න.\n\n[#64748b]ශ්‍රී ලංකා පරිගණක හදිසි ප්‍රතිචාර සංසදය (SLCERT)[/#64748b]`,
    font: "noto-sans",
    alignment: "center",
    bg: "#ffffff",
    black: "#1e293b",
    red: "#2563eb",
    size: "44",
    line: "1.35",
    gradient: "none"
  }
};

templateSelect.addEventListener("change", () => {
  const t = TEMPLATES[templateSelect.value];
  if (!t) return;

  text.value = t.text;
  font.value = t.font;
  alignment.value = t.alignment;
  bg.value = t.bg;
  black.value = t.black;
  red.value = t.red;
  size.value = t.size;
  line.value = t.line;

  currentGradient = t.gradient;
  document.querySelectorAll(".gradBtn").forEach(b => {
    b.classList.toggle("active", b.dataset.grad === t.gradient);
  });

  render();
  showToast(templateSelect.value === "blank" ? "Reset to Default / Blank" : "Template applied!");
});

// Photo Background Upload
bgImageInput.addEventListener("change", e => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  bgImageName.textContent = file.name;
  const reader = new FileReader();
  reader.onload = evt => {
    bgImageData = evt.target.result;
    bgImageObj = new Image();
    bgImageObj.src = bgImageData;
    render();
    showToast("Photo background applied!");
  };
  reader.readAsDataURL(file);
});

removeBgImage.addEventListener("click", () => {
  bgImageData = null;
  bgImageObj = null;
  bgImageInput.value = "";
  bgImageName.textContent = "No photo chosen";
  render();
});

// Brand Avatar Upload & Controls
brandAvatarInput.addEventListener("change", e => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = evt => {
    brandAvatarData = evt.target.result;
    render();
    showToast("Page logo updated!");
  };
  reader.readAsDataURL(file);
});

removeBrandAvatar.addEventListener("click", () => {
  brandAvatarData = null;
  brandAvatarInput.value = "";
  render();
});

// Core Form Event Listeners (both input and change)
const controlElements = [
  text, font, alignment, size, line, red, black,
  postSize, customWidth, customHeight, watermarkEnabled, watermarkText,
  watermarkPosition, watermarkSize, watermarkOpacity,
  bgOverlay, bgBlur, brandingEnabled, brandNameInput, brandHandleInput,
  brandTextColor, brandVerified, brandPositionBottom
];

controlElements.forEach(el => {
  if (!el) return;
  el.addEventListener("input", render);
  el.addEventListener("change", render);
});

// Example & Clear buttons
$("example").onclick = () => {
  text.value = `[red]IT Job[/red] අහු ගැහෙන්නෙ
[green]කොහොමද[/green] කියලා බලමු
[color=#7b1fa2][bold]මේ කොටස[/bold][/color] වෙනම
[italic]මේක italic[/italic] සහ [underline]මේක underline[/underline] 🙏.`;
  render();
};

$("clear").onclick = () => {
  text.value = "";
  templateSelect.value = "blank";
  render();
};

/*
 * Toast Notifications
 */
let toastTimeout = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2500);
}

/*
 * Mobile Navigation Bar Tabs
 */
mobileTabEditor.onclick = () => {
  mobileTabEditor.classList.add("active");
  mobileTabPreview.classList.remove("active");
  $("controlsSection").scrollIntoView({ behavior: "smooth" });
};

mobileTabPreview.onclick = () => {
  mobileTabPreview.classList.add("active");
  mobileTabEditor.classList.remove("active");
  $("previewSection").scrollIntoView({ behavior: "smooth" });
};

mobileSaveBtn.onclick = () => downloadPNG();

/*
 * High-Resolution Canvas Rendering & Mobile/iOS Export Engine
 */
async function generateHighResCanvas() {
  if (!window.html2canvas) {
    throw new Error("html2canvas library is not loaded.");
  }

  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const { width: targetWidth, height: targetHeight } = getPostDimensions();
  const rect = post.getBoundingClientRect();

  if (!rect.width || !rect.height) {
    throw new Error("The preview is not ready yet.");
  }

  // Calculate sharp scaling factor so mobile doesn't produce blurry output
  const captureScale = Math.max(1, targetWidth / rect.width);

  // Capture text, branding & watermark with transparent background
  const captured = await html2canvas(post, {
    backgroundColor: null,
    scale: captureScale,
    useCORS: true,
    allowTaint: false,
    logging: false,
    imageTimeout: 15000,
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    x: 0,
    y: 0,
    windowWidth: document.documentElement.clientWidth,
    windowHeight: document.documentElement.clientHeight,
    onclone: clonedDoc => {
      const clonedPost = clonedDoc.getElementById("post");
      const clonedBg = clonedDoc.getElementById("postBgLayer");
      const clonedOverlay = clonedDoc.getElementById("postOverlayLayer");

      if (clonedPost) {
        clonedPost.style.setProperty("background", "transparent", "important");
        clonedPost.style.setProperty("background-color", "transparent", "important");
        clonedPost.style.setProperty("background-image", "none", "important");
        clonedPost.style.setProperty("box-shadow", "none", "important");
      }
      if (clonedBg) clonedBg.style.display = "none";
      if (clonedOverlay) clonedOverlay.style.display = "none";
    }
  });

  // Construct Final High-DPI Output Canvas
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = targetWidth;
  outputCanvas.height = targetHeight;
  const ctx = outputCanvas.getContext("2d", { alpha: false });

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Step 1: Draw Background Layer (Image, Gradient, or Solid Color)
  if (bgImageObj && bgImageData) {
    // Aspect-Ratio Cover math
    const imgRatio = bgImageObj.naturalWidth / bgImageObj.naturalHeight;
    const canvasRatio = targetWidth / targetHeight;
    let sw, sh, sx, sy;

    if (imgRatio > canvasRatio) {
      sh = bgImageObj.naturalHeight;
      sw = sh * canvasRatio;
      sx = (bgImageObj.naturalWidth - sw) / 2;
      sy = 0;
    } else {
      sw = bgImageObj.naturalWidth;
      sh = sw / canvasRatio;
      sx = 0;
      sy = (bgImageObj.naturalHeight - sh) / 2;
    }

    const blurPx = Number(bgBlur.value);
    if (blurPx > 0) {
      ctx.filter = `blur(${Math.round(blurPx * (targetWidth / 700))}px)`;
    }

    ctx.drawImage(bgImageObj, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
    ctx.filter = "none";

    // Overlay Tint
    const overlayAlpha = Number(bgOverlay.value) / 100;
    if (overlayAlpha > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${overlayAlpha})`;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }
  } else if (currentGradient !== "none" && gradientCSS[currentGradient]) {
    // Draw CSS-equivalent Linear Gradient on Canvas
    const grad = ctx.createLinearGradient(0, 0, targetWidth, targetHeight);
    if (currentGradient === "sunset") {
      grad.addColorStop(0, "#f093fb"); grad.addColorStop(1, "#f5576c");
    } else if (currentGradient === "ocean") {
      grad.addColorStop(0, "#1e3c72"); grad.addColorStop(1, "#2a5298");
    } else if (currentGradient === "dark") {
      grad.addColorStop(0, "#141e30"); grad.addColorStop(1, "#243b55");
    } else if (currentGradient === "crimson") {
      grad.addColorStop(0, "#870000"); grad.addColorStop(1, "#190a05");
    } else if (currentGradient === "emerald") {
      grad.addColorStop(0, "#11998e"); grad.addColorStop(1, "#38ef7d");
    } else if (currentGradient === "midnight") {
      grad.addColorStop(0, "#0f2027"); grad.addColorStop(0.5, "#203a43"); grad.addColorStop(1, "#2c5364");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else {
    // Solid background color
    ctx.fillStyle = normalizeColor(bg.value) || "#ffffff";
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  // Step 2: Draw the captured text, branding, and watermark
  ctx.drawImage(captured, 0, 0, targetWidth, targetHeight);

  return { outputCanvas, targetWidth, targetHeight };
}

/*
 * Download & Save Handler with Web Share API and iOS Safari Support
 */
async function downloadPNG() {
  const originalBtnText = download.textContent;
  download.textContent = "⏳ Generating...";
  download.disabled = true;

  try {
    const { outputCanvas, targetWidth, targetHeight } = await generateHighResCanvas();
    const filename = `facebook-post-${targetWidth}x${targetHeight}.png`;

    outputCanvas.toBlob(async blob => {
      download.textContent = originalBtnText;
      download.disabled = false;

      if (!blob) {
        alert("Failed to create image file.");
        return;
      }

      lastGeneratedBlob = blob;

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || isIOS;

      const file = new File([blob], filename, { type: "image/png" });

      // 1. Try Native Mobile Web Share API (Primary solution for iPhones & Android)
      if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "Facebook Post",
            text: "Generated with Facebook Post Generator"
          });
          showToast("Shared successfully!");
          return;
        } catch (shareErr) {
          if (shareErr.name === "AbortError") {
            return;
          }
          console.warn("navigator.share failed, opening fallback modal:", shareErr);
        }
      }

      // 2. For iOS Safari fallback, open Save Modal (Allows Tap & Hold -> "Save to Photos")
      if (isIOS) {
        openSaveModal(blob, filename);
        return;
      }

      // 3. For Desktop & Chrome/Firefox, trigger standard automatic download
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.download = filename;
      a.href = blobUrl;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 1000);

      showToast("✅ Image downloaded!");
    }, "image/png");

  } catch (err) {
    download.textContent = originalBtnText;
    download.disabled = false;
    console.error("Export error:", err);
    alert("Could not generate image: " + err.message);
  }
}

download.onclick = downloadPNG;

/*
 * Save / Preview Modal for Mobile & iOS Fallback
 */
function openSaveModal(blob, filename) {
  const url = URL.createObjectURL(blob);
  modalImage.src = url;
  saveModal.classList.remove("hidden");

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  iosTip.classList.toggle("hidden", !isIOS);

  modalDownloadBtn.onclick = () => {
    const a = document.createElement("a");
    a.download = filename;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 500);
  };
}

function closeSaveModal() {
  saveModal.classList.add("hidden");
  if (modalImage.src.startsWith("blob:")) {
    URL.revokeObjectURL(modalImage.src);
    modalImage.src = "";
  }
}

modalClose.onclick = closeSaveModal;
modalBackdrop.onclick = closeSaveModal;
modalDoneBtn.onclick = closeSaveModal;

/*
 * Copy Image to Clipboard
 */
copyImage.onclick = async () => {
  const originalText = copyImage.textContent;
  copyImage.textContent = "⏳ Copying...";

  try {
    const { outputCanvas } = await generateHighResCanvas();
    outputCanvas.toBlob(async blob => {
      copyImage.textContent = originalText;
      if (!blob) {
        showToast("Could not generate image.");
        return;
      }

      if (navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          showToast("✅ Image copied to clipboard!");
          return;
        } catch (clipErr) {
          console.warn("ClipboardItem write failed:", clipErr);
        }
      }

      openSaveModal(blob, "facebook-post.png");
    }, "image/png");
  } catch (err) {
    copyImage.textContent = originalText;
    console.error(err);
    showToast("Copy failed: " + err.message);
  }
};

modalCopyBtn.onclick = () => {
  if (lastGeneratedBlob && navigator.clipboard && window.ClipboardItem) {
    navigator.clipboard.write([new ClipboardItem({ "image/png": lastGeneratedBlob })])
      .then(() => showToast("✅ Image copied to clipboard!"))
      .catch(() => showToast("Could not copy directly."));
  }
};

/*
 * Copy Post Caption Text (Strips tags for a clean Facebook caption)
 */
copyCaption.onclick = () => {
  const raw = text.value;
  if (!raw.trim()) {
    showToast("No text to copy!");
    return;
  }

  // Clean tags: [red]Text[/red] -> Text
  const clean = raw.replace(/\[\/?.*?\]/g, "");

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(clean)
      .then(() => showToast("📝 Post caption copied to clipboard!"))
      .catch(() => showToast("Could not copy text."));
  } else {
    const ta = document.createElement("textarea");
    ta.value = clean;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    showToast("📝 Post caption copied to clipboard!");
  }
};

/*
 * LocalStorage Auto-Save & Drafts System (Simple & Zero Database)
 */
const STORAGE_CURRENT_KEY = "fb_post_current_draft";
const STORAGE_DRAFTS_KEY = "fb_post_saved_drafts";

let autoSaveTimer = null;
function debouncedAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    try {
      const state = getCurrentState();
      localStorage.setItem(STORAGE_CURRENT_KEY, JSON.stringify(state));
    } catch (e) {}
  }, 600);
}

function getCurrentState() {
  return {
    text: text.value,
    font: font.value,
    alignment: alignment.value,
    size: size.value,
    line: line.value,
    red: red.value,
    black: black.value,
    bg: bg.value,
    postSize: postSize.value,
    customWidth: customWidth.value,
    customHeight: customHeight.value,
    currentGradient,
    bgOverlay: bgOverlay.value,
    bgBlur: bgBlur.value,
    watermarkEnabled: watermarkEnabled.checked,
    watermarkText: watermarkText.value,
    watermarkPosition: watermarkPosition.value,
    watermarkSize: watermarkSize.value,
    watermarkOpacity: watermarkOpacity.value,
    brandingEnabled: brandingEnabled.checked,
    brandName: brandNameInput.value,
    brandHandle: brandHandleInput.value,
    brandTextColor: brandTextColor.value,
    brandVerified: brandVerified.checked,
    brandPositionBottom: brandPositionBottom.checked
  };
}

function applyState(s) {
  if (!s) return;
  if (s.text !== undefined) text.value = s.text;
  if (s.font !== undefined) font.value = s.font;
  if (s.alignment !== undefined) alignment.value = s.alignment;
  if (s.size !== undefined) size.value = s.size;
  if (s.line !== undefined) line.value = s.line;
  if (s.red !== undefined) red.value = s.red;
  if (s.black !== undefined) black.value = s.black;
  if (s.bg !== undefined) bg.value = s.bg;
  if (s.postSize !== undefined) postSize.value = s.postSize;
  if (s.customWidth !== undefined) customWidth.value = s.customWidth;
  if (s.customHeight !== undefined) customHeight.value = s.customHeight;
  if (s.currentGradient !== undefined) {
    currentGradient = s.currentGradient;
    document.querySelectorAll(".gradBtn").forEach(b => {
      b.classList.toggle("active", b.dataset.grad === currentGradient);
    });
  }
  if (s.bgOverlay !== undefined) bgOverlay.value = s.bgOverlay;
  if (s.bgBlur !== undefined) bgBlur.value = s.bgBlur;
  if (s.watermarkEnabled !== undefined) watermarkEnabled.checked = s.watermarkEnabled;
  if (s.watermarkText !== undefined) watermarkText.value = s.watermarkText;
  if (s.watermarkPosition !== undefined) watermarkPosition.value = s.watermarkPosition;
  if (s.watermarkSize !== undefined) watermarkSize.value = s.watermarkSize;
  if (s.watermarkOpacity !== undefined) watermarkOpacity.value = s.watermarkOpacity;
  if (s.brandingEnabled !== undefined) brandingEnabled.checked = s.brandingEnabled;
  if (s.brandName !== undefined) brandNameInput.value = s.brandName;
  if (s.brandHandle !== undefined) brandHandleInput.value = s.brandHandle;
  if (s.brandTextColor !== undefined) brandTextColor.value = s.brandTextColor;
  if (s.brandVerified !== undefined) brandVerified.checked = s.brandVerified;
  if (s.brandPositionBottom !== undefined) brandPositionBottom.checked = s.brandPositionBottom;

  render();
}

function loadSavedDraftsList() {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_DRAFTS_KEY) || "[]");
    draftsSelect.innerHTML = '<option value="">📂 Load Saved Draft…</option>';
    list.forEach((draft, idx) => {
      const opt = document.createElement("option");
      opt.value = idx;
      opt.textContent = `${draft.name || "Draft " + (idx + 1)} (${draft.date || "Saved"})`;
      draftsSelect.appendChild(opt);
    });
  } catch (e) {}
}

saveDraftBtn.onclick = () => {
  const name = prompt("Enter a name for this draft:", "Post " + new Date().toLocaleDateString());
  if (!name) return;

  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_DRAFTS_KEY) || "[]");
    list.unshift({
      name: name.trim(),
      date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      state: getCurrentState()
    });
    if (list.length > 10) list.pop();
    localStorage.setItem(STORAGE_DRAFTS_KEY, JSON.stringify(list));
    loadSavedDraftsList();
    showToast("💾 Draft saved successfully!");
  } catch (e) {
    showToast("Could not save draft.");
  }
};

draftsSelect.onchange = () => {
  const idx = draftsSelect.value;
  if (idx === "") return;

  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_DRAFTS_KEY) || "[]");
    if (list[idx] && list[idx].state) {
      applyState(list[idx].state);
      showToast("Draft loaded!");
    }
  } catch (e) {}
};

// Initial setup
function init() {
  loadSavedDraftsList();

  // Clear initial text box per user request
  text.value = "";

  // Set "Default / Blank (White background)" template as default
  templateSelect.value = "blank";

  // Default background white & solid gradient
  bg.value = "#ffffff";
  currentGradient = "none";
  document.querySelectorAll(".gradBtn").forEach(b => {
    b.classList.toggle("active", b.dataset.grad === "none");
  });

  // Watermark bottom-center initially
  watermarkPosition.value = "bottom-center";

  render();
}

window.addEventListener("resize", render);
init();

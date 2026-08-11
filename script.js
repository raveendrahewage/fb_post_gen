const $ = id => document.getElementById(id);

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

let actualFontSize = Number(size.value);

const fontMap = {
  "noto-sans": '"Noto Sans Sinhala", "Noto Sans", Arial, sans-serif',
  "noto-serif": '"Noto Serif Sinhala", "Noto Serif", Georgia, serif',
  "abhaya": '"Abhaya Libre", "Noto Sans Sinhala", serif',
  "maname": '"Maname", "Noto Sans Sinhala", sans-serif',
  "poppins": '"Poppins", "Noto Sans Sinhala", sans-serif',
  "roboto": '"Roboto", "Noto Sans Sinhala", sans-serif',
  "inter": '"Inter", "Noto Sans Sinhala", sans-serif'
};

function getFontFamily() {
  return fontMap[font.value] || fontMap["noto-sans"];
}

function escapeHtml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
          .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function escapeXml(s) {
  return escapeHtml(s).replace(/&#039;/g,"&apos;");
}

const NAMED_COLORS = {
  red:"#ff0000", green:"#008000", blue:"#0000ff",
  yellow:"#ffff00", orange:"#ffa500", purple:"#800080",
  pink:"#ffc0cb", black:"#000000", white:"#ffffff",
  gray:"#808080", grey:"#808080", brown:"#a52a2a",
  cyan:"#00ffff", magenta:"#ff00ff", lime:"#00ff00",
  navy:"#000080", teal:"#008080", maroon:"#800000",
  olive:"#808000", silver:"#c0c0c0"
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

  // rgb()/rgba()/hsl()/hsla() and other modern CSS color functions.
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
 * Converts a line into individually formatted pieces.
 *
 * Supported:
 * [red]text[/red]
 * [#ff6600]text[/#ff6600]
 * [color=#ff6600]text[/color]
 * [bold]text[/bold]
 * [italic]text[/italic]
 * [underline]text[/underline]
 *
 * Formatting tags can be nested.
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
        // [red], [green], [blue], [#ff6600], [rgb(255,0,0)], etc.
        next.color = getTagColor(rawTag);
        stack.push(next);
      }
    } else if (match[1]) {
      // Closing tags are stack-based. This also allows nested tags.
      if (stack.length > 1) stack.pop();
    }

    last = tokenRe.lastIndex;
  }

  addText(lineText.slice(last));

  return parts.length
    ? parts
    : [{text:"", color:normalizeColor(black.value) || "#000000",
        bold:false, italic:false, underline:false}];
}
function cssPreviewHTML() {
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

  if (!availableWidth || !availableHeight) return maxSize;

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

function render() {
  updateCustomVisibility();

  const d = getPostDimensions();

  post.style.aspectRatio = `${d.width} / ${d.height}`;
  post.style.background = bg.value;

  preview.innerHTML = cssPreviewHTML();
  preview.style.color = normalizeColor(black.value) || "#000000";
  preview.style.fontFamily = getFontFamily();
  preview.style.textAlign = alignment.value;
  preview.style.lineHeight = line.value;
  preview.style.fontSize = Number(size.value) + "px";

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
}

[
  text, font, alignment, size, line, red, black, bg,
  postSize, customWidth, customHeight
].forEach(el => el.addEventListener("input", render));

postSize.addEventListener("change", render);

$("example").onclick = () => {
  text.value = `[red]IT Job[/red] අහු ගැහෙන්නෙ
[green]කොහොමද[/green] කියලා බලමු
[color=#7b1fa2][bold]මේ කොටස[/bold][/color] වෙනම
[italic]මේක italic[/italic] සහ [underline]මේක underline[/underline] 🙏.`;
  render();
};

$("clear").onclick = () => {
  text.value = "";
  render();
};

/*
 * Split a formatted run into grapheme clusters. This is much safer for
 * Sinhala than splitting raw Unicode code points.
 */
function graphemes(s) {
  if (window.Intl && Intl.Segmenter) {
    return [...new Intl.Segmenter(undefined, {granularity:"grapheme"}).segment(s)]
      .map(x => x.segment);
  }
  return Array.from(s);
}

function fontString(style, px) {
  const weight = style.bold ? "700" : "600";
  const italic = style.italic ? "italic " : "";
  return `${italic}${weight} ${px}px ${getFontFamily()}`;
}

function measureRun(ctx, style, value, px) {
  ctx.font = fontString(style, px);
  return ctx.measureText(value).width;
}

/*
 * Wraps every original line into export lines while preserving the color/
 * bold/italic/underline style of each segment.
 */
function wrapForCanvas(ctx, parsedLines, maxWidth, px) {
  const output = [];

  for (const parts of parsedLines) {
    let current = [];
    let currentWidth = 0;

    const pushCurrent = () => {
      output.push(current);
      current = [];
      currentWidth = 0;
    };

    for (const part of parts) {
      const chars = graphemes(part.text);

      if (!chars.length) continue;

      let buffer = "";
      for (const ch of chars) {
        const test = buffer + ch;
        const w = measureRun(ctx, part, test, px);

        if (current.length && currentWidth + w > maxWidth) {
          // Put the character onto a new visual line.
          pushCurrent();
          buffer = ch;
          current.push({...part, text: ch});
          currentWidth = measureRun(ctx, part, ch, px);
        } else {
          buffer = test;

          if (current.length &&
              current[current.length - 1].color === part.color &&
              current[current.length - 1].bold === part.bold &&
              current[current.length - 1].italic === part.italic &&
              current[current.length - 1].underline === part.underline) {
            current[current.length - 1].text += ch;
          } else {
            current.push({...part, text: ch});
          }

          currentWidth += measureRun(ctx, part, ch, px);
        }
      }
    }

    // Preserve an empty source line.
    pushCurrent();
  }

  return output;
}

function getExportFontSize(ctx, W, H) {
  const padding = W * 0.08;
  const maxWidth = W - padding * 2;
  const maxHeight = H - padding * 2;
  const maxSize = Number(size.value);
  const minSize = 12;
  const lh = Number(line.value);

  function fits(px) {
    const parsed = text.value.split("\n").map(parseLine);
    const wrapped = wrapForCanvas(ctx, parsed, maxWidth, px);
    const lineHeight = px * lh;
    const totalHeight = Math.max(lineHeight, wrapped.length * lineHeight);
    return totalHeight <= maxHeight;
  }

  if (fits(maxSize)) return maxSize;

  let low = minSize;
  let high = maxSize;

  for (let i = 0; i < 14; i++) {
    const mid = (low + high) / 2;
    if (fits(mid)) low = mid;
    else high = mid;
  }

  return Math.floor(low * 10) / 10;
}

function drawCanvasText(ctx, W, H, px) {
  const paddingX = W * 0.08;
  const paddingY = H * 0.08;
  const maxWidth = W - paddingX * 2;

  const parsed = text.value.split("\n").map(parseLine);
  const wrapped = wrapForCanvas(ctx, parsed, maxWidth, px);

  const lh = Number(line.value);
  const lineHeight = px * lh;
  const totalHeight = Math.max(lineHeight, wrapped.length * lineHeight);

  let y = (H - totalHeight) / 2 + px * 0.82;

  for (const parts of wrapped) {
    let width = 0;
    for (const part of parts) {
      width += measureRun(ctx, part, part.text, px);
    }

    let x;
    if (alignment.value === "left") x = paddingX;
    else if (alignment.value === "right") x = W - paddingX - width;
    else x = (W - width) / 2;

    for (const part of parts) {
      if (!part.text) continue;

      ctx.font = fontString(part, px);
      ctx.fillStyle = normalizeColor(part.color) || normalizeColor(red.value) || "#ff0000";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(part.text, x, y);

      const partWidth = ctx.measureText(part.text).width;

      if (part.underline && part.text.trim()) {
        const underlineY = y + Math.max(3, px * 0.07);
        ctx.beginPath();
        ctx.lineWidth = Math.max(1, px * 0.04);
        ctx.moveTo(x, underlineY);
        ctx.lineTo(x + partWidth, underlineY);
        ctx.strokeStyle = normalizeColor(part.color) || normalizeColor(red.value) || "#ff0000";
        ctx.stroke();
      }

      x += partWidth;
    }

    y += lineHeight;
  }
}
async function downloadPNG() {
  if (!window.html2canvas) {
    alert("The PNG capture library could not be loaded. Please check your internet connection and reload the page.");
    return;
  }

  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  await new Promise(resolve =>
    requestAnimationFrame(() =>
      requestAnimationFrame(resolve)
    )
  );

  const {width: targetWidth, height: targetHeight} = getPostDimensions();
  const rect = post.getBoundingClientRect();

  if (!rect.width || !rect.height) {
    alert("The preview is not ready yet.");
    return;
  }

  // Capture the actual preview DOM instead of rebuilding the text.
  const scale = targetWidth / rect.width;

  const canvas = await html2canvas(post, {
    backgroundColor: bg.value,
    scale: scale,
    useCORS: true,
    allowTaint: false,
    logging: false,
    imageTimeout: 15000,
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    windowWidth: document.documentElement.clientWidth,
    windowHeight: document.documentElement.clientHeight
  });

  let outputCanvas = canvas;

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    outputCanvas = document.createElement("canvas");
    outputCanvas.width = targetWidth;
    outputCanvas.height = targetHeight;
    const ctx = outputCanvas.getContext("2d");
    ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
  }

  const a = document.createElement("a");
  a.download = `facebook-post-${targetWidth}x${targetHeight}.png`;
  a.href = outputCanvas.toDataURL("image/png");
  a.click();
}
$("download").onclick = downloadPNG;

window.addEventListener("resize", render);
render();

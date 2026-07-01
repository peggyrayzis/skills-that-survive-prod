#!/usr/bin/env node

const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const PORT = Number(process.env.PORT || 6174);
const DECK_FILE =
  process.env.DECK_FILE ||
  path.join(__dirname, "slides-renderer", "skills-that-survive-production.html");
const SLIDES_FILE = path.join(__dirname, "slides.md");
const RENDER_SCRIPT = path.join(__dirname, "slides-renderer", "render-slides.cjs");
const WATCH_SLIDES = process.env.WATCH_SLIDES === "1";

let currentIndex = 0;
let deckVersion = 1;
let renderTimer = null;
const clients = new Set();

function htmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function attrValue(attrs, name) {
  const match = attrs.match(new RegExp(`${name}="([^"]*)"`, "i"));
  return match ? match[1] : "";
}

function stripHtml(value) {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readDeck() {
  return fs.readFileSync(DECK_FILE, "utf8");
}

function getSlides() {
  const html = readDeck();
  const slides = [];
  const sectionRe = /<section\b([^>]*)>([\s\S]*?)<\/section>/gi;
  let match;
  while ((match = sectionRe.exec(html))) {
    const attrs = match[1];
    const body = match[2];
    const titleMatch = body.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/i);
    slides.push({
      title: titleMatch ? stripHtml(titleMatch[1]) : `Slide ${slides.length + 1}`,
      notes: attrValue(attrs, "data-notes"),
      text: stripHtml(body),
    });
  }
  return slides;
}

function state() {
  return {
    index: currentIndex,
    total: getSlides().length,
    version: deckVersion,
  };
}

function broadcast() {
  const payload = `event: state\ndata: ${JSON.stringify(state())}\n\n`;
  for (const client of clients) {
    client.write(payload);
  }
}

function setIndex(nextIndex) {
  const total = getSlides().length;
  currentIndex = Math.max(0, Math.min(total - 1, nextIndex));
  broadcast();
}

function readJson(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function renderSlides() {
  try {
    delete require.cache[require.resolve(RENDER_SCRIPT)];
    require(RENDER_SCRIPT);
    deckVersion += 1;
    broadcast();
    console.log(`Slides re-rendered. Version ${deckVersion}`);
  } catch (error) {
    console.error("Slide render failed:", error.message);
  }
}

function scheduleRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderSlides, 120);
}

function localIps() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const net of Object.values(nets)) {
    for (const addr of net || []) {
      if (addr.family === "IPv4" && !addr.internal) {
        ips.push(addr.address);
      }
    }
  }
  return ips;
}

function send(res, status, type, body) {
  res.writeHead(status, {
    "content-type": type,
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  res.end(body);
}

function serveDeck(res) {
  const remoteScript = `
<script>
(function () {
  let lastRemoteIndex = null;
  let lastDeckVersion = null;
  let polling = false;

  function applyRemoteState(state) {
    if (!state || !Number.isFinite(state.index)) return;
    if (lastDeckVersion === null) {
      lastDeckVersion = state.version;
    } else if (state.version !== lastDeckVersion) {
      window.location.reload();
      return;
    }
    if (state.index === lastRemoteIndex) return;
    lastRemoteIndex = state.index;
    if (typeof window.showSlide === "function") {
      window.showSlide(state.index);
    }
  }

  async function pollState() {
    if (polling) return;
    polling = true;
    try {
      const response = await fetch("/api/state", { cache: "no-store" });
      if (response.ok) {
        applyRemoteState(await response.json());
      }
    } catch (_) {
    } finally {
      polling = false;
    }
  }

  const source = new EventSource("/events");
  source.addEventListener("state", function (event) {
    applyRemoteState(JSON.parse(event.data));
  });
  source.onerror = function () {
    pollState();
  };
  setInterval(pollState, 500);

  let lastHash = window.location.hash;
  function syncFromHash() {
    const match = window.location.hash.match(/slide-(\\d+)/);
    if (!match) return;
    const index = Number(match[1]) - 1;
    if (!Number.isFinite(index)) return;
    fetch("/api/goto", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ index, source: "deck" })
    }).catch(function () {});
  }

  setInterval(function () {
    if (window.location.hash !== lastHash) {
      lastHash = window.location.hash;
      syncFromHash();
    }
  }, 250);
})();
</script>`;

  const html = readDeck().replace("</body>", `${remoteScript}\n</body>`);
  send(res, 200, "text/html; charset=utf-8", html);
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "text/javascript; charset=utf-8";
  return "application/octet-stream";
}

function serveStaticAsset(urlPath, res) {
  const relativePath = decodeURIComponent(urlPath.replace(/^\/+/, ""));
  const filePath = path.resolve(__dirname, relativePath);
  const assetsRoot = path.resolve(__dirname, "assets");
  if (!filePath.startsWith(`${assetsRoot}${path.sep}`)) {
    send(res, 404, "text/plain; charset=utf-8", "Not found");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      send(res, 404, "text/plain; charset=utf-8", "Not found");
      return;
    }
    res.writeHead(200, {
      "content-type": contentTypeFor(filePath),
      "cache-control": "no-store",
    });
    res.end(data);
  });
}

function servePresenter(res) {
  const slides = getSlides();
  const slidesJson = JSON.stringify(slides);
  const body = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Speaker Notes</title>
  <style>
    :root {
      --ink: #101114;
      --muted: #626773;
      --paper: #f7f4ef;
      --panel: #fff;
      --line: #d9d2c6;
      --accent: #e04b2f;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--paper);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    main {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 18px;
    }
    .status {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      color: var(--muted);
      font-size: 14px;
    }
    .card {
      background: var(--panel);
      border: 1px solid var(--line);
      padding: 18px;
    }
    h1 {
      font-size: 32px;
      line-height: 1.05;
      margin: 0;
      letter-spacing: 0;
    }
    .notes {
      font-size: 20px;
      line-height: 1.35;
      white-space: pre-wrap;
    }
    .preview {
      color: var(--muted);
      font-size: 15px;
      line-height: 1.35;
      max-height: 92px;
      overflow: hidden;
    }
    .controls {
      position: sticky;
      bottom: 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      padding: 12px 0 0;
      margin-top: auto;
      background: var(--paper);
    }
    button {
      min-height: 62px;
      border: 1px solid var(--ink);
      background: var(--ink);
      color: white;
      font: inherit;
      font-size: 20px;
      font-weight: 760;
    }
    button.secondary {
      background: var(--panel);
      color: var(--ink);
      border-color: var(--line);
    }
    .jump {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
    }
    .jump button {
      min-height: 42px;
      font-size: 14px;
      border-color: var(--line);
    }
  </style>
</head>
<body>
  <main>
    <div class="status">
      <strong id="count">Slide 1 / ${slides.length}</strong>
      <span id="connectionStatus">Phone controls audience deck</span>
    </div>
    <section class="card">
      <h1 id="title"></h1>
    </section>
    <section class="card">
      <div class="notes" id="notes"></div>
    </section>
    <section class="card">
      <div class="preview" id="preview"></div>
    </section>
    <nav class="controls" aria-label="Slide controls">
      <button class="secondary" type="button" id="prev">Previous</button>
      <button type="button" id="next">Next</button>
      <div class="jump" id="jump"></div>
    </nav>
  </main>
  <script>
    const slides = ${slidesJson};
    let current = ${currentIndex};
    let deckVersion = ${deckVersion};
    const title = document.getElementById("title");
    const notes = document.getElementById("notes");
    const preview = document.getElementById("preview");
    const count = document.getElementById("count");
    const jump = document.getElementById("jump");
    const connectionStatus = document.getElementById("connectionStatus");

    function render(index) {
      current = Math.max(0, Math.min(slides.length - 1, index));
      const slide = slides[current] || {};
      title.textContent = slide.title || "Untitled slide";
      notes.textContent = slide.notes || "No speaker notes for this slide.";
      preview.textContent = slide.text || "";
      count.textContent = "Slide " + (current + 1) + " / " + slides.length;
      Array.from(jump.children).forEach((button, i) => {
        button.style.background = i === current ? "#e04b2f" : "#fff";
        button.style.color = i === current ? "#fff" : "#101114";
      });
    }

    function post(path, payload) {
      return fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload || {})
      });
    }

    function goto(index) {
      render(index);
      connectionStatus.textContent = "Sending...";
      post("/api/goto", { index })
        .then((response) => {
          connectionStatus.textContent = response.ok ? "Synced" : "Sync failed";
        })
        .catch(function () {
          connectionStatus.textContent = "Sync failed";
        });
    }

    slides.forEach((_, i) => {
      const button = document.createElement("button");
      button.className = "secondary";
      button.type = "button";
      button.textContent = String(i + 1);
      button.addEventListener("click", () => goto(i));
      jump.appendChild(button);
    });

    document.getElementById("prev").addEventListener("click", () => goto(current - 1));
    document.getElementById("next").addEventListener("click", () => goto(current + 1));

    const source = new EventSource("/events");
    source.addEventListener("state", function (event) {
      const state = JSON.parse(event.data);
      if (state.version !== deckVersion) {
        window.location.reload();
        return;
      }
      render(state.index);
    });

    setInterval(async function () {
      try {
        const response = await fetch("/api/state", { cache: "no-store" });
        if (!response.ok) return;
        const state = await response.json();
        if (state.version !== deckVersion) {
          window.location.reload();
          return;
        }
        render(state.index);
      } catch (_) {}
    }, 1000);

    render(current);
  </script>
</body>
</html>`;
  send(res, 200, "text/html; charset=utf-8", body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    send(res, 204, "text/plain; charset=utf-8", "");
    return;
  }

  if (url.pathname === "/" || url.pathname === "/deck") {
    serveDeck(res);
    return;
  }

  if (url.pathname === "/presenter") {
    servePresenter(res);
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    serveStaticAsset(url.pathname, res);
    return;
  }

  if (url.pathname === "/events") {
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-store",
      connection: "keep-alive",
    });
    res.write(`event: state\ndata: ${JSON.stringify(state())}\n\n`);
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  if (url.pathname === "/api/goto" && req.method === "POST") {
    const body = await readJson(req);
    if (Number.isFinite(body.index)) {
      setIndex(body.index);
    }
    send(res, 200, "application/json", JSON.stringify(state()));
    return;
  }

  if (url.pathname === "/api/state") {
    send(res, 200, "application/json", JSON.stringify(state()));
    return;
  }

  send(res, 404, "text/plain; charset=utf-8", "Not found");
});

server.listen(PORT, "0.0.0.0", () => {
  const ips = localIps();
  console.log(`Slide remote server running on port ${PORT}`);
  console.log("");
  console.log("Audience deck:");
  console.log(`  http://localhost:${PORT}/deck`);
  for (const ip of ips) console.log(`  http://${ip}:${PORT}/deck`);
  console.log("");
  console.log("Phone presenter notes:");
  console.log(`  http://localhost:${PORT}/presenter`);
  for (const ip of ips) console.log(`  http://${ip}:${PORT}/presenter`);
  console.log("");
  console.log("Use the LAN IP from your phone. Keep this process running while presenting.");
  if (WATCH_SLIDES) {
    console.log("");
    console.log(`Watching ${SLIDES_FILE} for slide edits.`);
    fs.watch(SLIDES_FILE, scheduleRender);
  }
});

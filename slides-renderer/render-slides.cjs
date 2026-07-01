#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const rendererDir = __dirname;
const root = path.join(rendererDir, "..");
const sourcePath = path.join(root, "slides.md");
const deckPath = path.join(rendererDir, "skills-that-survive-production.html");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function imageSource(value) {
  return value;
}

function renderFooter(counterText) {
  return `
      <footer class="chrome">
        <div class="footer-brand">
          <div class="footer-name">@peggyrayzis</div>
          <div class="qr-slot"><img src="assets/kite-links-qr.svg" alt="QR code for kiteand.co/links" /></div>
        </div>
        <div class="footer-progress">
          <div class="progress" aria-hidden="true"><span id="progress"></span></div>
          <span id="counter">${counterText}</span>
        </div>
        <div class="footer-actions">
          <div class="controls" aria-label="Slide controls">
            <button type="button" id="prev" aria-label="Previous slide">‹</button>
            <button type="button" id="toggleNotes" aria-label="Toggle speaker notes">N</button>
            <button type="button" id="next" aria-label="Next slide">›</button>
          </div>
        </div>
      </footer>`;
}

function deckTail() {
  return `
      </main>

${renderFooter("1 / 0")}
    </div>

    <aside class="notes" id="notes" aria-label="Speaker notes">
      <h3>Speaker notes</h3>
      <p id="notesText"></p>
    </aside>

    <script>
      const stage = document.getElementById("stage");
      const slides = Array.from(document.querySelectorAll(".slide"));
      const notes = document.getElementById("notes");
      const notesText = document.getElementById("notesText");
      const counter = document.getElementById("counter");
      const progress = document.getElementById("progress");
      let index = 0;

      function fitStage() {
        const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
        stage.style.setProperty("--stage-scale", String(scale));
      }

      function showSlide(nextIndex) {
        index = Math.max(0, Math.min(slides.length - 1, nextIndex));
        slides.forEach((slide, i) => {
          slide.classList.toggle("active", i === index);
        });
        counter.textContent = \`\${index + 1} / \${slides.length}\`;
        progress.style.width = \`\${((index + 1) / slides.length) * 100}%\`;
        notesText.textContent = slides[index].dataset.notes || "";
        const nextHash = \`slide-\${index + 1}\`;
        if (window.location.hash.slice(1) !== nextHash) {
          window.location.hash = nextHash;
        }
      }

      function go(delta) {
        showSlide(index + delta);
      }

      function showHashSlide() {
        const match = window.location.hash.match(/slide-(\\d+)/);
        if (match) {
          showSlide(Number(match[1]) - 1);
        }
      }

      document.getElementById("prev").addEventListener("click", () => go(-1));
      document.getElementById("next").addEventListener("click", () => go(1));
      document.getElementById("toggleNotes").addEventListener("click", () => {
        notes.classList.toggle("open");
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight" || event.key === " ") {
          event.preventDefault();
          go(1);
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          go(-1);
        }
        if (event.key.toLowerCase() === "n") {
          notes.classList.toggle("open");
        }
        if (event.key === "Home") {
          showSlide(0);
        }
        if (event.key === "End") {
          showSlide(slides.length - 1);
        }
      });

      window.addEventListener("resize", fitStage);
      window.addEventListener("hashchange", showHashSlide);
      window.showSlide = showSlide;
      fitStage();

      if (window.location.hash) {
        showHashSlide();
      } else {
        showSlide(0);
      }
    </script>
  </body>
</html>`;
}

function renderRuntimeScript() {
  return `    <script>
      const stage = document.getElementById("stage");
      const slides = Array.from(document.querySelectorAll(".slide"));
      const notes = document.getElementById("notes");
      const notesText = document.getElementById("notesText");
      const counter = document.getElementById("counter");
      const progress = document.getElementById("progress");
      let index = 0;

      function fitStage() {
        const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
        stage.style.setProperty("--stage-scale", String(scale));
      }

      function showSlide(nextIndex) {
        index = Math.max(0, Math.min(slides.length - 1, nextIndex));
        slides.forEach((slide, i) => {
          slide.classList.toggle("active", i === index);
        });
        counter.textContent = \`\${index + 1} / \${slides.length}\`;
        progress.style.width = \`\${((index + 1) / slides.length) * 100}%\`;
        notesText.textContent = slides[index].dataset.notes || "";
        const nextHash = \`slide-\${index + 1}\`;
        if (window.location.hash.slice(1) !== nextHash) {
          window.location.hash = nextHash;
        }
      }

      function go(delta) {
        showSlide(index + delta);
      }

      function showHashSlide() {
        const match = window.location.hash.match(/slide-(\\d+)/);
        if (match) {
          showSlide(Number(match[1]) - 1);
        }
      }

      document.getElementById("prev").addEventListener("click", () => go(-1));
      document.getElementById("next").addEventListener("click", () => go(1));
      document.getElementById("toggleNotes").addEventListener("click", () => {
        notes.classList.toggle("open");
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight" || event.key === " ") {
          event.preventDefault();
          go(1);
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          go(-1);
        }
        if (event.key.toLowerCase() === "n") {
          notes.classList.toggle("open");
        }
        if (event.key === "Home") {
          showSlide(0);
        }
        if (event.key === "End") {
          showSlide(slides.length - 1);
        }
      });

      window.addEventListener("resize", fitStage);
      window.addEventListener("hashchange", showHashSlide);
      window.showSlide = showSlide;
      fitStage();

      if (window.location.hash) {
        showHashSlide();
      } else {
        showSlide(0);
      }
    </script>`;
}

function parseMeta(block) {
  const meta = {};
  const match = block.match(/^\s*<!--([\s\S]*?)-->\s*/);
  if (!match) {
    return [meta, block.trim()];
  }

  for (const line of match[1].trim().split("\n")) {
    const item = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!item) continue;
    meta[item[1]] = item[2].trim();
  }

  return [meta, block.slice(match[0].length).trim()];
}

function flushList(html, list) {
  if (!list.length) return;
  html.push("        <div class=\"stack\">");
  for (const item of list) {
    html.push(`          <div>${inlineMarkdown(item)}</div>`);
  }
  html.push("        </div>");
  list.length = 0;
}

function renderBenchmarkTable(code) {
  const rows = code
    .join("\n")
    .trim()
    .split("\n")
    .map((line) => line.trim().split(/\s{2,}/))
    .filter((row) => row.length >= 3);

  if (rows.length < 2) {
    return null;
  }

  const [header, ...body] = rows;
  const th = header
    .map((cell) => `<th>${escapeHtml(cell)}</th>`)
    .join("");
  const tr = body
    .map((row) => {
      const cells = row
        .map((cell, index) => {
          const classes = [];
          if (index > 0) classes.push("metric");
          if (cell === "pass") classes.push("pass");
          if (cell === "fail") classes.push("fail");
          const className = classes.length ? ` class="${classes.join(" ")}"` : "";
          return `<td${className}>${escapeHtml(cell)}</td>`;
        })
        .join("");
      return `          <tr>${cells}</tr>`;
    })
    .join("\n");

  return [
    "        <table class=\"benchmark-table\">",
    `          <thead><tr>${th}</tr></thead>`,
    "          <tbody>",
    tr,
    "          </tbody>",
    "        </table>",
  ].join("\n");
}

function renderMarkdown(markdown, meta, index) {
  const html = [];
  const list = [];
  const lines = markdown.split("\n");
  let inCode = false;
  let codeLang = "";
  let code = [];
  let paragraph = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(`        <p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function flushCode() {
    if (meta.layout === "benchmark") {
      const table = renderBenchmarkTable(code);
      if (table) {
        html.push(table);
        inCode = false;
        codeLang = "";
        code = [];
        return;
      }
    }

    const lang = codeLang ? ` data-lang="${escapeHtml(codeLang)}"` : "";
    html.push(`        <pre${lang}><code>${escapeHtml(code.join("\n"))}</code></pre>`);
    inCode = false;
    codeLang = "";
    code = [];
  }

  function flushAllText() {
    flushParagraph();
    flushList(html, list);
  }

  if (meta.eyebrow) {
    html.push(`        <p class="eyebrow">${inlineMarkdown(meta.eyebrow)}</p>`);
  }

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) {
        flushCode();
      } else {
        flushAllText();
        inCode = true;
        codeLang = line.slice(3).trim();
        code = [];
      }
      continue;
    }

    if (inCode) {
      code.push(line);
      continue;
    }

    if (!line.trim()) {
      flushAllText();
      continue;
    }

    if (line.startsWith("# ")) {
      flushAllText();
      const tag = meta.level || (index === 0 ? "h1" : "h2");
      html.push(`        <${tag}>${inlineMarkdown(line.slice(2).trim())}</${tag}>`);
      continue;
    }

    if (line.startsWith("## ")) {
      flushAllText();
      html.push(`        <h2>${inlineMarkdown(line.slice(3).trim())}</h2>`);
      continue;
    }

    if (line.startsWith("> ")) {
      flushAllText();
      html.push(`        <p class="big-line">${inlineMarkdown(line.slice(2).trim())}</p>`);
      continue;
    }

    const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      flushAllText();
      const [, alt, src] = image;
      if ((meta.layout || "").trim() === "clay-artifact") {
        const imageSrc = escapeHtml(imageSource(src));
        const imageAlt = escapeHtml(alt);
        html.push(
          [
            '        <figure class="artifact clay-mess">',
            `            <img src="${imageSrc}" alt="${imageAlt}" />`,
            "        </figure>",
          ].join("\n"),
        );
        continue;
      }

      const figureClass =
        meta.layout === "contract-sandwich"
          ? "artifact sandwich-visual"
          : "artifact";
      const sandwichCallouts =
        meta.layout === "contract-sandwich"
          ? [
              '          <span class="sandwich-callout sandwich-callout-input"><strong>Inputs</strong><em>evidence</em></span>',
              '          <span class="sandwich-callout sandwich-callout-judgment"><strong>Judgment</strong><em>the call</em></span>',
              '          <span class="sandwich-callout sandwich-callout-output"><strong>Output</strong><em>contract</em></span>',
            ].join("\n")
          : "";
      html.push(
        `        <figure class="${figureClass}"><img src="${escapeHtml(imageSource(src))}" alt="${escapeHtml(alt)}" />${sandwichCallouts ? `\n${sandwichCallouts}` : ""}</figure>`,
      );
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      list.push(line.slice(2).trim());
      continue;
    }

    paragraph.push(line.trim());
  }

  flushAllText();

  const active = index === 0 ? " active" : "";
  const tone = meta.tone ? ` data-tone="${escapeHtml(meta.tone)}"` : "";
  const layout = meta.layout ? ` data-layout="${escapeHtml(meta.layout)}"` : "";
  const notes = meta.notes ? ` data-notes="${escapeHtml(meta.notes)}"` : "";
  return `      <section class="slide${active}" id="slide-${index + 1}"${tone}${layout}${notes}>\n${html.join("\n")}\n      </section>`;
}

const raw = fs.readFileSync(sourcePath, "utf8");
const slideBlocks = raw
  .split(/\n---\n/g)
  .map((block) => block.trim())
  .filter(Boolean);

const sections = slideBlocks.map((block, index) => {
  const [meta, markdown] = parseMeta(block);
  return renderMarkdown(markdown, meta, index);
});

let deck = fs.readFileSync(deckPath, "utf8");
const stageOpen = `    <div class="stage" id="stage">`;
const renderedMain = `<main class="deck" aria-live="polite">\n${sections.join("\n\n")}`;
const mainRe = /<main class="deck" aria-live="polite">[\s\S]*?<\/main>/;
if (mainRe.test(deck)) {
  deck = deck.replace(mainRe, `${renderedMain}\n    </main>`);
} else {
  const mainStart = deck.indexOf('<main class="deck" aria-live="polite">');
  if (mainStart === -1) {
    throw new Error("Could not find deck <main> container");
  }
  deck = `${deck.slice(0, mainStart)}${stageOpen}\n${renderedMain}${deckTail()}`;
}
deck = deck.replace(
  /\s*<footer class="chrome">[\s\S]*?\n\s*<\/footer>/,
  renderFooter(`1 / ${sections.length}`),
);
deck = deck.replace(
  /<span id="counter">[^<]+<\/span>/,
  `<span id="counter">1 / ${sections.length}</span>`,
);
deck = deck.replace(
  /<div class="qr-slot"><img src="[^"]+" alt="QR code for kiteand\.co\/links" \/><\/div>/,
  `<div class="qr-slot"><img src="${escapeHtml(imageSource("assets/kite-links-qr.svg"))}" alt="QR code for kiteand.co/links" /></div>`,
);
deck = deck.replace(
  /\s*<script>\s*const stage = document\.getElementById\("stage"\);[\s\S]*?\n\s*<\/script>/,
  `\n${renderRuntimeScript()}`,
);

fs.writeFileSync(deckPath, deck);
console.log(`Rendered ${sections.length} slides from ${sourcePath}`);

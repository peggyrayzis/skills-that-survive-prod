#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = __dirname;
const sourcePath = path.join(root, "slides.md");
const deckPath = path.join(root, "skills-that-survive-production.html");

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

function renderMarkdown(markdown, meta, index) {
  const html = [];
  const list = [];
  const lines = markdown.split("\n");
  let inCode = false;
  let code = [];
  let paragraph = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(`        <p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function flushCode() {
    html.push(`        <pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
    inCode = false;
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
  const notes = meta.notes ? ` data-notes="${escapeHtml(meta.notes)}"` : "";
  return `      <section class="slide${active}"${tone}${notes}>\n${html.join("\n")}\n      </section>`;
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
deck = deck.replace(
  /<main class="deck" aria-live="polite">[\s\S]*?<\/main>/,
  `<main class="deck" aria-live="polite">\n${sections.join("\n\n")}\n    </main>`,
);
deck = deck.replace(
  /<span id="counter">[^<]+<\/span>/,
  `<span id="counter">1 / ${sections.length}</span>`,
);

fs.writeFileSync(deckPath, deck);
console.log(`Rendered ${sections.length} slides from ${sourcePath}`);

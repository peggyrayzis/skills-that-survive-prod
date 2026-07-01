# Production Skills Talk

Editable HTML slide deck for the Resend meetup talk.

## Files

- `slides.md` is the source of truth for the deck.
- `skills-that-survive-production.html` is the rendered deck.
- `render-slides.cjs` rebuilds the HTML from `slides.md`.
- `slide-remote-server.cjs` serves the audience deck and phone presenter controls.

## Commands

Render after editing `slides.md`:

```bash
npm run render
```

Start the local deck server:

```bash
npm run serve
```

In a second terminal, start a Cloudflare quick tunnel:

```bash
npm run tunnel
```

Use the printed `trycloudflare.com` URL:

- `/deck` for the audience deck
- `/presenter` for phone speaker notes and controls

The `cloudflared-empty.yml` file is intentionally blank so the tunnel command does not pick up the global `~/.cloudflared/config.yml`.

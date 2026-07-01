# Slides That Survive Production

My slides for the Resend meetup on 7/1/26.

## Links

- [Skills Docs](https://agentskills.io/)
- [How Warp builds model-invoked skills](https://www.youtube.com/watch?v=jcfDKXc7Zxg)
- [Connect on LinkedIn](https://www.linkedin.com/in/peggyrayzis/)
- [Connect on X](https://x.com/peggyrayzis)
- [Join the Kite waitlist](https://kiteand.co/)

## Files

- `slides.md` is the source of truth for the deck.
- `skills/icp` is an example ICP skill you can adapt to your business.

## ICP Skill

The public skill example lives in `skills/icp/`. It shows a compact production-style ICP skill with the scoring contract, references, and eval definitions, without attendee data or generated comparison outputs. You can use it to define your own ICP skill.

## Agent Frameworks Built On Skills

My Kite agent is a fork of Pi, but there are a few other agent frameworks that use skills as a first-class application primitive:

- [Flue](https://flueframework.com/)
- [Eve](https://vercel.com/eve)

## Slide Commands

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

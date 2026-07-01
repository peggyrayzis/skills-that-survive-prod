---
name: "icp"
description: "Score enriched meetup leads (including people and accounts), check ICP fit and exclusions, and prioritize into tiers before outbound, Slack alerts, or CRM export."
---

# Resend Meetup Demo ICP Skill

Use this skill when you need exact demo targeting rules for scoring people from
the Resend meetup segment.

This skill is a thin wrapper around the canonical ICP spec. Do not duplicate or
restate the rules here.

`references/icp_spec.json` is the single source of truth for:

- account fit
- person fit
- tier
- confidence
- exclusions
- reasons

The labels inside the spec are evaluation buckets, not database columns.
Workflows can map them from enriched person records, account enrichment, event
context, source artifacts, or operator judgment.

## How To Use It

Read [references/icp_spec.json](references/icp_spec.json) before evaluating
people or implementing scoring logic.

Use [references/exclusions.json](references/exclusions.json) for account,
title, and dynamic connection exclusions.

Use [references/known_people_exclusions.md](references/known_people_exclusions.md)
for the existing-relationship exclusion flow. In a real workflow, adapt that
reference to the system of record you already trust, such as CRM contacts,
customers, active opportunities, or a relationship graph. Keep this public demo
generic; do not name private segments, private profile URLs, or individual
people in the skill text.

Read the tier example references only when you need grounding examples rather
than scoring rules:

- [references/tier_1_examples.json](references/tier_1_examples.json) for Tier 1 founders of devtools/AI startups
- [references/tier_2_examples.json](references/tier_2_examples.json) for Tier 2 operators at devtools/AI startups
- [references/tier_3_examples.json](references/tier_3_examples.json) for Tier 3 other startup founders outside devtools/AI

Note that in a real world scenario, you'd use exact names, titles, and companies. Use [evals/evals.json](evals/evals.json) for the public demo quality validators.

Follow this order:

1. Evaluate account fit.
2. Evaluate person fit.
3. Apply hard exclusions.
4. Assign the highest valid tier.
5. Assign confidence.
6. Record reasons.

When producing an evaluation:

- Use the exact enum values from `outputs`.
- Let the caller define the output shape.
- Map the caller's schema from the spec's canonical enums, tier rules, exclusion
  IDs, and evidence.
- Prefer lower confidence when evidence is partial instead of over-asserting.
- Keep reasons concrete and tied to evidence from the source material.
- Do not output outreach actions, campaign decisions, provider payloads, or
  next-step recommendations from this skill.

When updating this ICP:

- Edit only [references/icp_spec.json](references/icp_spec.json) unless the
  trigger description itself needs to change.
- Edit tier example reference files separately from scoring rules when you only
  need to change grounding examples.
- Keep examples generic enough for public sharing; do not include private people,
  private profile URLs, or private relationship data.

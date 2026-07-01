<!--
notes: Who here has created an agent skill? Keep your hand raised if you use them weekly. Daily. 10 times a day? 100 times a day? How about 10,000 times a day? Today I'm here to share some tips on how I've built reliable skills that my agent uses in production at least 10,000 times a day! I've given versions of this as a skills training to my clients and both engineers and non-technical people have learned something new. So I hope you do too!
-->

# Skills That Survive Production

Good skill = judgment + contract

---

<!--
notes: My name is Peggy, I'm an engineer turned marketer who has been working with founders at Render, Imbue, LiveKit, and InsForge on some of their biggest launches through my business scale.dev. You may also recognize me from Apollo GraphQL where I was an engineer and led dev marketing for 7 years. Where are all my Jersey City/Hoboken people at? And now I'm building Kite, which I like to describe as either agent-native Marketo. And if you haven't felt the pain of Marketo, you can also think of Kite as an OpenClaw for marketing.
-->

# @peggyrayzis

- scale.dev: Engineer turned marketer doing launches for devtools/AI
- Live in Jersey City 💛
- Building Kite, a marketing agent that runs on skills

---

<!--
notes: When skills came out, I was hooked. For me, it kind of felt like the first time I built an app with React. Finally I had a structure and a language for composing my marketing workflows and sharing them with clients without copying and pasting prompts around.

I went down the rabbit hole with Pi, which is a minimal agent harness you can customize with skills. I packaged all of my positioning, lead scoring, and launch workflows into skills, then I turned them into a background agent with Pi. Now it's in production with a few of my seed stage clients! All of this truly opened my mind to what's possible with skills, and even though the AI world moves fast, I think they're an important foundation for how we'll make agents actually useful.
-->

# Skills are the next application paradigm

---

<!--
tone: blue
eyebrow: Skills 101
notes: First I want to give a quick refresher on what agent skills are. They're a set of reusable instructions that encode your taste and judgment for the model. So often I see people cargo culting other people's skills and I think they're missing the point. Good skills are customized to you and your business.

Skills are progressively disclosed which means they're only loaded into context when you invoke them with a slash command or the model decides to invoke them after matching your intent to the description field in the skill.
-->

# Skills: Reusable instructions, progressive disclosure

## Give the model your taste and judgment!

<!--
eyebrow: Skills 101
notes: This distinction between user and model-invoked skills is actually quite important
-->

# User vs. model-invoked skills

- Most skills are intended to be user-invoked (ex: /plan, /frontend-design)
- Some are both (/goal, /compact)
- Writing good model-invoked skills is hard

---

<!--
tone: green
notes: blah
-->

# Skills as components

- Flue (creators of Astro): https://flueframework.com/
- Eve (Vercel): https://eve.dev/

---

<!--
eyebrow: Before
notes: I'm going to talk about lead scoring because that's my domain but you could apply these principles to other domains: issue triage skill for OSS project, customer service ticket triage, anywhere you need a queue of prioritized outputs.
-->

# The skill sandwich

## Structured Evidence -> Judgment (what makes a good lead?) -> Structured Output

---

<!--
eyebrow: Before
notes: I'm going to talk about lead scoring because that's my domain but you could apply these principles to other domains: issue triage skill for OSS project, customer service ticket triage, anywhere you need a queue of prioritized outputs.
-->

# ICP skill

## LinkedIn, company data, product signals -> Eval (Account, Person) -> Fit + Reasons + Confidence

---

<!--
eyebrow: Before
notes: I'm going to talk about lead scoring because that's my domain but you could apply these principles to other domains: issue triage skill for OSS project, customer service ticket triage, anywhere you need a queue of prioritized outputs.
-->

# Issue triage skill

## Issue, codebase, maintainers -> Eval (Issue, Maintainers) -> Owner + Reasons + Confidence

---

<!--
eyebrow: Before
notes: I'm going to talk about lead scoring because that's my domain but you could apply these principles to other domains: issue triage skill for OSS project, support ticket skill, anywhere you need a queue of prioritized outputs. (Fix the examples so they're more legible)
-->

# Support ticket skill

## Ticket, customer -> Eval (Ticket) -> Priority + Reasons + Confidence

---

<!--
tone: blue
eyebrow: What not to do
notes: Most of the skills you see are actually big giant prompts. Before my marketing agent was a thing, I built lead scoring for my clients in Clay. There would be weird edge cases and questions from clients about why this lead that I couldn't always answer because the prompt had a lot of branching logic in prose that was impossible to test.
-->

# Skillslop

2000+ line markdown files

---

<!--
tone: green
eyebrow: Skills Best Practices
notes:
-->

# De-slop your skills

- Keep SKILL.md thin (<500 lines), use context pointers to:
  - references/: Additional docs or grounding examples, loaded on demand
  - assets/: Templates and images not loaded into context
  - scripts/: Executable scripts
  - evals/: Test cases

---

<!--
eyebrow: Skills Best Practices
notes: This skill runs on 100,000 records a week, so the output must be consistent. I like grading high, med, low over a numerical score. Codex will give you skills closer to this style than Claude.
-->

# Output schemas

```json
"outputs": {
  "account_fit": ["high", "medium", "low"],
  "person_fit": ["high", "medium", "low"],
  "tier": [0, 1, 2, 3],
  "confidence": ["high", "medium", "low"]
},
"required_output_fields": [
  "account_fit",
  "person_fit",
  "tier",
  "confidence",
  "reasons",
  "exclusions_matched"
],
```

---

# JTBD as descriptions

# Before

description: ICP fit skill for people and accounts

# After

description: >
Score leads, answer ICP questions, decide account fit or person fit, check account or person exclusions, and find ICP examples. Use this skill when the user has a CSV, JSON file, or a list of enriched leads or companies that they want to score and prioritize before sending campaigns, outbound messages, Slack alerts, or exporting to their CRM.

---

<!--
tone: blue
eyebrow: Testing skills
notes: Here's how to test skills
-->

# Evals = reliable skills

- Trigger evals: Did the model invoke my skill?
- Output evals: Is it in the shape I expect?
- Token cost
- 3-5 quality validators

---

<!--
eyebrow: The comparison
notes: This slide makes the contrast clear. The three columns should be the whole demo structure: bad/common shape, production shape, human baseline.
-->

# Attendee triage, three ways

- Big skill: one giant Markdown file
- Split skill: thin skill, spec, schema, checks
- Hand review: what I wanted the agent to do

---

<!--
tone: green
eyebrow: Benchmark
notes: This can be a real terminal output later. For now these are placeholder numbers. The dimensions are what matter: not model intelligence, but shape, evidence, uncertainty, unsafe actions.
-->

# What survives production?

```text
Eval dimension          Big skill   Split skill
Schema valid            74%         100%
Evidence present        61%         96%
Uncertainty handled     52%         91%
Unsafe action blocked   3           0
```

---

<!--
eyebrow: The interesting failure
notes: This is the case study moment. Pick one failure where the big skill sounds reasonable but is unsafe. The split skill is not smarter, it stops better.
-->

# The big skill guessed.

The production-shaped skill said: enrich more.

---

<!--
tone: blue
eyebrow: Output shape
notes: This should show the boring structured JSON. Boring is the point. Another system can trust it.
-->

# The system needs a receipt.

```json
{
  "segment": "engineer_power_user",
  "fit": "medium",
  "confidence": "low",
  "action": "enrich_more",
  "evidence_used": ["developer tools", "AI workflow mention"],
  "unresolved_questions": ["current role unclear"],
  "review_required": false
}
```

---

<!--
tone: green
eyebrow: This is not about leads
notes: This makes the talk more generally useful to engineers. The demo is lead-ish, but the pattern works across judgment skills.
-->

# The pattern is portable.

- Bug triage -> owner, severity, next step
- Support routing -> urgency, missing info
- Code review -> risk, evidence, patch path

---

<!--
eyebrow: Team practice
notes: This is the central repo point. It should feel like an engineering practice, not a Kite feature.
-->

# Your skills should not live on someone's laptop.

Company judgment belongs in a repo.

---

<!--
tone: blue
eyebrow: Why the repo matters
notes: This is the repo-as-memory point. Mention git log as eval signal for improving the skill creator, but do not make it the main demo.
-->

# Your skills repo is company memory.

- Review history
- Examples that compound
- Better skill creation over time

---

<!--
tone: green
eyebrow: Takeaway
notes: End with the practical lesson, not a product pitch. Kite can be a small footnote in the repo line.
-->

# Do not make the prompt longer.

Make the judgment testable.

---

<!--
eyebrow: Steal the pattern
notes: CTA should be a useful artifact. Kite waitlist is allowed, but it should not be the emotional close.
-->

# Repo has the talk, skill builder, templates, and examples.

Kite waitlist is there too, if this is your problem.

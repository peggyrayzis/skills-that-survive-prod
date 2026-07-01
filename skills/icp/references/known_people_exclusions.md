# Existing-Relationship Exclusions

Use this reference to exclude people who should not be treated as net-new leads:
existing customers, active opportunities, teammates, close contacts, or people
already known through a trusted relationship source.

## Adapt This In A Real Workflow

Pick the source of truth your team already uses:

- CRM contacts and accounts
- customer and active-opportunity lists
- newsletter or community member lists
- workspace contacts
- relationship graph or social connections

Load those records before scoring, then attach strong matches to the lead
evidence as `known_contact`.

## If Running This In Kite

Use Kite's search tools to turn the exclusion source into lead evidence:

1. Use `kite_resolve` to resolve the relevant CRM, customer, opportunity,
   contact, or relationship segment.
2. Use `kite_find` to fetch people from that resolved segment.
3. Use `kite_get` only when you need to open the person record and verify a
   plausible match.

Keep the same matching rules below. The tool names are implementation details;
the ICP output should still only contain `known_contact`.

## Matching Flow

1. Load the current lead list and the exclusion source.
2. Match by stable person id when available.
3. Match by normalized LinkedIn/profile URL next.
4. Match by normalized social handle next.
5. Use exact normalized name only when identity evidence is strong.
6. Mark weak matches for review instead of excluding them automatically.

If the relationship source is unavailable, mark the known-contact check as
incomplete and lower confidence rather than claiming it passed.

## Matching Rules

Strong exclusion match:

- same canonical Kite person id
- same normalized LinkedIn URL
- same normalized X profile plus same or compatible name

Review-needed match:

- exact normalized name with no stable profile match
- exact normalized name plus weak company overlap

Do not exclude on first name, fuzzy name, or company-only overlap.

## Output Mapping

When a strong match is found:

- `tier`: 0
- `account_fit`: keep the account fit from evidence unless another hard exclusion lowers it
- `person_fit`: `low`
- `confidence`: `high` when the identity match is canonical or profile-based, otherwise `medium`
- `exclusions_matched`: include `known_contact`
- `reasons`: mention that trusted CRM, customer, opportunity, contact, or relationship evidence shows an existing relationship

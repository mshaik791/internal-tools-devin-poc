# Economics

The question I'm answering: does building these tools with Devin come out cheaper than the $250K/yr Power Apps bill, once you count engineer time honestly.

My answer: probably, but it's not close enough to be obvious, and the thing that swings it isn't Devin, it's how much of an engineer's year goes to owning 13 apps after they exist.

## Assumptions

I'm guessing at two of these and the client should correct me.

- Engineer fully loaded ~$250K/yr. Call it $5K/week.
- 13 apps at steady state (3 now + 10 planned).
- ~300 non-engineering users. Guess. The real number is in their Power Platform admin center.
- Power Apps Premium $20/user/mo. Per-app meter $10/active user/app/mo. (Microsoft pricing page, Nov 5 2026.)
- Devin Teams $80/mo + $40/seat. (devin.ai/pricing, Nov 5 2026.)
- Per-app build cost measured in log.md, session 2.

## If they stay on Power Apps

$250K today. What happens with 10 more apps depends on their plan, which I don't know:

- On Premium, roughly flat unless new people need seats.
- On the per-app meter, 300 users x 10 apps x $120/yr is another ~$360K. I doubt they're on this plan at that bill size, but worth asking.

Building apps isn't free on Power Apps either, someone in ops spends days on each one. Ownership and on-call are Microsoft's problem, which is a real part of what they're paying for.

## If they build

One-time: ~3 engineer-weeks for the core (auth adapter, permissions, audit, state machine, CI, deploy) plus about a week for security and compliance to review and sign off. ~$20-25K.

Per app: ~2 engineer-days to write the spec and review the PR. Devin's part is minutes and cents. 10 apps, ~$20K.

Devin plan: $2-6K/yr for 2-10 seats on Teams. Hosting is on infra they already run.

Ownership: this is the number. Someone has to own 13 apps that compliance can't work without. Schema changes, "can you add a filter," security patches, being paged when the KYC queue is down. I think it's between a third and a full engineer depending on how much of the change work actually flows through Devin. $75-250K/yr.

Opportunity cost: every week here is a week not on the product. For a Series C that's probably the biggest line and I can't put a number on it.

## Where it lands

| ownership load | build cost/yr | vs $250K buy |
|---|---|---|
| 0.3 FTE | ~$85K | ~$165K better |
| 0.6 FTE | ~$160K | ~$90K better |
| 1.0 FTE | ~$260K | wash, with more risk |

If the owner is half an engineer, build wins clearly. If it drifts to a full engineer, you've broken even and taken on a bunch of risk for customization you may not need.

Before the pilot I'd want two numbers from them: which Microsoft plan, and distinct monthly active users across the three apps.
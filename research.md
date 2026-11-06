# Research notes: Power Apps, and what Devin Cloud is next to it

I wanted three things before touching code: what Power Apps actually sells, what it really costs once you're past the pricing page, and where teams hit walls with it. Then the same for Devin Cloud, so I'm comparing like with like. Everything below is from the sources at the bottom, checked Nov 5 2026. Also places where I'm guessing, I say so.

## What Power Apps is

Microsoft's low-code platform for internal apps. It sits inside Power Platform with Power Automate (workflows), Dataverse (the managed data store), Power Pages (external sites) and Power BI. Two kinds of apps:

- Canvas apps. Drag-and-drop UI, Power Fx formulas (Excel-style), any data source via connectors. This is what most teams mean by "a Power App." I am almost certain this is what the client's three tools are.
- Model-driven apps. Generated from a Dataverse data model, more structured, less flexible UI. Microsoft's newer AI/"agentic" features and Copilot chat ship for model-driven first; for canvas they're preview or absent.

## Why companies actually pay for it

It's not the builder. It's everything around the builder that nobody has to own.

- Speed without engineers. An ops person ships a queue or a form in days with no backlog ticket. For a 60-engineer startup that's the real draw: the product team doesn't get interrupted.
- The boring 80% is bundled. Entra ID login, role-based sharing, hosting, mobile, backups, 1,000+ connectors, Dataverse, workflow via Automate.
- I see that the governance is a product feature. Environments (dev/test/prod), DLP policies that put every connector in a business / non-business / blocked group so data can't cross between them, Managed Environments for tenant-wide admin controls, pipelines and managed solutions for promoting apps between environments. There's a Center of Excellence starter kit that's basically a governance program in a box.
- Auditors already know it. SOC 2 / BSA-AML reviewers have seen Dataverse audit logs before. That's worth real money to a fintech. If you build your own, you have to get a new evidence format accepted.
- Also they only have to point at Microsoft for any issues. Microsoft is on call for uptime and patches, not your engineers.

## Pricing, and the parts that aren't on the pricing page

Headline (Microsoft's page, Nov 2026):

- Power Apps Premium: $20/user/month, paid yearly. Unlimited apps and pages for that user, all connectors incl. premium and on-prem, Dataverse 250 MB database + 2 GB file per user (pooled at tenant level), Power Automate rights inside the app, Managed Environments. $12/user/month at a 2,000-seat minimum.
- Per-app pay-as-you-go meter: $10 per active user per app per month, billed through Azure. "Active" = opened the app at least once that month.
- Dataverse database capacity add-on: $40/GB/month.
- Developer plan: free, three environments, not licensed for production.

The parts you find by reading the licensing deck instead of the pricing page:

- The old $5/user/app subscription was removed from the licensing guide on Jan 2 2026 for most purchasing channels, then restored for CSP (reseller) customers in April. Whether the client can still buy it depends on how they buy Microsoft. Their renewal terms may already be moving under them.
- M365 licenses include some Power Apps rights, but only with standard connectors. The moment an app touches a premium connector or Dataverse, every user of that app needs a paid Power Apps license. This is how bills jump.
- Power Automate Premium is a separate $15/user/month if a flow needs premium connectors outside an app context.
- There are per-user daily API request allocations tied to license type. Heavy apps can hit them.
- Dataverse storage is pooled and runs out; the add-on is $40/GB/month, which is expensive storage.

What the math says about the client. 60 engineers × $20 × 12 = $14.4K/yr. They pay $250K. So either roughly 1,000 Premium seats, or fewer seats plus Dataverse capacity, Automate Premium, or a partner retainer. Either way the bill is driven by the people who *use* the apps (compliance analysts, support, finance), not the engineers who'd build replacements. That asymmetry is most of the build-vs-buy argument: a custom app has zero marginal seat cost. I don't know which plan they're on or their monthly active users. Both numbers are in their Power Platform admin center and I'd ask for them before a pilot.

## Where it breaks

My thoughts: 

- Delegation. A canvas app pushes a query to the data source only if every function in the formula is delegable for that source. If not, it pulls the first 500 rows (configurable up to 2,000) and runs the rest locally. Past that, results are silently wrong. Dataverse supports exact counts up to 50,000; SharePoint doesn't assign counts at all. A KYC queue with real volume hits this.
- No real engineering workflow. Canvas apps aren't plain text. Diffs, code review, unit tests and CI are awkward. ALM exists (solutions, pipelines) but it's its own discipline and most teams at this size don't run it.
- Customization wall. Complex UI, custom logic, performance tuning, non-Microsoft integrations. You end up writing code anyway: PCF controls, custom connectors, Azure Functions. At that point you have an engineering project with a license bill attached.
- Per-user economics. Cost scales with every consumer who opens an app. A tool for 300 ops staff costs far more to license than to build and host.
- You are locked in. Data in Dataverse, identity in Entra, workflows in Automate. Leaving later is a migration project, which is part of why I'd keep the existing three apps where they are and only build new ones on the new path.

## Devin Cloud, for comparison

My thoughts: 

- Devin is an autonomous agent: give it a task, it works on its own VM (shell, editor, browser) in Cognition's cloud, opens a PR. Driven from app.devin.ai, Slack/Linear, or the CLI. "Devin Cloud" as opposed to Devin Local, which runs the agent on an engineer's machine inside Devin Desktop. The ticket-in, PR-out, nobody-watching workflow only exists in Cloud mode, which is why that's the product this is about.
- Pricing (devin.ai/pricing, Nov 5 2026). Seat-based now, not compute-based: Free, Pro $20/month per person (includes Devin Cloud), Max $200/month, Teams $80/month + $40 per engineer seat up to 200 users, Enterprise custom with SAML/OIDC SSO, central admin controls, dedicated deployment. Extra usage at API pricing. There's a per-message on-demand spend cap an admin sets ($20 default in my workspace).
- Security model. The reasoning ("Brain") always runs in Cognition's cloud. The execution environment ("Devbox") is either Cognition's multi-tenant cloud with one isolated VM per session, or a single-tenant VPC on the customer's side connected over PrivateLink/IPSec. Encrypted in transit and at rest; customer-managed keys on Enterprise. Secrets are loaded as env vars for a session and hidden in the UI.
- How you give it conventions. Skills (`SKILL.md` files under `.agents/skills/`, open Agent Skills standard) and `AGENTS.md`, both committed to the repo. Playbooks live in the web UI. The Knowledge feature is being deprecated in favor of Skills. I built on Skills for that reason; files in git are what a client would keep maintaining. Only one Skill is active at a time per the docs.
- Other things I noticed using it. It keeps a per-user memory (it recorded "no PR history rewrites" after I told it once). It auto-saves environment setup for later sessions. It has an API for creating sessions from code, which is how you'd wire a ticket queue to it.

Devin itself costs almost nothing here. The real cost is engineer hours, which is what economics.md is about

## What I'd still want to find out

- Which Microsoft plan they're on, and distinct monthly active users across the three apps. This decides most of the economics.
- Whether any of their apps use premium connectors or Dataverse specifically, or whether they could have been on seeded M365 rights the whole time.
- Who maintains the three existing apps today, and how many hours a month. If it's an ops person, building moves that work onto engineering and I'd want the VP to say that out loud.
- What their auditors currently accept as the audit trail so the new one can be designed to match.

## Sources

- Power Apps pricing: https://www.microsoft.com/en-us/power-platform/products/power-apps/pricing
- Power Platform licensing deck, Oct 2026 (per-app meter, Automate, API limits): https://www.licensingschool.co.uk/wp-content/uploads/2026/10/Power-Platform-Licensing-Deck-October-2026.pdf
- Per-app plan removal and CSP restoration, Jan–Apr 2026: https://www.alphabold.com/power-apps-pricing/
- Delegation and query limits: https://learn.microsoft.com/en-us/powerapps/maker/canvas-apps/delegation-overview
- Small data payloads / delegation by source: https://learn.microsoft.com/en-nz/power-apps/maker/canvas-apps/small-data-payloads
- Managed Environments: https://learn.microsoft.com/en-us/power-platform/admin/managed-environment-overview/
- API request limits and allocations: https://learn.microsoft.com/en-us/power-platform/admin/api-request-limits-allocations
- Devin pricing: https://devin.ai/pricing
- Devin Skills: https://docs.devin.ai/product-guides/skills
- Devin Knowledge (deprecation note): https://docs.devin.ai/onboard-devin/knowledge-onboarding
- Devin enterprise / VPC architecture: https://docs.devin.ai/enterprise/vpc/overview
- Devin Cloud vs local (CLI docs): https://docs.devin.ai/cli/cloud.md

Pricing page screenshots are in `docs/`.
---
name: side-hustle-monetization
description: 'Build an AI credit-based monetization plan for TinyNotie. Use when you need usage limits, free starter credits, paid credit packs, per-feature credit charging, and cost-safe growth while using your own OpenAI key.'
argument-hint: 'Optional: target user segment, monthly revenue goal, and weekly founder time'
user-invocable: true
---

# TinyNotie Side Hustle Monetization

## Outcome
Create and execute a lightweight, measurable credit-wallet business plan so AI features pay for themselves and generate profit.

## Default Profile For This Workspace
- Target segment: small travel groups.
- Pricing model: freemium plus paid AI credits (no subscription required).
- Initial revenue goal: USD 300 MRR.
- Time budget: 6 to 8 hours per week.

If the user provides different inputs, replace this default profile and rerun the plan.

## When To Use
- You want to add paid features to TinyNotie.
- You need a credit-pack pricing and consumption plan.
- You want a weekly execution workflow with measurable goals.
- You want to cap AI usage so users cannot consume unlimited cost on your API key.

## Inputs To Gather First
- Current monthly active users (or weekly active users if monthly is unknown).
- Current retention signal: D7 or D30 if available.
- Available founder time per week.
- AI cost baseline: average token and OCR cost per feature action.
- Tech constraints: frontend and backend features you can ship in 1 to 2 weeks.
- Target initial monthly revenue goal.

If any inputs are missing, continue with assumptions and label them explicitly.

## Procedure
1. Define the wallet model and charging principles.
Use this baseline:
- Core app remains free.
- AI actions consume credits.
- New users receive free starter credits one time.
- Users buy top-up credit packs when balance is low.

2. Pick AI features suitable for credit charging.
Charge credits for actions with direct API cost and clear user value:
- AI chat with database or group context.
- Receipt scan and auto-item extraction.
- AI trip recap and settlement explanation.
- Translation via AI endpoint.
- Bulk AI processing (multiple receipts or batch summaries).

Do not charge credits for basic CRUD actions like adding members or manual trips.

3. Map feature actions to credit costs.
Create a credit table with simple, predictable values:
- Short AI chat answer: low credits.
- Long AI analysis or summary: medium credits.
- Receipt scan: medium credits.
- Batch or heavy operation: high credits.

Pricing rule:
- Set pack value so expected revenue per credit is at least 2x average cost per credit.
- Keep the first credit table simple. Avoid more than 4 pricing tiers in week 1.

4. Design credit packs and free starter credits.
Default launch packs:
- Starter free credits for new user signup.
- Small pack for low-friction first purchase.
- Medium pack as most popular option.
- Large pack with best value for power users.

Starter free credit policy:
- Give enough for first meaningful success, not unlimited exploration.
- One-time grant per verified account.
- Optional extra bonus for referral or first group creation.

5. Add credit limit UX and conversion moments.
Place prompts where value is obvious:
- Before running heavy AI actions, show expected credit cost.
- On success screen, show credits spent and outcome.
- At low balance threshold, show top-up CTA.
- At insufficient credits, show paywall with recommended pack.

6. Add abuse prevention and cost protection.
Required safety rules:
- Server-side credit check before every AI call.
- Atomic credit deduction log for each paid action.
- Per-user and per-group rate limits.
- Idempotency on retries to avoid double charge.
- Daily soft cap for new accounts to block abuse.

7. Set weekly execution cadence.
Use this weekly loop:
- Monday: set one growth task and one monetization task.
- Midweek: ship one small improvement.
- Friday: review funnel metrics and user feedback.
- Weekend: adjust next week plan based on the highest drop-off stage.

Timebox guidance for 6 to 8 hours per week:
- 2 hours usage-cost review and pricing adjustments.
- 3 hours credit wallet or paywall iteration.
- 1 hour onboarding and free-credit messaging.
- 1 to 2 hours user interview and purchase feedback.

8. Instrument minimum metrics.
Track at least:
- Activation rate.
- AI action success rate.
- Paid conversion from low-credit prompt.
- Credits purchased per paying user.
- Credit burn rate per active user.
- Gross margin after AI costs.
- 30-day repeat purchase rate.

9. Define launch and quality gates.
Do not launch credit payments unless all are true:
- Credit balance checks are enforced server-side.
- Every credit deduction is logged with action type and timestamp.
- Failed AI calls either auto-refund credit or never deduct.
- Error messaging is clear when user lacks credits.
- Basic analytics events are verified end-to-end.

## Completion Checklist
- A single primary customer segment is selected.
- AI chargeable actions and non-chargeable actions are documented.
- Starter free-credit amount is defined.
- At least one credit-pack pricing test is running.
- Metrics dashboard (even simple spreadsheet) is updated weekly.
- Next two monetization tasks are queued and scoped.

## Deliverables This Skill Should Produce
- Credit-wallet monetization strategy brief for TinyNotie (one page).
- 4-week ship plan with weekly tasks.
- AI feature credit table and charging policy.
- Credit-pack pricing experiment plan and success thresholds.
- Weekly metrics review template.

## Example Prompts
- "/side-hustle-monetization build a credit system for AI chat and receipt scan"
- "/side-hustle-monetization define free starter credits and paid credit packs"
- "/side-hustle-monetization set credit costs per AI feature with profit guardrails"

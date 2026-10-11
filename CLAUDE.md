# Servora

Multi-tenant restaurant-management SaaS: POS, kitchen display, QR menus, reservations, inventory, team roles, Stripe billing.
Next.js 16 (App Router) · Prisma 7 on Postgres · NextAuth v5 (credentials, JWT) · Tailwind v4 + shadcn/ui · React Query.

## Conventions

- **Tenancy:** every API route uses `withAuth` from `src/lib/api.ts` and scopes every query by the session's `restaurantId`. Never use `db.restaurant.findFirst()` to pick a tenant.
- **Validation:** zod schemas live in `src/lib/validations.ts`. They double as PATCH schemas via `.partial()`, so don't add `.default()`, and keep `undefined` as `undefined` in transforms.
- **Money:** prices and tax are computed server-side (`src/lib/pricing.ts`). Never trust totals from the client.
- **Plans:** limits and features live in `src/lib/plans.ts`. Gate APIs with `withAuth(..., { feature })` and pages with `<FeatureGate>`.
- **Route files** may only export HTTP handlers. Put shared constants in `src/lib/*`.
- **Schema changes:** use `npx prisma migrate dev --name <change>`. Never `db push` against shared databases, and never run the seed without `SEED_RESET=true` intentionally.
- **Design:** tokens are in `src/app/globals.css` ("Service Pass": ink + saffron `brand`, Geist / Geist Mono / Bricolage Grotesque). Don't hard-code hex colours in components.

## Model Strategy

- Don't switch models mid-session, because it breaks the prompt cache and re-processes the whole context. Assign models per role instead.
- Use custom subagents defined in `.claude/agents/`, each with a fixed `model` in its frontmatter:
  - `planner` uses opus, for architecture and planning
  - `coder` uses sonnet, for implementation
  - `tester` uses haiku, for running tests and checking results
- The main session delegates to these subagents. Delegate by role: plan with `planner`, implement with `coder`, verify with `tester`.
- Optionally use the `opusplan` model alias, which uses Opus in plan mode and Sonnet when executing. It doesn't cover Haiku, so keep the `tester` subagent for testing.
- Check the current Claude Code docs for the exact subagent frontmatter fields before creating the agent files, since they may have changed.

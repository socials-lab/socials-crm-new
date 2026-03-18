# UI Redesign Integration Plan (Lovable `main` -> Supabase branch)

## Goal

Integrate the client's CRM redesign (light/dark, updated visual system) from `main` into `feature/supabase-implementation-plans` without merging branches.

`main` defines product intent and visual direction. The Supabase branch keeps technical correctness, data integrity, and production behavior.

## Non-Negotiable Rule

- Do not merge `main` into the Supabase branch.
- Port redesign behavior manually and intentionally.
- Preserve Supabase branch functionality first, then match redesign visuals.

## Phase 1 - Scope and source extraction

1. Identify redesign-related commits on `origin/main` (theme/light-dark/sidebar/style/UI commits).
2. Build a "source pack" of only relevant files from `main`:
   - `src/index.css`
   - `tailwind.config.ts`
   - app shell/layout files (`src/components/layout/*`, `src/components/ui/sidebar.tsx`)
   - shared visual primitives (`src/components/shared/*`, `src/components/ui/*` where style changed)
3. Ignore business-logic-only commits in this phase.
4. Use the Webflow style guide as reference for token naming and spacing/typography rules:
   - https://socials-bcdde4.webflow.io/style-guide-fe8a5d8b-f436-4ba6-acca-b19ab011af33#structure-classes

Deliverable: final list of redesign commits + file matrix (source in `main` -> target in Supabase branch).

## Phase 2 - Design token foundation

1. Normalize color tokens in `src/index.css` for both light and dark.
2. Keep semantic token model (background, foreground, card, muted, accent, border, status, sidebar).
3. Align `tailwind.config.ts` mappings with final token set.
4. Add missing global utility classes only when reused across multiple screens.
5. Ensure toasts/overlays/modals consume semantic tokens, not hard-coded colors.

Deliverable: stable global theme layer with parity in light + dark.

## Phase 3 - Theme runtime correctness

1. Ensure top-level theme provider is mounted once in app bootstrap.
2. Define explicit default mode strategy (system vs fixed) based on `main` behavior.
3. Verify class-based dark mode (`dark` class) toggles all tokenized surfaces.
4. Verify no component bypasses tokens with hard-coded background/text colors.

Deliverable: reliable runtime theming with no visual regressions between routes.

## Phase 4 - App shell migration first

1. Port shell/layout visuals first:
   - header
   - desktop sidebar
   - mobile bottom nav
   - navigation active/hover states
2. Preserve current role/permission logic untouched.
3. Keep route behavior exactly as in Supabase branch while updating visuals.

Deliverable: global chrome matches redesign before page-level work starts.

## Phase 5 - Shared component pass

1. Update shared components and UI primitives used across many pages:
   - badges, cards, dialogs, command/search, inputs, textarea, tabs, table wrappers
2. Remove style divergence by centralizing recurring patterns in shared components.
3. Avoid page-local one-off color overrides unless required by redesign.

Deliverable: most pages inherit redesign automatically through shared primitives.

## Phase 6 - Page rollout in priority waves

Wave A (highest frequency):
- Dashboard, Leads, Engagements, Clients

Wave B:
- Modifications, Extra Work, Invoicing, Meetings, Notifications

Wave C:
- Settings, Analytics, SOP, Academy, Recruitment, long-tail pages

For each wave:
1. Port visuals from `main` screen by screen.
2. Keep existing Supabase data flow and mutation behavior.
3. Resolve conflicts by preserving functional code paths and layering redesign styles on top.

Deliverable: controlled rollout with reduced regression risk.

## Phase 7 - QA and parity gates

For every migrated surface:
1. Light mode visual check.
2. Dark mode visual check.
3. Mobile + desktop responsive check.
4. Permission/role state check (hidden/disabled sections still correct).
5. Console check for React/Radix warnings.

Extra gate:
- Compare key screens against `main` and style guide for spacing, hierarchy, and contrast.

## Phase 8 - Hardening and done criteria

Done only when:
- App shell + target pages match redesign intent in light and dark.
- No broken business flows in Supabase branch.
- No merge from `main` was used.
- No unresolved hard-coded theme colors remain on migrated surfaces.

## Execution notes for this repository

- Current branch drift is very large, so commit-by-commit cherry-pick is not the primary strategy.
- Preferred strategy: selective manual port by file/functionality area.
- Treat each redesign item as "visual spec from `main`", implemented with Supabase branch architecture.

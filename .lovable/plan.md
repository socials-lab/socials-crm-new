

# AI Chatbot for Agency Knowledge Base

## Overview
Create an AI-powered chatbot accessible from the CRM sidebar that answers questions about agency SOPs, pricing/offers, and colleague rewards. The chatbot will use Lovable AI (Gemini) with a rich system prompt containing all agency knowledge (services, pricing, rewards, SOPs).

## Architecture

```text
┌─────────────────┐     ┌──────────────────────┐     ┌──────────────┐
│  Chat UI (FAB)  │────▶│  Edge Function        │────▶│  Lovable AI  │
│  Bottom-right   │◀────│  /agency-assistant    │◀────│  Gateway     │
│  Slide-out panel│     │  (system prompt with  │     └──────────────┘
└─────────────────┘     │   agency knowledge)   │
                        └──────────────────────┘
```

## What the chatbot will know (baked into system prompt)

1. **Service catalog** — all services, tier pricing (Growth/Pro/Elite), spend thresholds
2. **Reward configurations** — colleague compensation per role per service per tier (from `serviceRewards.ts`)
3. **Service defaults** — deliverables, requirements, frequency, turnaround (from `serviceDefaults.ts`)
4. **Service details** — benefits, setup steps, tier comparison (from `serviceDetails.ts`)
5. **Pricing rules** — target margin 66%, expansion multipliers, intro discount logic
6. **SOP articles** — fetched from Supabase `sop_articles` table at query time

## Implementation Steps

### 1. Create Edge Function `agency-assistant`
- Accepts `{ messages, sopContext? }` from frontend
- Builds a comprehensive system prompt containing:
  - Full service catalog with pricing tiers
  - Reward table per role/service/tier
  - Pricing rules (margin targets, multipliers, discounts)
  - Deliverables and requirements per service
- Fetches SOP articles from DB to include as context
- Streams response from Lovable AI Gateway
- Uses `google/gemini-3-flash-preview` model

### 2. Create Chat UI Component
- Floating action button (bottom-right) with a chat icon
- Slide-out panel with conversation history
- Markdown rendering for responses (react-markdown)
- Streaming token-by-token display
- Pre-built quick action buttons: "Jak nacenit nabídku?", "Jaké jsou odměny?", "Co potřebuji k onboardingu?"

### 3. Add to App Layout
- Render the chat FAB in `AppLayout.tsx` (visible on all pages, only for authenticated CRM users)
- Conversation state persisted in React state (no DB storage needed initially)

### 4. Register Edge Function
- Add `[functions.agency-assistant]` to `supabase/config.toml`

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/agency-assistant/index.ts` | Create — edge function with system prompt + SOP query |
| `src/components/assistant/AgencyAssistant.tsx` | Create — chat panel UI |
| `src/components/assistant/AssistantFAB.tsx` | Create — floating button |
| `src/components/layout/AppLayout.tsx` | Modify — add AssistantFAB |
| `supabase/config.toml` | Modify — register function |

## System Prompt Strategy

The system prompt will be built from hardcoded constants (serviceRewards, serviceDefaults, serviceDetails, services) serialized as structured text. SOP content will be fetched from `sop_articles` + `sop_categories` tables. This avoids needing embeddings or vector search — the full context fits within Gemini's large context window.


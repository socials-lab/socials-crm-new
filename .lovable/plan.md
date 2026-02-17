

## Fix: Sticky sidebar + rename "články" to "SOP"

### Changes

**`src/pages/SOP.tsx`**:
1. Make the left category sidebar truly fixed during scroll using `position: sticky; top: 1.5rem` with a fixed height and its own `overflow-y-auto`, while the right article column scrolls naturally with the page.
2. Replace all occurrences of "články"/"článek"/"článků" with "SOP" throughout the page (headings, empty states, counts).
3. Rename "Všechny články" to "Všechny SOP".

**`src/components/sop/SOPCategoryCard.tsx`**:
- Update the article count label from "článek/články/článků" to "SOP".

**`src/components/sop/SOPArticleCard.tsx`**:
- No text changes needed (no "články" references here).

### Technical details

The current sidebar has `sticky top-0 self-start` but the parent flex container and page wrapper likely prevent it from working. The fix:
- Ensure the flex container has no `overflow: hidden` and uses `items-start` alignment.
- Set sidebar to `sticky top-6` with `max-h-[calc(100vh-6rem)] overflow-y-auto`.
- The right column remains `flex-1 min-w-0` and scrolls naturally.

All Czech text "článek/články/článků" will be replaced with just "SOP" (e.g., "19 SOP" instead of "19 článků").


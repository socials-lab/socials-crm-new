

## Plan: Change "Role na zakázce" from text input to dropdown

### Change

**`src/components/forms/AssignmentForm.tsx`**
- Replace the free-text `Input` for `role_on_engagement` with a `Select` dropdown
- Predefined options:
  - Meta Ads Specialist
  - PPC Specialist
  - Graphic Designer
  - Video Editor
  - Sales Specialist
  - Account Manager
- Update the auto-detect logic: when a designer colleague is selected, auto-set role to "Graphic Designer" (already done) or "Video Editor" if position contains "video"


-- Remove the premature trigger that fires on stage change to 'won'
-- The notification should fire after actual conversion (client creation),
-- not just when the stage changes.
DROP TRIGGER IF EXISTS on_lead_converted ON leads;
DROP FUNCTION IF EXISTS notify_lead_converted();

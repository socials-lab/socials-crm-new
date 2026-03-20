# Email Open Tracking for CRM Leads

## Executive Summary
Yes, this feature is possible and supported by providers like Resend, SendGrid, Postmark, and Mailgun.

Open tracking is useful as a directional signal, but it is not a perfect per-person fact.

## How It Works
- A small tracking pixel image is embedded into each HTML email.
- When the image is loaded, the provider records an "open" event.
- CRM can ingest these events via webhook/API and show them on each lead timeline.

## Expected Accuracy
- Individual lead level ("did this exact person open"): typically ~50-80% reliable.
- Aggregate reporting ("campaign A vs campaign B"): typically ~70-90% directionally useful.
- In privacy-heavy environments (Apple Mail privacy, strict corporate filtering), individual reliability can drop to ~30-60%.

## Why Accuracy Is Not 100%
- Some systems prefetch or scan emails and trigger false opens.
- Some recipients block images or read plain-text emails, causing missed opens.
- Multiple devices/clients can inflate open counts.

## Practical Recommendation
- Use open tracking as a **likely engagement** signal, not as a hard fact.
- In CRM, label this as "likely opened" and avoid business-critical automations based only on opens.
- For high-confidence automation, prioritize stronger signals (reply/click/conversion events).

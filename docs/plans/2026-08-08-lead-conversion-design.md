# LoanInCA lead conversion design — 2026-08-08

## Goal

Turn the existing Loan Finder contact stage into a reliable, measurable consultation submission without exposing borrower financial inputs to Google Analytics.

## Chosen approach

Keep the existing /api/leads and D1/Telegram delivery path rather than adding another form provider. Harden the public submission boundary with server-side normalization, length limits, contact validation, and a honeypot. Preserve the current seven-question result because it gives David useful context, but send only the event name and page path to GA4.

After a successful server response, emit the standard GA4 generate_lead event. Continue emitting the existing first-party lead_submitted event for operational continuity. A failed or rejected submission must emit neither conversion event.

## User experience

The contact stage asks only for a name, preferred reply method, and one contact value. It explains that the answers and generated summary are sent to David. While submitting, the button is disabled and its label changes. Success and failure messages are announced through an ARIA live region. Duplicate clicks are prevented.

## Data handling

The browser sends the contact fields, generated scenario summary, source path, and UTM attribution to the first-party endpoint. GA4 receives no name, contact value, requested amount, credit band, income type, immigration status, or scenario summary. The privacy page explicitly identifies Google Analytics and describes the limited analytics payload.

## Verification

Add unit tests for normalization, HTML escaping, honeypot handling, email validation, and missing-contact rejection. Run site validation and existing tests, then deploy through Cloudflare Pages. Verify the production Google tag and create generate_lead as a GA4 key event.

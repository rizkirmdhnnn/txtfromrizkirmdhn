---
{
  "slug": "small-reliable-systems",
  "category": "writing",
  "lang": "en",
  "title": "Small systems, good habits.",
  "summary": "Notes on building applications that are easier to maintain.",
  "date": "2026-09-01",
  "tags": ["Engineering", "DevOps"],
  "demo": true,
}
---

## Start with visibility

Before adding infrastructure, make sure you can understand what is happening in the application. Clear logs and a simple health check are useful first steps.

## Make changes reversible

Small deployments, documented configuration, and a rollback path reduce uncertainty when releasing changes.

## Document the reasoning

Record why a decision was made, as well as how to run the system. That context helps when requirements change.

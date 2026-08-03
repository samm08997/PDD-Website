---
name: Gemini AI Integration status
description: Replit AI Integrations for Gemini is not available for this account; must use user API key.
---

## The Rule

Do NOT attempt `setupReplitAIIntegrations({ providerSlug: "gemini" })` — it returns `{"status":"awaiting_account_upgrade","success":false}` for this workspace.

**Why:** The account does not have Replit AI Integrations enabled for Gemini. Using this callback wastes a turn and breaks the agent loop.

**How to apply:** For Gemini AI features, ask the user for their `GEMINI_API_KEY` via `requestSecrets` and use `@google/generative-ai` SDK directly in the API server. The key is already set as a secret in this project.

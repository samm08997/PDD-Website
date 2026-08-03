---
name: Orval codegen barrel conflict
description: Running codegen regenerates lib/api-zod/src/index.ts with duplicate and conflicting exports causing TS2308 errors.
---

## The Rule

After every run of `pnpm --filter @workspace/api-spec run codegen`, immediately overwrite the barrel:

```bash
echo 'export * from "./generated/api";' > lib/api-zod/src/index.ts
pnpm run typecheck:libs
```

**Why:** Orval's `mode: "split"` generates both `generated/api.ts` (Zod schemas) and `generated/types/*.ts` (TS interfaces) with identical export names (e.g. `GenerateFlashcardsBody`). It then regenerates `lib/api-zod/src/index.ts` to re-export both, causing TS2308 "already exported" errors. The codegen script fails at the typecheck step but orval itself succeeds. Fixing the barrel post-codegen resolves it.

**How to apply:** Any time you modify `lib/api-spec/openapi.yaml` and run codegen, this fix is required before typecheck passes.

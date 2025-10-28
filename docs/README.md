# Documentation index

This folder centralizes all project documentation. The root README is intentionally minimal.

- Architecture: [architecture.md](./architecture.md)
- Data contracts: [data-contracts.md](./data-contracts.md)

Additional references:

- Environment template: [`../env_template`](../env_template)
- Key config: [`src/config/config.ts`](../src/config/config.ts)
- Dev workflows and gotchas (internal): [`.github/copilot-instructions.md`](../.github/copilot-instructions.md)

## Quick run (reference)

```powershell
npm i
npm run dev
# build & preview
npm run build
npm run preview
```

## Notes

- Use `import.meta.env` with `VITE_*` keys (avoid using `process.env`).
- Without an API key the app runs in offline heuristic mode; with `VITE_OPENAI_API_KEY` it switches to online/auto.

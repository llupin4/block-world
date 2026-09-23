# Code readability

Use `npm run format -- path/to/file.ts` on files you change and
`npm run format:check -- path/to/file.ts` to check them. Format existing modules in
separate changes when a full reformat would obscure a functional change.

- Keep `main.ts` focused on assembling components and connecting their lifecycles.
  Put behavior in modules with explicit dependencies that can be exercised independently.
- Name functions and variables for their role. Split multi-action statements and nested
  decisions into readable steps. Keep conventional coordinates such as `x`, `y`, and `z`.
- Use comments for constraints, ordering requirements, and non-obvious reasons.
  Remove narration and obsolete implementation-phase notes. Keep extended design
  explanations in `docs/adr/` and link them where needed.
- Extract modules by responsibility, rather than targeting an arbitrary line count.
  Avoid introducing a shared global context just to move functions between files.
- Preserve simulation order, seeded output, persistence formats, and performance budgets
  during readability refactors. Keep behavior changes separate.

Run `npm test` and `npm run build` for refactors. Use relevant Playwright checks for
browser integration and the existing performance checks for simulation/rendering changes.

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

Run `npm run lint:complexity` to enforce a maximum cognitive complexity of 15 per
function using `sonarjs/cognitive-complexity`. CI runs the same command for pull
requests and pushes to `main`. This measures control flow and nesting, not coverage
or CRAP.

The gate initially covers the five cleaned-up modules listed in `complexityFiles`
in `eslint.config.mjs`. Add modules there as they are refactored; keep the threshold
at 15. Tests and legacy modules are outside this initial scope.

Code Complexity Metrics and SonarJS scores may differ. Compare the same revision
and function before treating the editor score as identical to the CI result.
For example, SonarJS 4.2.1 evaluated the nested functions in the pre-refactor
`createGameMenus` at commit `933f0eb` separately (highest score: 4), rather than
reproducing the editor's reported 34 for the enclosing factory.

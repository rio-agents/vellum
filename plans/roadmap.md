# Roadmap

Unfinished library work, in the intended order. These are plans, not rules: the rules live in [AGENTS.md](../AGENTS.md) and [docs/](../docs/). Start an item only when it is asked for, and check it with a project that uses Vellum (webnotes is the first) as well as with the library's own tests. Delete an item once it is done, and record it in the changelog.

## 1. A build for installed use

Vellum ships TypeScript source. That works while a project links a local checkout (`link:../vellum`), but Node refuses to strip types inside `node_modules`, so an installed copy (for example a pinned git tag, `github:rio-agents/vellum#v0.1.0`) cannot run the `vellum` command or `@rio-agents/vellum/build`.

- Build JavaScript and type declarations into `dist/` (esbuild for the code, `tsc --emitDeclarationOnly` for the types), and point `bin` and the package exports at them.
- Build on install from git (`prepare`), so a project needs no extra step.
- Keep the TypeScript source importable for bundlers during development.
- Tag `v0.1.0` once a project installs the tag and passes its checks.

## 2. Point parameters and accessible hydration

- Bind `DragHandle` to a declared `param.point` by name through a parameter-binding context around the live render, instead of a disconnected callback.
- Convert pointer positions through the enclosing `Panel`, and apply bounds, constraints, arrow-key steps, and a larger-step modifier.
- Give the handle an accessible name, its two-dimensional value, and a visible focus state.
- Keep static rendering free of client behavior, and do not count an unusable point parameter as interactive.

## 3. Client cost

- Keep MathJax out of a page's initial load.
- Redraw numbers that change with a parameter without typesetting them in the browser; load MathJax only when a label's TeX structure changes.
- Measure the initial JavaScript, ordinary control operation, and a dynamic-TeX fixture.

## 4. A scaffold

`vellum new <path>/<id> [--interactive] [--animated]` writes a valid definition, rejects invalid or duplicate ids, and prints the render and review steps. Test it in temporary folders.

## 5. Diagram primitives

Neural-network and transformer diagrams need a vocabulary that plots do not: boxes with labels and named anchor points on their sides, connectors between anchors (straight, elbowed, curved), groups drawn around several boxes, and simple row, column, and stack placement. Design these from real example diagrams and from existing TikZ work, keep placement explicit (no automatic graph layout), and add only what the examples need. The first test is replacing hand-drawn Astro diagrams in webnotes.

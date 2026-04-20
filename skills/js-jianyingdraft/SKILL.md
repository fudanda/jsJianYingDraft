---
name: js-jianyingdraft
description: Build and edit JianYing draft workflows with the jsjianyingdraft TypeScript package. Use when tasks involve creating draft projects, adding tracks and segments, importing SRT subtitles, applying effects/filters/animations, replacing template materials/text, using metadata presets from jsjianyingdraft/metadata, or running Windows export automation with JianyingController.
---

# js-jianyingdraft

## Goal

Implement user requests in this repository by using `jsjianyingdraft` APIs directly instead of hand-editing raw draft JSON.
Prefer typed constructors and preset resolvers, then validate with tests when code changes are introduced.

## Workflow Selection

Choose one path before editing code:

1. Create new draft pipeline:
Use for tasks like "generate a new JianYing draft from media files."

2. Template editing pipeline:
Use for tasks like "load a template and replace media/text while keeping template timings."

3. Subtitle import pipeline:
Use for tasks involving `.srt` files, subtitle styling reuse, or `styleReference` compatibility behavior.

4. Effects and metadata pipeline:
Use for tasks involving preset names, `from_name`, or imports from `jsjianyingdraft/metadata`.

5. Windows export automation pipeline:
Use for tasks involving `JianyingController`, export timeout tuning, or export error handling.

For API details and tested patterns, read [references/workflows.md](./references/workflows.md).

## Implementation Rules

1. Import from package entrypoints:
Use `jsjianyingdraft` for runtime APIs and `jsjianyingdraft/metadata` for full preset catalogs.

2. Create compatible tracks before adding segments:
Create required tracks with `addTrack(TrackType.xxx)` first, then add segments.
If multiple tracks share a type, pass explicit `trackName` to avoid ambiguity.

3. Prefer typed helpers over manual JSON:
Use `Timerange`/`trange`, segment constructors, material classes, and resolver helpers.
Do not manually mutate JSON payloads unless no API exists.

4. Preserve migration compatibility:
When request is migration-focused, keep snake_case aliases and py-style behavior compatible.
When request is greenfield TypeScript, prefer camelCase APIs.

5. Handle probing and export failures explicitly:
If media probing fails, pass explicit `duration`/`width`/`height`.
In automation workflows, distinguish `DraftNotFoundError`, `ExportTimeoutError`, and generic `AutomationError`.

## Execution Checklist

When implementing a user request:

1. Identify workflow type from "Workflow Selection".
2. Open [references/workflows.md](./references/workflows.md) and pick the nearest recipe.
3. Implement with minimal API surface change.
4. Add or update tests in `test/` when behavior changes.
5. Run targeted tests first, then broader checks as needed (`npm run test`, optionally `npm run check:release`).
6. Summarize:
what changed, why, and any known limitations (for example Windows-only automation).

## Boundaries

- Treat `src/metadata.generated.ts` as generated content; avoid manual edits unless explicitly requested.
- Keep docs and examples aligned with current API names.
- Do not claim cross-platform automation support for `JianyingController`; it is Windows-focused.

# jsjianyingdraft

## 0.3.0

### Minor Changes

- Expand lightweight preset shortcuts beyond effects/filters by adding built-in names and resolvers for audio effects, video/text animations, transitions, masks, and mix modes.

  Also allow string-based presets in segment APIs and add tests/docs for the new shortcuts.

## 0.2.0

### Minor Changes

- Add major feature expansion for template editing and media effects.

  - Add template-mode editing APIs (`importTrack`, `replaceMaterialBySeg`, `replaceText`) and related track models.
  - Add `EffectSegment`/`FilterSegment` and global `addEffect`/`addFilter` workflow.
  - Add advanced text styles: `TextBorder`, `TextBackground`, `TextShadow`.
  - Add metadata preset support and full generated preset catalog under `jsjianyingdraft/metadata`.
  - Split default/light metadata path from full metadata catalog to keep main entry smaller.

## 0.1.1

### Patch Changes

- 93e5126: Migrate project tooling to `tsdown` + `Vitest` + `Changesets`, and add pre-publish checks with `publint` and `Are the types wrong?`.

  Also align package export/type entries with `tsdown` output (`.mjs/.cjs` and `.d.mts/.d.cts`) to ensure clean package validation.

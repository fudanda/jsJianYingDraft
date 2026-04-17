# jsjianyingdraft

## 0.5.0

### Minor Changes

- Migrate Windows automation export controller from `pyJianYingDraft`.

  - Add `JianyingController` with `getWindow`, `switchToHome`, and `exportDraft`.
  - Add export enums `ExportResolution` and `ExportFramerate`.
  - Add migration-friendly snake_case aliases: `Jianying_controller`, `Export_resolution`, `Export_framerate`.
  - Add `AutomationError` and `DraftNotFoundError` for automation failure mapping.
  - Add tests and documentation for Windows export automation usage.

- Implement media metadata auto-probing for local materials.

  - `VideoMaterial` now auto-detects `duration`, `width`, and `height` when possible.
  - `AudioMaterial` now supports omitted `duration` and auto-detects it when possible.
  - Auto-probing prefers `ffprobe`, with lightweight fallbacks for common image formats (PNG/JPEG/GIF/BMP) and WAV audio.
  - Constructor options still allow explicit manual overrides.

- Add font metadata compatibility exports for migration from `pyJianYingDraft`.

  - Generate and export full font presets as `FONT_PRESETS` under `jsjianyingdraft/metadata`.
  - Add Python-style font enum aliases: `FontType` and deprecated `Font_type`.
  - Add `resolveFontMeta` helper to resolve font presets by key or display name.
  - Add tests and docs for font metadata compatibility.

## 0.4.0

### Minor Changes

- Add Python-style compatibility aliases to ease migration from `pyJianYingDraft`.

  - Export legacy class/enum aliases (for example `Script_file`, `Draft_folder`, `Track_type`, `Shrink_mode`).
  - Add deprecated `snake_case` method aliases on core APIs (`ScriptFile`, `DraftFolder`, segment classes, and template media track helpers).
  - Add tests covering alias exports and method behavior.

- Add Python-style metadata enum exports and compatibility aliases under `jsjianyingdraft/metadata`.

  - Add enum-style preset groups like `VideoSceneEffectType`, `VideoCharacterEffectType`, `FilterType`, `AudioSceneEffectType`, `ToneEffectType`, `SpeechToSongType`, `IntroType`, `OutroType`, `GroupAnimationType`, `TextIntro`, `TextOutro`, `TextLoopAnim`, `TransitionType`, `MaskType`, and `MixModeType`.
  - Add deprecated snake_case metadata aliases for migration compatibility (for example `Video_scene_effect_type`, `Filter_type`, `Text_intro`).
  - Add tests and docs for the new metadata compatibility exports.

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

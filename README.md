# jsJianYingDraft

TypeScript migration of `pyJianYingDraft` with npm packaging support.

## Current scope (v0.3.x)

- Draft folder operations: create/list/remove/load/duplicate
- Core draft file read/write: `ScriptFile`
- Core time helpers: `SEC`, `tim`, `Timerange`, `trange`, `srtTstamp`
- Basic tracks and segments: video/audio/text/sticker
- Advanced text style: `TextBorder`, `TextBackground`, `TextShadow`, font meta (`TextSegment` `font` / `setFont`)
- Keyframe APIs: `VisualSegment.addKeyframe`, `AudioSegment.addKeyframe`, `KeyframeProperty`
- Video advanced APIs: `addAnimation`, `addMask`, `addTransition`, `setMixMode`, `addBackgroundFilling`
- Template-mode editing APIs: `loadTemplate`, `getImportedTrack`, `replaceMaterialByName`, `replaceMaterialBySeg`, `replaceText`, `importTrack`
- Global and segment-level visual effect APIs: `addEffect`, `addFilter`, `EffectSegment`, `FilterSegment`
- Preset string shortcuts for audio effects / video-text animations / transitions / masks / mix modes
- Full metadata preset collections (subpath import): `jsjianyingdraft/metadata`
- Bundled JianYing draft templates
- Windows automation export controller: `JianyingController`, `ExportResolution`, `ExportFramerate`
- Media metadata auto-probing for local files (duration / width / height)
- Python-style compatibility aliases (`snake_case`) for smoother migration
- Python-style metadata enum aliases under `jsjianyingdraft/metadata` (for example: `VideoSceneEffectType`, `FilterType`, `TextIntro`, `FontType`)

## Install

```bash
npm install jsjianyingdraft
```

## Build

```bash
npm install
npm run build
```

## Test

```bash
npm run test
```

## Versioning & release

```bash
npm run changeset
npm run version-packages
npm run release
```

## Pre-publish checks

```bash
npm run check:release
```

## Quick example

```ts
import {
  AudioMaterial,
  AudioSegment,
  DraftFolder,
  TrackType,
  VideoMaterial,
  VideoSegment,
  trange
} from "jsjianyingdraft";

const folder = new DraftFolder("D:/JianYingDrafts");
const script = folder.createDraft("demo-ts", 1920, 1080, { allowReplace: true });

script.addTrack(TrackType.audio).addTrack(TrackType.video).addTrack(TrackType.text);

const video = new VideoMaterial("D:/assets/video.mp4", { duration: 8_000_000, width: 1920, height: 1080 });
const audio = new AudioMaterial("D:/assets/audio.mp3", { duration: 8_000_000 });

script
  .addSegment(new VideoSegment(video, trange("0s", "8s")))
  .addSegment(new AudioSegment(audio, trange("0s", "8s")))
  .save();
```

## Windows export automation

```ts
import {
  ExportFramerate,
  ExportResolution,
  JianyingController
} from "jsjianyingdraft";

const ctrl = new JianyingController();
ctrl.exportDraft("demo-ts", {
  outputPath: "D:/exports/demo-ts.mp4",
  resolution: ExportResolution.RES_1080P,
  framerate: ExportFramerate.FR_30,
  timeout: 1200
});
```

## Notes

- `JianyingController` currently relies on Windows UI automation and is only supported on Windows.
- Windows automation export flow currently targets JianYing 6.x and below (same limitation as pyJianYingDraft).
- `VideoMaterial` and `AudioMaterial` now auto-detect media metadata when possible (prefers `ffprobe`, with lightweight fallback parsing for common PNG/JPEG/GIF/BMP images and WAV audio).
- You can still override detected values manually via constructor options (for example `duration`, `width`, `height`).
- `importSrt` now supports advanced style options: `styleReference` and `clipSettings` (plus deprecated snake_case aliases `style_reference` / `clip_settings` / `text_style` / `time_offset`).
- `addEffect` and `addFilter` now accept either a custom metadata object or a typed preset key (for example: `"vcr"`, `"boom"`, `"lofi2"`).
- `AudioSegment.addEffect`, `VideoSegment.addAnimation` / `addMask` / `addTransition` / `setMixMode`, and `TextSegment.addAnimation` also accept preset strings (for example: `"echo"`, `"fadeIn"`, `"dissolve"`, `"circle"`, `"screen"`).
- Text `addEffect()` writes both material refs and `content.styles.effectStyle`, which matches pyJianYingDraft draft behavior more closely.
- Most core classes/methods also provide deprecated Python-style aliases (for example: `Script_file`, `Draft_folder`, `add_track`, `replace_material_by_seg`) to reduce migration friction.
- `jsjianyingdraft/metadata` now also exports Python-style enum objects and deprecated snake_case aliases (for example: `VideoSceneEffectType` / `Video_scene_effect_type`, `FontType` / `Font_type`).
- Full preset catalogs are exported from `jsjianyingdraft/metadata`; import a preset object and pass it to `addEffect` / `addFilter` for any advanced effect name.
- Metadata presets are auto-generated from `pyJianYingDraft`; regenerate with `npm run generate:metadata`.

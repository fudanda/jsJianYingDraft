# jsJianYingDraft

TypeScript migration of `pyJianYingDraft` with npm packaging support.

## Why this package

`jsjianyingdraft` aims to keep py-style editing workflows while providing:

- first-class TypeScript typing and npm distribution
- ESM + CJS builds
- migration-friendly snake_case compatibility aliases
- generated metadata presets from `pyJianYingDraft`

## Feature snapshot (v0.7.x)

- Draft folder lifecycle: create/list/remove/load/duplicate
- Draft editing core: `ScriptFile`, `Track`, segment/material classes
- Time helpers: `SEC`, `tim`, `Timerange`, `trange`, `srtTstamp`
- Template workflow: `loadTemplate`, `getImportedTrack`, `replaceMaterialByName`, `replaceMaterialBySeg`, `replaceText`, `importTrack`
- Segment effects and filters: `addEffect`, `addFilter`, `EffectSegment`, `FilterSegment`
- Video advanced controls: keyframe / animation / mask / transition / mix mode / background filling
- Full metadata subpath export: `jsjianyingdraft/metadata`
- Python-style enum aliases and `from_name` support for metadata objects
- Python-style class and method aliases (`snake_case`) for smoother migration
- Windows automation export controller: `JianyingController`
- Media metadata auto-probing support (duration/width/height when available)

## Install

```bash
npm install jsjianyingdraft
```

## Quick start

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

script.addTrack(TrackType.video).addTrack(TrackType.audio).addTrack(TrackType.text, "subtitle");

const video = new VideoMaterial("D:/assets/video.mp4", {
  duration: 8_000_000,
  width: 1920,
  height: 1080
});
const audio = new AudioMaterial("D:/assets/audio.mp3", { duration: 8_000_000 });

script
  .addSegment(new VideoSegment(video, trange("0s", "8s")))
  .addSegment(new AudioSegment(audio, trange("0s", "8s")))
  .importSrt("D:/assets/subtitle.srt", "subtitle")
  .save();
```

For a minimal runnable sample, see [`examples/minimal.ts`](./examples/minimal.ts).

## Migration quick map (`pyJianYingDraft` -> `jsJianYingDraft`)

| py-style | Preferred TS API | Compatibility alias in this package |
| --- | --- | --- |
| `Draft_folder` | `DraftFolder` | `Draft_folder` |
| `Script_file` | `ScriptFile` | `Script_file` |
| `Video_segment` | `VideoSegment` | `Video_segment` |
| `Audio_segment` | `AudioSegment` | `Audio_segment` |
| `Text_segment` | `TextSegment` | `Text_segment` |
| `Track_type` | `TrackType` | `Track_type` |
| `add_track` | `addTrack` | `add_track` |
| `add_segment` | `addSegment` | `add_segment` |
| `import_srt` | `importSrt` | `import_srt` |
| `replace_material_by_seg` | `replaceMaterialBySeg` | `replace_material_by_seg` |

Detailed migration notes are in [`docs/migration-from-py.md`](./docs/migration-from-py.md).

## Common recipes

### 1) Build segments directly from file paths

```ts
import { AudioSegment, Timerange, VideoSegment } from "jsjianyingdraft";

const videoSeg = new VideoSegment("D:/assets/clip.mp4", new Timerange(0, 3_000_000), {
  materialOptions: { duration: 3_000_000, width: 1920, height: 1080 }
});

const audioSeg = new AudioSegment("D:/assets/music.mp3", new Timerange(0, 3_000_000), {
  materialOptions: { duration: 3_000_000 }
});
```

Notes:

- `materialOptions` is the recommended field.
- `material_options` is still available as a deprecated migration alias.

### 2) `importSrt` with `styleReference` and clip behavior

```ts
import { ClipSettings, ScriptFile, TextSegment, TextStyle, Timerange } from "jsjianyingdraft";

const script = new ScriptFile(1920, 1080);
const styleRef = new TextSegment("template", new Timerange(0, 1_000_000), {
  style: new TextStyle({ bold: true }),
  clipSettings: new ClipSettings({ transformY: 0.66 })
});

script.importSrt("D:/assets/subtitle.srt", "subtitle", {
  styleReference: styleRef,
  clipSettings: null
});
```

Behavior aligned with `pyJianYingDraft`:

- when `styleReference` is set and `clipSettings` is omitted, clip settings are reset to default
- when `clipSettings: null` is passed, clip settings from `styleReference` are reused
- snake_case aliases are available: `style_reference`, `clip_settings`, `text_style`, `time_offset`

### 3) Metadata presets + `from_name` lookup

```ts
import { ScriptFile, Timerange, TrackType } from "jsjianyingdraft";
import { FilterType, VideoSceneEffectType } from "jsjianyingdraft/metadata";

const script = new ScriptFile(1920, 1080);
script.addTrack(TrackType.effect).addTrack(TrackType.filter);

const vcr = VideoSceneEffectType.from_name("V_C_R");
const lofi2 = FilterType.fromName("lofi ii");

script.addEffect(vcr, new Timerange(0, 1_000_000));
script.addFilter(lofi2, new Timerange(0, 1_000_000));
```

Notes:

- metadata enum-style exports support `from_name` / `fromName`
- metadata lookup ignores case, spaces, and underscores
- metadata enum member keys now follow py-style names (for example `MaskType.圆形`, `IntroType.渐显`)
- `TrackType.from_name` is stricter and expects exact track names (`video`, `audio`, `text`, ...)

### 4) Windows automation export with explicit timeout handling

```ts
import {
  DraftNotFoundError,
  ExportFramerate,
  ExportResolution,
  ExportTimeoutError,
  JianyingController
} from "jsjianyingdraft";

const ctrl = new JianyingController();

try {
  ctrl.exportDraft("demo-ts", {
    outputPath: "D:/exports/demo-ts.mp4",
    resolution: ExportResolution.RES_1080P,
    framerate: ExportFramerate.FR_30,
    timeout: 1200
  });
} catch (error) {
  if (error instanceof DraftNotFoundError) {
    // draft name not found in JianYing
  } else if (error instanceof ExportTimeoutError) {
    // export exceeded timeout
  } else {
    // other automation failures
  }
}
```

## Media auto-probing

`VideoMaterial` and `AudioMaterial` attempt to auto-detect metadata from local files.

- Preferred path: `ffprobe` (when available)
- Fallback parsing:
  - image dimensions for PNG/JPEG/GIF/BMP
  - WAV duration
- If detection is not possible, pass explicit constructor options (`duration`, `width`, `height`)

## Known limitations

- `JianyingController` is Windows-only and relies on UI automation.
- Current Windows automation export flow targets JianYing 6.x and below.
- For some media formats, duration probing depends on local `ffprobe` availability.

## Development

```bash
npm install
npm run build
npm run typecheck
npm run test
```

## Versioning and release

```bash
npm run changeset
npm run version-packages
npm run release
```

Pre-publish validation:

```bash
npm run check:release
```

`check:release` includes `tsdown` build, `Vitest`, `publint`, and `Are the types wrong?`.

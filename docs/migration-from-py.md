# Migration Guide: `pyJianYingDraft` -> `jsJianYingDraft`

This guide helps you migrate existing Python-oriented workflows to the TypeScript package while keeping behavior as close as possible.

## 1) Import strategy

Use the root package for core editing APIs:

```ts
import {
  DraftFolder,
  ScriptFile,
  TrackType,
  VideoMaterial,
  AudioMaterial,
  VideoSegment,
  AudioSegment
} from "jsjianyingdraft";
```

Use `jsjianyingdraft/metadata` for full generated preset catalogs and enum-style helper objects:

```ts
import { FilterType, VideoSceneEffectType } from "jsjianyingdraft/metadata";
```

## 2) Keep migration low-risk with alias compatibility

Most common Python-style aliases are still available so you can migrate incrementally:

- class aliases: `Draft_folder`, `Script_file`, `Video_segment`, `Audio_segment`, `Text_segment`, `Track_type`
- method aliases: `add_track`, `add_segment`, `import_srt`, `replace_material_by_seg`, `replace_material_by_name`
- metadata aliases: `Video_scene_effect_type`, `Filter_type`, `Font_type` (and more)

Recommended approach:

1. Keep aliases during initial migration to reduce diff size.
2. Switch to camelCase APIs once behavior and tests are stable.

## 3) Behavior differences and parity notes

### Track type lookup

`TrackType.from_name` and `TrackType.fromName` require exact track names:

- valid: `video`, `audio`, `effect`, `filter`, `sticker`, `text`, `adjust`
- invalid: `VIDEO` (throws)

### Metadata enum-style lookup

`from_name` / `fromName` on metadata exports ignore:

- case differences
- spaces
- underscores

Example:

- `VideoSceneEffectType.from_name("V_C_R")` -> same as `VideoSceneEffectType.VCR`

### Breaking: py-style enum members only

Metadata enum member keys now strictly follow py member names. Previous English shortcut keys were removed.

| Removed key | New key |
| --- | --- |
| `VideoSceneEffectType.vcr` | `VideoSceneEffectType.VCR` |
| `VideoCharacterEffectType.boom` | `VideoCharacterEffectType.BOOM` |
| `FilterType.lofi2` | `FilterType.Lofi_II` |
| `AudioSceneEffectType.echo` | `AudioSceneEffectType.回音` |
| `ToneEffectType.maleTone` | `ToneEffectType.男生` |
| `SpeechToSongType.lofiSong` | `SpeechToSongType.Lofi` |
| `IntroType.fadeIn` | `IntroType.渐显` |
| `OutroType.fadeOut` | `OutroType.渐隐` |
| `GroupAnimationType.split3` | `GroupAnimationType.三分割` |
| `TextIntro.textFadeIn` | `TextIntro.渐显` |
| `TextLoopAnim.textGlitchLoop` | `TextLoopAnim.色差故障` |
| `TransitionType.dissolve` | `TransitionType.叠化` |
| `MaskType.circle` | `MaskType.圆形` |
| `MixModeType.screen` | `MixModeType.滤色` |

### `importSrt` style semantics

When `styleReference` is used:

- omit `clipSettings`: clip settings reset to default
- pass `clipSettings: null`: inherit clip settings from `styleReference`

This behavior matches the current py implementation.

### Segment path constructors

`VideoSegment` and `AudioSegment` support path-based constructors:

```ts
new VideoSegment("clip.mp4", timerange, { materialOptions: { duration, width, height } });
new AudioSegment("music.mp3", timerange, { materialOptions: { duration } });
```

`material_options` is still accepted as a deprecated alias.

### Export automation timeout

Windows export failures with timeout now map to a dedicated `ExportTimeoutError` (instead of generic `AutomationError`).

## 4) End-to-end migration example

```ts
import {
  DraftFolder,
  ScriptFile,
  TextStyle,
  Timerange,
  TrackType,
  VideoSegment,
  AudioSegment
} from "jsjianyingdraft";
import { FilterType } from "jsjianyingdraft/metadata";

const root = new DraftFolder("D:/JianYingDrafts");
const script = root.createDraft("migrated-demo", 1920, 1080, { allowReplace: true });

script.addTrack(TrackType.video).addTrack(TrackType.audio).addTrack(TrackType.text, "subtitle");
script.addTrack(TrackType.filter);

script.addSegment(
  new VideoSegment("D:/assets/video.mp4", new Timerange(0, 8_000_000), {
    materialOptions: { duration: 8_000_000, width: 1920, height: 1080 }
  })
);
script.addSegment(
  new AudioSegment("D:/assets/audio.mp3", new Timerange(0, 8_000_000), {
    materialOptions: { duration: 8_000_000 }
  })
);

script.importSrt("D:/assets/subtitle.srt", "subtitle", {
  textStyle: new TextStyle({ size: 6, autoWrapping: true })
});
script.addFilter(FilterType.from_name("lofi ii"), new Timerange(0, 8_000_000), undefined, 70);

script.save();
```

## 5) Suggested migration checklist

1. Replace imports with `jsjianyingdraft` and `jsjianyingdraft/metadata`.
2. Keep snake_case aliases first; convert to camelCase later.
3. Add tests around `importSrt` styling if your project relies on template text styles.
4. Add explicit error handling for `DraftNotFoundError` and `ExportTimeoutError` in automation flows.
5. If media probing fails in your environment, pass explicit `duration` / `width` / `height`.

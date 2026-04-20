# js-jianyingdraft Workflows

## Contents

1. New draft creation
2. Template editing and replacement
3. SRT import with style compatibility
4. Metadata presets and `from_name`
5. Windows export automation
6. Common pitfalls

## 1. New draft creation

Use this recipe for net-new draft generation from media files.

```ts
import {
  AudioSegment,
  DraftFolder,
  Timerange,
  TrackType,
  VideoSegment
} from "jsjianyingdraft";

const folder = new DraftFolder("D:/JianYingDrafts");
const script = folder.createDraft("demo", 1920, 1080, { allowReplace: true });

script.addTrack(TrackType.video).addTrack(TrackType.audio).addTrack(TrackType.text, "subtitle");

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

script.save();
```

## 2. Template editing and replacement

Use this recipe when preserving template timings/layout and replacing source assets.

```ts
import { ScriptFile, TrackType, VideoMaterial } from "jsjianyingdraft";

const tpl = ScriptFile.loadTemplate("D:/template/draft_content.json");
const imported = tpl.getImportedTrack(TrackType.video, "main");

tpl.replaceMaterialBySeg(
  imported,
  0,
  new VideoMaterial("D:/assets/new-video.mp4", {
    duration: 5_000_000,
    width: 1920,
    height: 1080
  })
);
tpl.replaceText(tpl.getImportedTrack(TrackType.text, "subtitle"), 0, "new subtitle");
tpl.save("D:/output/draft_content.json");
```

Notes:

- Prefer `replaceMaterialBySeg` when the replacement target is known by track + segment index.
- Prefer `replaceMaterialByName` when template material names are stable and explicit.

## 3. SRT import with style compatibility

Use this recipe for subtitle migration from py workflows.

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

Compatibility details:

- `styleReference` with omitted `clipSettings` resets clip settings to default.
- `clipSettings: null` reuses `styleReference` clip settings.
- Deprecated aliases are still accepted: `style_reference`, `clip_settings`, `text_style`, `time_offset`.

## 4. Metadata presets and `from_name`

Use this recipe for preset-driven effects/filters/fonts.

```ts
import { ScriptFile, Timerange, TrackType } from "jsjianyingdraft";
import { FilterType, VideoSceneEffectType } from "jsjianyingdraft/metadata";

const script = new ScriptFile(1920, 1080);
script.addTrack(TrackType.effect).addTrack(TrackType.filter);

const effectMeta = VideoSceneEffectType.from_name("v c r");
const filterMeta = FilterType.fromName("LOFI_2");

script.addEffect(effectMeta, new Timerange(0, 1_000_000));
script.addFilter(filterMeta, new Timerange(0, 1_000_000));
```

Notes:

- Metadata `from_name` lookup ignores case, spaces, and underscores.
- `TrackType.from_name` is strict and only accepts exact track names.

## 5. Windows export automation

Use this recipe for automation export flow in Windows environments.

```ts
import {
  AutomationError,
  DraftNotFoundError,
  ExportFramerate,
  ExportResolution,
  ExportTimeoutError,
  JianyingController
} from "jsjianyingdraft";

const ctrl = new JianyingController();

try {
  ctrl.exportDraft("demo", {
    outputPath: "D:/exports/demo.mp4",
    resolution: ExportResolution.RES_1080P,
    framerate: ExportFramerate.FR_30,
    timeout: 1200
  });
} catch (error) {
  if (error instanceof DraftNotFoundError) {
    // draft missing
  } else if (error instanceof ExportTimeoutError) {
    // export timeout
  } else if (error instanceof AutomationError) {
    // generic automation failure
  } else {
    throw error;
  }
}
```

## 6. Common pitfalls

- Missing track:
Always create required tracks before `addSegment`.

- Ambiguous track:
If multiple tracks share same type, pass explicit `trackName`.

- Probe failure:
Pass explicit `duration`/`width`/`height` when metadata cannot be auto-probed.

- Generated metadata edits:
Avoid manual edits in `src/metadata.generated.ts`; regenerate through project scripts.

- Validation scope:
Run targeted tests first, then broader checks only when needed (`npm run test`, `npm run check:release`).

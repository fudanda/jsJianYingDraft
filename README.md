# jsJianYingDraft

TypeScript migration of `pyJianYingDraft` with npm packaging support.

## Current scope (v0.1.0)

- Draft folder operations: create/list/remove/load/duplicate
- Core draft file read/write: `ScriptFile`
- Core time helpers: `SEC`, `tim`, `Timerange`, `trange`, `srtTstamp`
- Basic tracks and segments: video/audio/text
- Bundled JianYing draft templates

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

## Notes

- Media auto-probing is not included in this first TypeScript batch; pass media duration/size manually.
- Full metadata and advanced effects migration can be added in the next phase.

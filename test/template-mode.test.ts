import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { AudioMaterial, VideoMaterial } from "../src/materials.js";
import { ScriptFile } from "../src/script-file.js";
import {
  ExtendMode,
  importTrack,
  ImportedMediaTrack,
  ImportedTextTrack,
  ShrinkMode
} from "../src/template-mode.js";
import { TrackType } from "../src/track.js";
import { Timerange } from "../src/time.js";

const tempDirs: string[] = [];

function createTempFile(name: string): string {
  const dir = mkdtempSync(join(tmpdir(), "jydraft-"));
  tempDirs.push(dir);
  const filePath = join(dir, name);
  writeFileSync(filePath, "dummy");
  return filePath;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0, tempDirs.length)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("template mode", () => {
  it("processes imported media timerange shrink", () => {
    const track = importTrack({
      type: "audio",
      name: "audio_track",
      id: "track-1",
      segments: [
        {
          id: "seg-1",
          material_id: "mat-1",
          source_timerange: { start: 0, duration: 1_000_000 },
          target_timerange: { start: 0, duration: 1_000_000 },
          render_index: 0
        }
      ]
    });

    expect(track).toBeInstanceOf(ImportedMediaTrack);
    const mediaTrack = track as ImportedMediaTrack;
    mediaTrack.processTimerange(0, new Timerange(0, 800_000), ShrinkMode.cutTail, [ExtendMode.cutMaterialTail]);
    expect(mediaTrack.segments[0]?.duration).toBe(800_000);
  });

  it("replaces imported material by name", () => {
    const videoPath = createTempFile("video.mp4");
    const newMaterial = new VideoMaterial(videoPath, {
      materialName: "new-video",
      duration: 2_000_000,
      width: 1920,
      height: 1080
    });

    const script = new ScriptFile(1920, 1080);
    script.importedMaterials.videos = [
      {
        id: "old-id",
        material_name: "old-video",
        path: "C:/old.mp4",
        duration: 1_000_000
      }
    ];

    script.replaceMaterialByName("old-video", newMaterial);
    const videoList = script.importedMaterials.videos as Record<string, unknown>[];
    expect(videoList[0]?.material_name).toBe("new-video");
    expect(videoList[0]?.path).toBe(videoPath);
    expect(videoList[0]?.duration).toBe(2_000_000);
  });

  it("replaces imported text content", () => {
    const script = new ScriptFile(1920, 1080);
    script.importedMaterials.texts = [
      {
        id: "text-1",
        content: JSON.stringify({
          text: "hello",
          styles: [{ range: [0, 5] }]
        })
      }
    ];
    script.importedTracks = [
      importTrack({
        type: "text",
        name: "subtitle",
        id: "text-track-1",
        segments: [
          {
            id: "segment-1",
            material_id: "text-1",
            target_timerange: { start: 0, duration: 1_000_000 },
            render_index: 15_000
          }
        ]
      })
    ];

    const track = script.getImportedTrack(TrackType.text, "subtitle");
    expect(track).toBeInstanceOf(ImportedTextTrack);

    script.replaceText(track, 0, "world");
    const textList = script.importedMaterials.texts as Record<string, unknown>[];
    const payload = JSON.parse(String(textList[0]?.content)) as { text: string };
    expect(payload.text).toBe("world");
  });

  it("imports track with material references", () => {
    const source = new ScriptFile(1920, 1080);
    source.importedMaterials.texts = [
      {
        id: "text-1",
        content: JSON.stringify({ text: "source", styles: [] })
      }
    ];
    const sourceTrack = importTrack({
      type: "text",
      name: "source-subtitle",
      id: "source-track-1",
      segments: [
        {
          id: "segment-1",
          material_id: "text-1",
          target_timerange: { start: 0, duration: 1_000_000 },
          extra_material_refs: [],
          render_index: 15_000
        }
      ]
    });

    const target = new ScriptFile(1920, 1080);
    target.importTrack(source, sourceTrack as ImportedTextTrack, { newName: "copied-subtitle", offset: "1s" });

    expect(target.importedTracks.length).toBe(1);
    expect(target.importedTracks[0]?.name).toBe("copied-subtitle");
    const copiedTexts = target.importedMaterials.texts as Record<string, unknown>[];
    expect(copiedTexts.length).toBe(1);
    expect(copiedTexts[0]?.id).toBe("text-1");
  });

  it("replaces material by segment for imported audio track", () => {
    const audioPath = createTempFile("new-audio.mp3");
    const newMaterial = new AudioMaterial(audioPath, { materialName: "new-audio", duration: 800_000 });

    const script = new ScriptFile(1920, 1080);
    const track = importTrack({
      type: "audio",
      name: "audio-track",
      id: "audio-track-1",
      segments: [
        {
          id: "segment-1",
          material_id: "audio-old",
          source_timerange: { start: 0, duration: 1_000_000 },
          target_timerange: { start: 0, duration: 1_000_000 },
          render_index: 0
        }
      ]
    }) as ImportedMediaTrack;

    script.replaceMaterialBySeg(track, 0, newMaterial);
    expect(track.segments[0]?.materialId).toBe(newMaterial.materialId);
    expect(track.segments[0]?.duration).toBe(800_000);
  });
});

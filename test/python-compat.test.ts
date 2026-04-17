import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  Audio_material,
  Audio_segment,
  Draft_folder,
  Extend_mode,
  Script_file,
  Shrink_mode,
  Text_background,
  Text_border,
  Text_segment,
  Text_shadow,
  Text_style,
  Timerange,
  TrackType,
  Track_type,
  Video_material,
  Video_segment,
  importTrack
} from "../src/index.js";
import { ImportedMediaTrack } from "../src/template-mode.js";

const tempDirs: string[] = [];

function createTempWorkspace(): string {
  const dir = mkdtempSync(join(tmpdir(), "jydraft-compat-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0, tempDirs.length)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("python-style compatibility aliases", () => {
  it("supports snake_case class aliases and methods", () => {
    const root = createTempWorkspace();
    const videoPath = join(root, "video.mp4");
    const audioPath = join(root, "audio.mp3");
    writeFileSync(videoPath, "dummy");
    writeFileSync(audioPath, "dummy");

    const folder = new Draft_folder(root);
    const script = folder.create_draft("compat", 1920, 1080, { allowReplace: true, fps: 30 });

    script.add_track(Track_type.video).add_track(Track_type.audio).add_track(Track_type.text, "subtitle");

    const videoMaterial = new Video_material(videoPath, { duration: 1_000_000, width: 1920, height: 1080 });
    const audioMaterial = new Audio_material(audioPath, { duration: 1_000_000 });

    const videoSeg = new Video_segment(videoMaterial, new Timerange(0, 1_000_000)).add_background_filling("color");
    const audioSeg = new Audio_segment(audioMaterial, new Timerange(0, 1_000_000)).add_fade("0.1s", "0.1s");

    const template = new Text_segment("hello", new Timerange(0, 1_000_000), {
      style: new Text_style({ bold: true }),
      border: new Text_border({ width: 30 }),
      background: new Text_background({ color: "#112233" }),
      shadow: new Text_shadow({ distance: 8 })
    });
    const textSeg = Text_segment.create_from_template("world", new Timerange(0, 1_000_000), template).add_effect(
      "text-effect-id"
    );

    script.add_segment(videoSeg).add_segment(audioSeg).add_segment(textSeg, "subtitle").save();

    expect(folder.has_draft("compat")).toBe(true);
    const json = folder.read_draft_json("compat");
    expect(json).toContain("\"tracks\"");
    expect(json).toContain("world");

    const loaded = Script_file.load_template(join(root, "compat", "draft_content.json"));
    expect(loaded).toBeInstanceOf(Script_file);
  });

  it("supports snake_case timerange processing helpers", () => {
    const root = createTempWorkspace();
    const audioPath = join(root, "track.mp3");
    writeFileSync(audioPath, "dummy");
    const audioMaterial = new Audio_material(audioPath, { duration: 1_000_000 });

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
    }) as ImportedMediaTrack;

    expect(track.check_material_type(audioMaterial)).toBe(true);
    track.process_timerange(0, new Timerange(0, 800_000), Shrink_mode.cutTail, [Extend_mode.cutMaterialTail]);
    expect(track.segments[0]?.duration).toBe(800_000);
  });

  it("supports TrackType from_name/fromName helpers", () => {
    expect(TrackType.from_name("video")).toBe(TrackType.video);
    expect(TrackType.fromName("audio")).toBe(TrackType.audio);

    expect(Track_type.from_name("text")).toBe(Track_type.text);
    expect(Track_type.fromName("effect")).toBe(Track_type.effect);

    expect(() => TrackType.from_name("VIDEO")).toThrow("Invalid track type: VIDEO");
    expect(() => Track_type.fromName("unknown")).toThrow("Invalid track type: unknown");
  });
});

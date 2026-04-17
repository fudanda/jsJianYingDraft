import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { AudioMaterial, VideoMaterial } from "../src/materials.js";
import { ScriptFile } from "../src/script-file.js";
import { AudioSegment, TextSegment, VideoSegment } from "../src/segment.js";
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

describe("preset shortcuts", () => {
  it("supports string presets for audio/video effects, animation, transition, mask and mix mode", () => {
    const videoPath = createTempFile("video.mp4");
    const audioPath = createTempFile("audio.mp3");

    const video = new VideoMaterial(videoPath, { duration: 2_000_000, width: 1920, height: 1080 });
    const audio = new AudioMaterial(audioPath, { duration: 2_000_000 });

    const videoSegment = new VideoSegment(video, new Timerange(0, 1_500_000));
    videoSegment.addAnimation("渐显").addAnimation("fadeOut").setMixMode("滤色").addMask("circle").addTransition("叠化");

    const audioSegment = new AudioSegment(audio, new Timerange(0, 1_500_000));
    audioSegment.addEffect("回音").addEffect("robotTone");

    const script = new ScriptFile(1920, 1080);
    script.addTrack(TrackType.video).addTrack(TrackType.audio);
    script.addSegment(videoSegment).addSegment(audioSegment);

    expect(script.materials.animations.length).toBe(1);
    expect(script.materials.masks.length).toBe(1);
    expect(script.materials.transitions.length).toBe(1);
    expect(script.materials.mixModes.length).toBe(1);
    expect(script.materials.audioEffects.length).toBe(2);

    const dumped = JSON.parse(script.dumps()) as { materials: Record<string, unknown[]> };
    expect((dumped.materials.transitions?.[0] as { name?: string })?.name).toBe("叠化");
    expect((dumped.materials.masks?.[0] as { name?: string })?.name).toBe("圆形");
    expect((dumped.materials.effects?.[0] as { type?: string })?.type).toBe("mix_mode");
    expect((dumped.materials.audio_effects?.[0] as { category_id?: string })?.category_id).toBe("sound_effect");
    expect((dumped.materials.audio_effects?.[1] as { category_id?: string })?.category_id).toBe("tone");
  });

  it("supports text animation string presets including loop", () => {
    const textSegment = new TextSegment("hello", new Timerange(0, 1_500_000));
    textSegment.addAnimation("textFadeIn").addAnimation("渐隐").addAnimation("色差故障");

    const script = new ScriptFile(1920, 1080);
    script.addTrack(TrackType.text).addSegment(textSegment);

    expect(script.materials.animations.length).toBe(1);

    const dumped = JSON.parse(script.dumps()) as {
      materials: {
        material_animations: Array<{ animations: Array<{ type: string }> }>;
      };
    };
    const animationTypes = dumped.materials.material_animations[0]?.animations.map((item) => item.type) ?? [];
    expect(animationTypes).toEqual(["in", "out", "loop"]);
  });
});

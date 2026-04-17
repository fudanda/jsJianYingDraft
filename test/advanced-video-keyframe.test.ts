import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { AudioMaterial, VideoMaterial } from "../src/materials.js";
import { ScriptFile } from "../src/script-file.js";
import {
  EffectMeta,
  KeyframeProperty,
  MaskMeta,
  TransitionMeta,
  VideoAnimationMeta,
  VideoSegment,
  AudioSegment
} from "../src/segment.js";
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

describe("advanced video and keyframe features", () => {
  it("collects video animations, masks, transitions, mix modes and canvas filling", () => {
    const videoPath = createTempFile("video.mp4");
    const video = new VideoMaterial(videoPath, { duration: 3_000_000, width: 1920, height: 1080 });

    const animationMeta: VideoAnimationMeta = {
      title: "Intro Animation",
      effectId: "anim-1",
      resourceId: "anim-res-1",
      duration: 600_000,
      animationType: "in"
    };
    const maskMeta: MaskMeta = {
      name: "Rectangle",
      resourceType: "rectangle",
      resourceId: "mask-res-1",
      effectId: "mask-effect-1",
      defaultAspectRatio: 1.0
    };
    const transitionMeta: TransitionMeta = {
      name: "Fade",
      resourceId: "transition-res-1",
      effectId: "transition-effect-1",
      defaultDuration: 500_000,
      isOverlap: true
    };
    const mixMode: EffectMeta = {
      name: "Overlay",
      effectId: "mix-effect-1",
      resourceId: "mix-res-1"
    };

    const segment = new VideoSegment(video, new Timerange(0, 2_000_000));
    segment
      .addAnimation(animationMeta)
      .addMask(maskMeta, { size: 0.6, rectWidth: 0.7, roundCorner: 20 })
      .addTransition(transitionMeta, "0.8s")
      .setMixMode(mixMode)
      .addBackgroundFilling("blur", 0.375);

    const script = new ScriptFile(1920, 1080);
    script.addTrack(TrackType.video).addSegment(segment);

    expect(segment.extraMaterialRefs.length).toBe(6);
    expect(script.materials.animations.length).toBe(1);
    expect(script.materials.masks.length).toBe(1);
    expect(script.materials.transitions.length).toBe(1);
    expect(script.materials.mixModes.length).toBe(1);
    expect(script.materials.canvases.length).toBe(1);

    const dumped = JSON.parse(script.dumps()) as { materials: Record<string, unknown[]> };
    expect(dumped.materials.material_animations?.length).toBe(1);
    expect(dumped.materials.masks?.length).toBe(1);
    expect(dumped.materials.transitions?.length).toBe(1);
    expect((dumped.materials.effects ?? []).some((item) => (item as { type?: string }).type === "mix_mode")).toBe(true);
    expect(dumped.materials.canvases?.length).toBe(1);
  });

  it("supports visual and audio keyframes", () => {
    const videoPath = createTempFile("video.mp4");
    const audioPath = createTempFile("audio.mp3");

    const video = new VideoMaterial(videoPath, { duration: 3_000_000, width: 1920, height: 1080 });
    const audio = new AudioMaterial(audioPath, { duration: 3_000_000 });

    const videoSegment = new VideoSegment(video, new Timerange(0, 2_000_000));
    videoSegment.addKeyframe(KeyframeProperty.uniformScale, "0s", 1.2);
    videoSegment.addKeyframe(KeyframeProperty.scaleY, "1s", 0.8);
    expect(() => videoSegment.addKeyframe(KeyframeProperty.uniformScale, "1.5s", 1.0)).toThrow();
    expect(videoSegment.uniformScale).toBe(false);
    expect(videoSegment.commonKeyframes.length).toBe(2);
    expect(videoSegment.commonKeyframes[0]?.keyframeProperty).toBe(KeyframeProperty.scaleX);
    expect(videoSegment.commonKeyframes[1]?.keyframeProperty).toBe(KeyframeProperty.scaleY);

    const videoJson = videoSegment.exportJson();
    const videoKeyframes = videoJson.common_keyframes as Array<Record<string, unknown>>;
    expect(videoKeyframes.length).toBe(2);

    const audioSegment = new AudioSegment(audio, new Timerange(0, 2_000_000));
    audioSegment.addKeyframe("1s", 0.4).addKeyframe("0.5s", 0.7);
    expect(audioSegment.commonKeyframes.length).toBe(1);

    const audioJson = audioSegment.exportJson();
    const audioKeyframeList = (audioJson.common_keyframes as Array<Record<string, unknown>>)[0];
    const keyframes = audioKeyframeList?.keyframe_list as Array<Record<string, unknown>>;
    expect(keyframes[0]?.time_offset).toBe(500_000);
    expect(keyframes[1]?.time_offset).toBe(1_000_000);
    expect(audioKeyframeList?.property_type).toBe(KeyframeProperty.volume);
  });
});

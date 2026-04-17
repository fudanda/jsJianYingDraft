import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { VideoMaterial } from "../src/materials.js";
import { ScriptFile } from "../src/script-file.js";
import { EffectMeta, VideoSegment } from "../src/segment.js";
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

describe("effect and filter tracks", () => {
  it("adds global effect segment to effect track", () => {
    const script = new ScriptFile(1920, 1080);
    script.addTrack(TrackType.effect);

    const effectMeta: EffectMeta = {
      name: "Test Effect",
      effectId: "effect-1",
      resourceId: "resource-1",
      params: [{ name: "strength", defaultValue: 0.5, minValue: 0, maxValue: 1 }]
    };

    script.addEffect(effectMeta, new Timerange(0, 1_000_000), undefined, { params: [80] });

    expect(script.materials.videoEffects.length).toBe(1);
    const payload = script.materials.videoEffects[0]?.exportJson();
    expect(payload?.type).toBe("video_effect");
    expect(payload?.apply_target_type).toBe(2);
    const adjustParams = payload?.adjust_params as Array<Record<string, unknown>>;
    expect(adjustParams[0]?.value).toBeCloseTo(0.8);
  });

  it("adds global filter segment to filter track", () => {
    const script = new ScriptFile(1920, 1080);
    script.addTrack(TrackType.filter);

    const filterMeta: EffectMeta = {
      name: "Test Filter",
      effectId: "filter-1",
      resourceId: "resource-filter-1"
    };

    script.addFilter(filterMeta, new Timerange(0, 2_000_000), undefined, 65);

    expect(script.materials.filters.length).toBe(1);
    const payload = script.materials.filters[0]?.exportJson();
    expect(payload?.type).toBe("filter");
    expect(payload?.value).toBeCloseTo(0.65);
  });

  it("collects segment-level effect and filter from video segment", () => {
    const videoPath = createTempFile("video.mp4");
    const video = new VideoMaterial(videoPath, { duration: 3_000_000, width: 1920, height: 1080 });

    const effectMeta: EffectMeta = {
      name: "Inline Effect",
      effectId: "effect-inline",
      resourceId: "resource-inline"
    };
    const filterMeta: EffectMeta = {
      name: "Inline Filter",
      effectId: "filter-inline",
      resourceId: "resource-filter-inline"
    };

    const segment = new VideoSegment(video, new Timerange(0, 2_000_000));
    segment.addEffect(effectMeta);
    segment.addFilter(filterMeta, 40);

    const script = new ScriptFile(1920, 1080);
    script.addTrack(TrackType.video);
    script.addSegment(segment);

    expect(script.materials.videoEffects.length).toBe(1);
    expect(script.materials.filters.length).toBe(1);
    expect(segment.extraMaterialRefs.length).toBe(3);
    expect(script.duration).toBe(2_000_000);
  });
});

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { AudioSegment, ScriptFile, TrackType, Timerange, VideoSegment } from "../src/index.js";

const tempDirs: string[] = [];

function createTempWorkspace(): string {
  const dir = mkdtempSync(join(tmpdir(), "jydraft-seg-path-"));
  tempDirs.push(dir);
  return dir;
}

function writePng1x1(path: string): void {
  const png1x1Base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+nYJ8AAAAASUVORK5CYII=";
  writeFileSync(path, Buffer.from(png1x1Base64, "base64"));
}

afterEach(() => {
  for (const dir of tempDirs.splice(0, tempDirs.length)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("segment constructors from material path", () => {
  it("supports creating VideoSegment from path with materialOptions", () => {
    const root = createTempWorkspace();
    const videoPath = join(root, "demo.mp4");
    writeFileSync(videoPath, "dummy");

    const segment = new VideoSegment(videoPath, new Timerange(0, 1_000_000), {
      materialOptions: {
        duration: 2_000_000,
        width: 1280,
        height: 720
      }
    });

    expect(segment.materialInstance.duration).toBe(2_000_000);
    expect(segment.materialInstance.width).toBe(1280);
    expect(segment.materialInstance.height).toBe(720);

    const script = new ScriptFile(1920, 1080);
    script.addTrack(TrackType.video).addSegment(segment);
    expect(script.materials.videos).toHaveLength(1);
  });

  it("supports creating AudioSegment from path with deprecated material_options alias", () => {
    const root = createTempWorkspace();
    const audioPath = join(root, "demo.mp3");
    writeFileSync(audioPath, "dummy");

    const segment = new AudioSegment(audioPath, new Timerange(0, 1_000_000), {
      material_options: {
        duration: 1_500_000
      }
    });

    expect(segment.materialInstance.duration).toBe(1_500_000);

    const script = new ScriptFile(1920, 1080);
    script.addTrack(TrackType.audio).addSegment(segment);
    expect(script.materials.audios).toHaveLength(1);
  });

  it("works with image path and auto-detected material info", () => {
    const root = createTempWorkspace();
    const imagePath = join(root, "cover.png");
    writePng1x1(imagePath);

    const segment = new VideoSegment(imagePath, new Timerange(0, 1_000_000));
    expect(segment.materialInstance.materialType).toBe("photo");
    expect(segment.materialInstance.width).toBe(1);
    expect(segment.materialInstance.height).toBe(1);
  });
});

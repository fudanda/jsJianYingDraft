import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { AudioMaterial, VideoMaterial } from "../src/index.js";

const tempDirs: string[] = [];

function createTempWorkspace(): string {
  const dir = mkdtempSync(join(tmpdir(), "jydraft-probe-"));
  tempDirs.push(dir);
  return dir;
}

function writePng1x1(path: string): void {
  const png1x1Base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+nYJ8AAAAASUVORK5CYII=";
  writeFileSync(path, Buffer.from(png1x1Base64, "base64"));
}

function writeSilentWav(path: string, durationSeconds: number): void {
  const sampleRate = 8_000;
  const channels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const frameCount = Math.round(sampleRate * durationSeconds);
  const dataSize = frameCount * channels * bytesPerSample;
  const byteRate = sampleRate * channels * bytesPerSample;
  const blockAlign = channels * bytesPerSample;

  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16); // PCM fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);
  writeFileSync(path, buffer);
}

afterEach(() => {
  for (const dir of tempDirs.splice(0, tempDirs.length)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("media auto-probing", () => {
  it("auto-detects image width/height for VideoMaterial", () => {
    const root = createTempWorkspace();
    const pngPath = join(root, "tiny.png");
    writePng1x1(pngPath);

    const material = new VideoMaterial(pngPath);
    expect(material.materialType).toBe("photo");
    expect(material.width).toBe(1);
    expect(material.height).toBe(1);
    expect(material.duration).toBe(10_800 * 1_000_000);
  });

  it("auto-detects wav duration for AudioMaterial", () => {
    const root = createTempWorkspace();
    const wavPath = join(root, "tone.wav");
    writeSilentWav(wavPath, 1.25);

    const material = new AudioMaterial(wavPath);
    expect(material.duration).toBe(1_250_000);
  });

  it("allows explicit duration override", () => {
    const root = createTempWorkspace();
    const wavPath = join(root, "manual.wav");
    writeSilentWav(wavPath, 2.0);

    const material = new AudioMaterial(wavPath, { duration: 333_333 });
    expect(material.duration).toBe(333_333);
  });

  it("throws clear error when video duration cannot be detected", () => {
    const root = createTempWorkspace();
    const mp4Path = join(root, "invalid.mp4");
    writeFileSync(mp4Path, "not a valid media file");

    expect(() => new VideoMaterial(mp4Path)).toThrowError(/could not be auto-detected/i);
  });

  it("throws clear error when audio duration cannot be detected", () => {
    const root = createTempWorkspace();
    const audioPath = join(root, "invalid.mp3");
    writeFileSync(audioPath, "not a valid media file");

    expect(() => new AudioMaterial(audioPath)).toThrowError(/could not be auto-detected/i);
  });
});

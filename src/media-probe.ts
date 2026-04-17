import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

export interface MediaProbeResult {
  durationUs: number | null;
  width: number | null;
  height: number | null;
  hasVideoStream: boolean;
  hasAudioStream: boolean;
}

interface FfprobeStream {
  codec_type?: string;
  width?: number | string;
  height?: number | string;
  duration?: number | string;
}

interface FfprobeFormat {
  duration?: number | string;
}

interface FfprobePayload {
  streams?: FfprobeStream[];
  format?: FfprobeFormat;
}

function toPositiveNumber(input: unknown): number | null {
  if (typeof input === "number") {
    if (Number.isFinite(input) && input > 0) {
      return input;
    }
    return null;
  }
  if (typeof input === "string") {
    const parsed = Number.parseFloat(input);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
}

function toPositiveInteger(input: unknown): number | null {
  const value = toPositiveNumber(input);
  if (value === null) {
    return null;
  }
  const rounded = Math.round(value);
  return rounded > 0 ? rounded : null;
}

function secondsToMicroseconds(seconds: number): number {
  return Math.max(0, Math.round(seconds * 1_000_000));
}

function runFfprobe(filePath: string): FfprobePayload | null {
  const result = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-print_format",
      "json",
      "-show_entries",
      "stream=codec_type,width,height,duration:format=duration",
      filePath
    ],
    { encoding: "utf8", windowsHide: true }
  );

  if (result.status !== 0 || result.error || typeof result.stdout !== "string" || result.stdout.trim().length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(result.stdout) as FfprobePayload;
    return parsed;
  } catch {
    return null;
  }
}

function probeFromFfprobe(filePath: string): MediaProbeResult | null {
  const payload = runFfprobe(filePath);
  if (payload === null) {
    return null;
  }

  const streams = Array.isArray(payload.streams) ? payload.streams : [];
  const videoStream = streams.find((item) => item.codec_type === "video");
  const audioStream = streams.find((item) => item.codec_type === "audio");

  const formatDuration = toPositiveNumber(payload.format?.duration);
  const videoDuration = toPositiveNumber(videoStream?.duration);
  const audioDuration = toPositiveNumber(audioStream?.duration);
  const durationSeconds = videoDuration ?? audioDuration ?? formatDuration;

  return {
    durationUs: durationSeconds === null || durationSeconds === undefined ? null : secondsToMicroseconds(durationSeconds),
    width: toPositiveInteger(videoStream?.width),
    height: toPositiveInteger(videoStream?.height),
    hasVideoStream: videoStream !== undefined,
    hasAudioStream: audioStream !== undefined
  };
}

function probePngSize(data: Buffer): [number, number] | null {
  if (data.length < 24) {
    return null;
  }
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < pngSignature.length; i += 1) {
    if (data[i] !== pngSignature[i]) {
      return null;
    }
  }

  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  if (width <= 0 || height <= 0) {
    return null;
  }
  return [width, height];
}

function probeGifSize(data: Buffer): [number, number] | null {
  if (data.length < 10) {
    return null;
  }
  const header = data.subarray(0, 6).toString("ascii");
  if (header !== "GIF87a" && header !== "GIF89a") {
    return null;
  }

  const width = data.readUInt16LE(6);
  const height = data.readUInt16LE(8);
  if (width <= 0 || height <= 0) {
    return null;
  }
  return [width, height];
}

function probeBmpSize(data: Buffer): [number, number] | null {
  if (data.length < 26) {
    return null;
  }
  if (data.toString("ascii", 0, 2) !== "BM") {
    return null;
  }

  const width = Math.abs(data.readInt32LE(18));
  const height = Math.abs(data.readInt32LE(22));
  if (width <= 0 || height <= 0) {
    return null;
  }
  return [width, height];
}

function isSofMarker(marker: number): boolean {
  return (
    marker === 0xc0 ||
    marker === 0xc1 ||
    marker === 0xc2 ||
    marker === 0xc3 ||
    marker === 0xc5 ||
    marker === 0xc6 ||
    marker === 0xc7 ||
    marker === 0xc9 ||
    marker === 0xca ||
    marker === 0xcb ||
    marker === 0xcd ||
    marker === 0xce ||
    marker === 0xcf
  );
}

function probeJpegSize(data: Buffer): [number, number] | null {
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset + 3 < data.length) {
    if (data[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = data[offset + 1];
    if (marker === undefined) {
      return null;
    }

    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }

    if (offset + 3 >= data.length) {
      return null;
    }
    const segmentLength = data.readUInt16BE(offset + 2);
    if (segmentLength < 2) {
      return null;
    }
    const segmentEnd = offset + 2 + segmentLength;
    if (segmentEnd > data.length) {
      return null;
    }

    if (isSofMarker(marker)) {
      if (offset + 8 >= data.length) {
        return null;
      }
      const height = data.readUInt16BE(offset + 5);
      const width = data.readUInt16BE(offset + 7);
      if (width <= 0 || height <= 0) {
        return null;
      }
      return [width, height];
    }

    offset = segmentEnd;
  }

  return null;
}

export function probeImageSize(filePath: string): [number, number] | null {
  let data: Buffer;
  try {
    data = readFileSync(filePath);
  } catch {
    return null;
  }

  return probePngSize(data) ?? probeJpegSize(data) ?? probeGifSize(data) ?? probeBmpSize(data);
}

function probeWavDurationUs(filePath: string): number | null {
  let data: Buffer;
  try {
    data = readFileSync(filePath);
  } catch {
    return null;
  }

  if (data.length < 44 || data.toString("ascii", 0, 4) !== "RIFF" || data.toString("ascii", 8, 12) !== "WAVE") {
    return null;
  }

  let offset = 12;
  let byteRate = 0;
  let dataSize = -1;

  while (offset + 8 <= data.length) {
    const chunkId = data.toString("ascii", offset, offset + 4);
    const chunkSize = data.readUInt32LE(offset + 4);
    const chunkDataOffset = offset + 8;
    if (chunkDataOffset + chunkSize > data.length) {
      break;
    }

    if (chunkId === "fmt " && chunkSize >= 12) {
      byteRate = data.readUInt32LE(chunkDataOffset + 8);
    } else if (chunkId === "data") {
      dataSize = chunkSize;
    }

    offset += 8 + chunkSize + (chunkSize % 2);
  }

  if (byteRate <= 0 || dataSize < 0) {
    return null;
  }

  return secondsToMicroseconds(dataSize / byteRate);
}

export function probeMedia(filePath: string): MediaProbeResult {
  const ffprobe = probeFromFfprobe(filePath);
  const imageSize = probeImageSize(filePath);

  return {
    durationUs: ffprobe?.durationUs ?? null,
    width: ffprobe?.width ?? imageSize?.[0] ?? null,
    height: ffprobe?.height ?? imageSize?.[1] ?? null,
    hasVideoStream: ffprobe?.hasVideoStream ?? false,
    hasAudioStream: ffprobe?.hasAudioStream ?? false
  };
}

export function probeAudioDurationUs(filePath: string): number | null {
  const fromMedia = probeMedia(filePath);
  if (fromMedia.durationUs !== null) {
    return fromMedia.durationUs;
  }
  return probeWavDurationUs(filePath);
}

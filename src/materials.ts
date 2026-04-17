import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { basename, extname, resolve } from "node:path";

import { probeAudioDurationUs, probeMedia } from "./media-probe.js";

export class CropSettings {
  upperLeftX: number;
  upperLeftY: number;
  upperRightX: number;
  upperRightY: number;
  lowerLeftX: number;
  lowerLeftY: number;
  lowerRightX: number;
  lowerRightY: number;

  constructor(init: Partial<CropSettings> = {}) {
    this.upperLeftX = init.upperLeftX ?? 0.0;
    this.upperLeftY = init.upperLeftY ?? 0.0;
    this.upperRightX = init.upperRightX ?? 1.0;
    this.upperRightY = init.upperRightY ?? 0.0;
    this.lowerLeftX = init.lowerLeftX ?? 0.0;
    this.lowerLeftY = init.lowerLeftY ?? 1.0;
    this.lowerRightX = init.lowerRightX ?? 1.0;
    this.lowerRightY = init.lowerRightY ?? 1.0;
  }

  exportJson(): Record<string, number> {
    return {
      upper_left_x: this.upperLeftX,
      upper_left_y: this.upperLeftY,
      upper_right_x: this.upperRightX,
      upper_right_y: this.upperRightY,
      lower_left_x: this.lowerLeftX,
      lower_left_y: this.lowerLeftY,
      lower_right_x: this.lowerRightX,
      lower_right_y: this.lowerRightY
    };
  }
}

export type VideoMaterialType = "video" | "photo";

export interface VideoMaterialOptions {
  materialName?: string;
  duration?: number;
  width?: number;
  height?: number;
  cropSettings?: CropSettings;
  materialType?: VideoMaterialType;
}

export class VideoMaterial {
  materialId: string;
  localMaterialId: string;
  materialName: string;
  path: string;
  duration: number;
  height: number;
  width: number;
  cropSettings: CropSettings;
  materialType: VideoMaterialType;

  constructor(filePath: string, options: VideoMaterialOptions = {}) {
    const absPath = resolve(filePath);
    if (!existsSync(absPath)) {
      throw new Error(`Cannot find ${absPath}`);
    }

    const ext = extname(absPath).toLowerCase();
    const isImage = [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"].includes(ext);
    let cachedProbe: ReturnType<typeof probeMedia> | null = null;
    const getProbe = () => {
      if (cachedProbe === null) {
        cachedProbe = probeMedia(absPath);
      }
      return cachedProbe;
    };

    const inferredType: VideoMaterialType = isImage ? "photo" : "video";

    this.materialType = options.materialType ?? inferredType;
    this.materialName = options.materialName ?? basename(absPath);
    this.materialId = randomUUID().replaceAll("-", "");
    this.localMaterialId = "";
    this.path = absPath;
    this.cropSettings = options.cropSettings ?? new CropSettings();
    this.width = options.width ?? getProbe().width ?? 1920;
    this.height = options.height ?? getProbe().height ?? 1080;

    if (options.duration !== undefined) {
      this.duration = Math.round(options.duration);
    } else if (this.materialType === "photo") {
      this.duration = 10_800 * 1_000_000;
    } else {
      const probedDuration = getProbe().durationUs;
      if (probedDuration !== null) {
        this.duration = probedDuration;
        return;
      }
      throw new Error(
        `Video duration could not be auto-detected for "${this.materialName}". Pass duration in microseconds in constructor options.`
      );
    }
  }

  exportJson(): Record<string, unknown> {
    return {
      audio_fade: null,
      category_id: "",
      category_name: "local",
      check_flag: 63487,
      crop: this.cropSettings.exportJson(),
      crop_ratio: "free",
      crop_scale: 1.0,
      duration: this.duration,
      height: this.height,
      id: this.materialId,
      local_material_id: this.localMaterialId,
      material_id: this.materialId,
      material_name: this.materialName,
      media_path: "",
      path: this.path,
      type: this.materialType,
      width: this.width
    };
  }
}

export interface AudioMaterialOptions {
  materialName?: string;
  duration?: number;
}

export class AudioMaterial {
  materialId: string;
  materialName: string;
  path: string;
  duration: number;

  constructor(filePath: string, options: AudioMaterialOptions = {}) {
    const absPath = resolve(filePath);
    if (!existsSync(absPath)) {
      throw new Error(`Cannot find ${absPath}`);
    }

    this.materialName = options.materialName ?? basename(absPath);
    this.materialId = randomUUID().replaceAll("-", "");
    this.path = absPath;

    if (options.duration !== undefined) {
      this.duration = Math.round(options.duration);
      return;
    }

    const probedDuration = probeAudioDurationUs(absPath);
    if (probedDuration !== null) {
      this.duration = probedDuration;
      return;
    }

    throw new Error(
      `Audio duration could not be auto-detected for "${this.materialName}". Pass duration in microseconds in constructor options.`
    );
  }

  exportJson(): Record<string, unknown> {
    return {
      app_id: 0,
      category_id: "",
      category_name: "local",
      check_flag: 3,
      copyright_limit_type: "none",
      duration: this.duration,
      effect_id: "",
      formula_id: "",
      id: this.materialId,
      local_material_id: this.materialId,
      music_id: this.materialId,
      name: this.materialName,
      path: this.path,
      source_platform: 0,
      type: "extract_music",
      wave_points: []
    };
  }
}

import { randomUUID } from "node:crypto";

import { AudioMaterial, VideoMaterial } from "./materials.js";
import { tim, Timerange } from "./time.js";
import { TrackType } from "./track.js";

export class BaseSegment {
  readonly trackType: TrackType;
  readonly segmentId: string;
  materialId: string;
  targetTimerange: Timerange;
  commonKeyframes: unknown[];

  constructor(trackType: TrackType, materialId: string, targetTimerange: Timerange) {
    this.trackType = trackType;
    this.segmentId = randomUUID().replaceAll("-", "");
    this.materialId = materialId;
    this.targetTimerange = targetTimerange;
    this.commonKeyframes = [];
  }

  get start(): number {
    return this.targetTimerange.start;
  }

  set start(value: number) {
    this.targetTimerange.start = Math.round(value);
  }

  get duration(): number {
    return this.targetTimerange.duration;
  }

  set duration(value: number) {
    this.targetTimerange.duration = Math.round(value);
  }

  get end(): number {
    return this.targetTimerange.end;
  }

  exportJson(): Record<string, unknown> {
    return {
      enable_adjust: true,
      enable_color_correct_adjust: false,
      enable_color_curves: true,
      enable_color_match_adjust: false,
      enable_color_wheels: true,
      enable_lut: true,
      enable_smart_color_adjust: false,
      last_nonzero_volume: 1.0,
      reverse: false,
      track_attribute: 0,
      track_render_index: 0,
      visible: true,
      id: this.segmentId,
      material_id: this.materialId,
      target_timerange: this.targetTimerange.exportJson(),
      common_keyframes: this.commonKeyframes,
      keyframe_refs: []
    };
  }
}

export class Speed {
  readonly globalId: string;
  speed: number;

  constructor(speed: number) {
    this.globalId = randomUUID().replaceAll("-", "");
    this.speed = speed;
  }

  exportJson(): Record<string, unknown> {
    return {
      curve_speed: null,
      id: this.globalId,
      mode: 0,
      speed: this.speed,
      type: "speed"
    };
  }
}

export class AudioFade {
  readonly fadeId: string;
  inDuration: number;
  outDuration: number;

  constructor(inDuration: number, outDuration: number) {
    this.fadeId = randomUUID().replaceAll("-", "");
    this.inDuration = inDuration;
    this.outDuration = outDuration;
  }

  exportJson(): Record<string, unknown> {
    return {
      id: this.fadeId,
      fade_in_duration: this.inDuration,
      fade_out_duration: this.outDuration,
      fade_type: 0,
      type: "audio_fade"
    };
  }
}

export class ClipSettings {
  alpha: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  rotation: number;
  scaleX: number;
  scaleY: number;
  transformX: number;
  transformY: number;

  constructor(init: Partial<ClipSettings> = {}) {
    this.alpha = init.alpha ?? 1.0;
    this.flipHorizontal = init.flipHorizontal ?? false;
    this.flipVertical = init.flipVertical ?? false;
    this.rotation = init.rotation ?? 0.0;
    this.scaleX = init.scaleX ?? 1.0;
    this.scaleY = init.scaleY ?? 1.0;
    this.transformX = init.transformX ?? 0.0;
    this.transformY = init.transformY ?? 0.0;
  }

  exportJson(): Record<string, unknown> {
    return {
      alpha: this.alpha,
      flip: { horizontal: this.flipHorizontal, vertical: this.flipVertical },
      rotation: this.rotation,
      scale: { x: this.scaleX, y: this.scaleY },
      transform: { x: this.transformX, y: this.transformY }
    };
  }
}

export class MediaSegment extends BaseSegment {
  sourceTimerange: Timerange | null;
  speed: Speed;
  volume: number;
  changePitch: boolean;
  extraMaterialRefs: string[];

  constructor(
    trackType: TrackType,
    materialId: string,
    sourceTimerange: Timerange | null,
    targetTimerange: Timerange,
    speed: number,
    volume: number,
    changePitch: boolean
  ) {
    super(trackType, materialId, targetTimerange);
    this.sourceTimerange = sourceTimerange;
    this.speed = new Speed(speed);
    this.volume = volume;
    this.changePitch = changePitch;
    this.extraMaterialRefs = [this.speed.globalId];
  }

  exportJson(): Record<string, unknown> {
    const base = super.exportJson();
    return {
      ...base,
      source_timerange: this.sourceTimerange ? this.sourceTimerange.exportJson() : null,
      speed: this.speed.speed,
      volume: this.volume,
      extra_material_refs: this.extraMaterialRefs,
      is_tone_modify: this.changePitch
    };
  }
}

export class VisualSegment extends MediaSegment {
  clipSettings: ClipSettings;
  uniformScale: boolean;
  animationsInstance: unknown;

  constructor(
    trackType: TrackType,
    materialId: string,
    sourceTimerange: Timerange | null,
    targetTimerange: Timerange,
    speed: number,
    volume: number,
    changePitch: boolean,
    clipSettings?: ClipSettings
  ) {
    super(trackType, materialId, sourceTimerange, targetTimerange, speed, volume, changePitch);
    this.clipSettings = clipSettings ?? new ClipSettings();
    this.uniformScale = true;
    this.animationsInstance = null;
  }

  exportJson(): Record<string, unknown> {
    const base = super.exportJson();
    return {
      ...base,
      clip: this.clipSettings.exportJson(),
      uniform_scale: { on: this.uniformScale, value: 1.0 }
    };
  }
}

export interface VideoSegmentOptions {
  sourceTimerange?: Timerange;
  speed?: number;
  volume?: number;
  changePitch?: boolean;
  clipSettings?: ClipSettings;
}

export class VideoSegment extends VisualSegment {
  readonly materialInstance: VideoMaterial;
  fade: AudioFade | null;

  constructor(material: VideoMaterial, targetTimerange: Timerange, options: VideoSegmentOptions = {}) {
    const sourceTimerange = options.sourceTimerange;
    const sourceAndSpeed = sourceTimerange !== undefined && options.speed !== undefined;

    let finalTarget = targetTimerange;
    let finalSource = sourceTimerange;
    let finalSpeed: number;

    if (sourceAndSpeed) {
      finalSpeed = options.speed as number;
      finalTarget = new Timerange(targetTimerange.start, Math.round((sourceTimerange as Timerange).duration / finalSpeed));
    } else if (sourceTimerange && options.speed === undefined) {
      finalSpeed = sourceTimerange.duration / targetTimerange.duration;
    } else {
      finalSpeed = options.speed ?? 1.0;
      finalSource = new Timerange(0, Math.round(targetTimerange.duration * finalSpeed));
    }

    if (finalSource && finalSource.end > material.duration) {
      throw new Error(`Source timerange ${finalSource} exceeds material duration (${material.duration})`);
    }

    super(
      TrackType.video,
      material.materialId,
      finalSource ?? null,
      finalTarget,
      finalSpeed,
      options.volume ?? 1.0,
      options.changePitch ?? false,
      options.clipSettings
    );
    this.materialInstance = material;
    this.fade = null;
  }

  addFade(inDuration: string | number, outDuration: string | number): this {
    this.fade = new AudioFade(tim(inDuration), tim(outDuration));
    if (!this.extraMaterialRefs.includes(this.fade.fadeId)) {
      this.extraMaterialRefs.push(this.fade.fadeId);
    }
    return this;
  }

  exportJson(): Record<string, unknown> {
    const base = super.exportJson();
    return {
      ...base,
      hdr_settings: { intensity: 1.0, mode: 1, nits: 1000 }
    };
  }
}

export interface AudioSegmentOptions {
  sourceTimerange?: Timerange;
  speed?: number;
  volume?: number;
  changePitch?: boolean;
}

export class AudioSegment extends MediaSegment {
  readonly materialInstance: AudioMaterial;
  fade: AudioFade | null;

  constructor(material: AudioMaterial, targetTimerange: Timerange, options: AudioSegmentOptions = {}) {
    const sourceTimerange = options.sourceTimerange;
    const sourceAndSpeed = sourceTimerange !== undefined && options.speed !== undefined;

    let finalTarget = targetTimerange;
    let finalSource = sourceTimerange;
    let finalSpeed: number;

    if (sourceAndSpeed) {
      finalSpeed = options.speed as number;
      finalTarget = new Timerange(targetTimerange.start, Math.round((sourceTimerange as Timerange).duration / finalSpeed));
    } else if (sourceTimerange && options.speed === undefined) {
      finalSpeed = sourceTimerange.duration / targetTimerange.duration;
    } else {
      finalSpeed = options.speed ?? 1.0;
      finalSource = new Timerange(0, Math.round(targetTimerange.duration * finalSpeed));
    }

    if (finalSource && finalSource.end > material.duration) {
      throw new Error(`Source timerange ${finalSource} exceeds material duration (${material.duration})`);
    }

    super(
      TrackType.audio,
      material.materialId,
      finalSource ?? null,
      finalTarget,
      finalSpeed,
      options.volume ?? 1.0,
      options.changePitch ?? false
    );
    this.materialInstance = material;
    this.fade = null;
  }

  addFade(inDuration: string | number, outDuration: string | number): this {
    this.fade = new AudioFade(tim(inDuration), tim(outDuration));
    if (!this.extraMaterialRefs.includes(this.fade.fadeId)) {
      this.extraMaterialRefs.push(this.fade.fadeId);
    }
    return this;
  }

  exportJson(): Record<string, unknown> {
    const base = super.exportJson();
    return {
      ...base,
      clip: null,
      hdr_settings: null
    };
  }
}

export class TextStyle {
  size: number;
  color: [number, number, number];
  align: number;
  alpha: number;
  autoWrapping: boolean;

  constructor(init: Partial<TextStyle> = {}) {
    this.size = init.size ?? 8.0;
    this.color = init.color ?? [1.0, 1.0, 1.0];
    this.align = init.align ?? 1;
    this.alpha = init.alpha ?? 1.0;
    this.autoWrapping = init.autoWrapping ?? false;
  }
}

export interface TextSegmentOptions {
  style?: TextStyle;
  clipSettings?: ClipSettings;
}

export class TextSegment extends VisualSegment {
  text: string;
  style: TextStyle;

  constructor(text: string, timerange: Timerange, options: TextSegmentOptions = {}) {
    super(
      TrackType.text,
      randomUUID().replaceAll("-", ""),
      null,
      timerange,
      1.0,
      1.0,
      false,
      options.clipSettings
    );
    this.text = text;
    this.style = options.style ?? new TextStyle();
  }

  static createFromTemplate(text: string, timerange: Timerange, template: TextSegment): TextSegment {
    return new TextSegment(text, timerange, {
      style: new TextStyle({ ...template.style }),
      clipSettings: new ClipSettings({ ...template.clipSettings })
    });
  }

  exportMaterial(): Record<string, unknown> {
    const contentJson = {
      styles: [
        {
          fill: {
            alpha: 1.0,
            content: {
              render_type: "solid",
              solid: {
                alpha: 1.0,
                color: [...this.style.color]
              }
            }
          },
          range: [0, this.text.length],
          size: this.style.size
        }
      ],
      text: this.text
    };

    return {
      id: this.materialId,
      content: JSON.stringify(contentJson),
      alignment: this.style.align,
      check_flag: 7,
      type: this.style.autoWrapping ? "subtitle" : "text",
      global_alpha: this.style.alpha
    };
  }
}

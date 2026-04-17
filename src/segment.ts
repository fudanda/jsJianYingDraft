import { randomUUID } from "node:crypto";

import { AudioMaterial, VideoMaterial } from "./materials.js";
import {
  AudioEffectPresetInput,
  FilterPresetInput,
  MaskPresetInput,
  MixModePresetInput,
  TextAnimationPresetInput,
  TransitionPresetInput,
  VideoAnimationPresetInput,
  VideoEffectPresetInput,
  resolveAudioEffectMeta,
  resolveFilterMeta,
  resolveMaskMeta,
  resolveMixModeMeta,
  resolveTextAnimationMeta,
  resolveTransitionMeta,
  resolveVideoAnimationMeta,
  resolveVideoEffectMeta
} from "./metadata-lite.js";
import { tim, Timerange } from "./time.js";
import { TrackType } from "./track.js";

export class BaseSegment {
  readonly trackType: TrackType;
  readonly segmentId: string;
  materialId: string;
  targetTimerange: Timerange;
  commonKeyframes: KeyframeList[];

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
      common_keyframes: this.commonKeyframes.map((item) => item.exportJson()),
      keyframe_refs: []
    };
  }
}

export class Keyframe {
  readonly keyframeId: string;
  timeOffset: number;
  values: number[];

  constructor(timeOffset: number, value: number) {
    this.keyframeId = randomUUID().replaceAll("-", "");
    this.timeOffset = Math.round(timeOffset);
    this.values = [value];
  }

  exportJson(): Record<string, unknown> {
    return {
      curveType: "Line",
      graphID: "",
      left_control: { x: 0.0, y: 0.0 },
      right_control: { x: 0.0, y: 0.0 },
      id: this.keyframeId,
      time_offset: this.timeOffset,
      values: this.values
    };
  }
}

export enum KeyframeProperty {
  positionX = "KFTypePositionX",
  positionY = "KFTypePositionY",
  rotation = "KFTypeRotation",
  scaleX = "KFTypeScaleX",
  scaleY = "KFTypeScaleY",
  uniformScale = "UNIFORM_SCALE",
  alpha = "KFTypeAlpha",
  saturation = "KFTypeSaturation",
  contrast = "KFTypeContrast",
  brightness = "KFTypeBrightness",
  volume = "KFTypeVolume"
}

export class KeyframeList {
  readonly listId: string;
  readonly keyframeProperty: KeyframeProperty;
  readonly keyframes: Keyframe[];

  constructor(keyframeProperty: KeyframeProperty) {
    this.listId = randomUUID().replaceAll("-", "");
    this.keyframeProperty = keyframeProperty;
    this.keyframes = [];
  }

  addKeyframe(timeOffset: number, value: number): void {
    this.keyframes.push(new Keyframe(timeOffset, value));
    this.keyframes.sort((a, b) => a.timeOffset - b.timeOffset);
  }

  exportJson(): Record<string, unknown> {
    return {
      id: this.listId,
      keyframe_list: this.keyframes.map((item) => item.exportJson()),
      material_id: "",
      property_type: this.keyframeProperty
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

export interface AnimationMeta {
  title: string;
  effectId: string;
  resourceId: string;
  duration: number;
}

export type VideoAnimationType = "in" | "out" | "group";
export type TextAnimationType = "in" | "out" | "loop";

export interface VideoAnimationMeta extends AnimationMeta {
  animationType: VideoAnimationType;
}

export interface TextAnimationMeta extends AnimationMeta {
  animationType: TextAnimationType;
}

export class Animation {
  readonly name: string;
  readonly effectId: string;
  readonly animationType: VideoAnimationType | TextAnimationType;
  readonly resourceId: string;
  readonly isVideoAnimation: boolean;
  start: number;
  duration: number;

  constructor(
    meta: AnimationMeta,
    animationType: VideoAnimationType | TextAnimationType,
    isVideoAnimation: boolean,
    start: number,
    duration: number
  ) {
    this.name = meta.title;
    this.effectId = meta.effectId;
    this.animationType = animationType;
    this.resourceId = meta.resourceId;
    this.isVideoAnimation = isVideoAnimation;
    this.start = Math.round(start);
    this.duration = Math.round(duration);
  }

  exportJson(): Record<string, unknown> {
    return {
      anim_adjust_params: null,
      platform: "all",
      panel: this.isVideoAnimation ? "video" : "",
      material_type: this.isVideoAnimation ? "video" : "sticker",
      name: this.name,
      id: this.effectId,
      type: this.animationType,
      resource_id: this.resourceId,
      start: this.start,
      duration: this.duration
    };
  }
}

export class VideoAnimation extends Animation {
  constructor(meta: VideoAnimationMeta, start: number, duration: number) {
    super(meta, meta.animationType, true, start, duration);
  }
}

export class TextAnimation extends Animation {
  constructor(meta: TextAnimationMeta, start: number, duration: number) {
    super(meta, meta.animationType, false, start, duration);
  }
}

export class SegmentAnimations {
  readonly animationId: string;
  readonly animations: Array<VideoAnimation | TextAnimation>;

  constructor() {
    this.animationId = randomUUID().replaceAll("-", "");
    this.animations = [];
  }

  getAnimationTrange(animationType: VideoAnimationType | TextAnimationType): Timerange | null {
    const found = this.animations.find((animation) => animation.animationType === animationType);
    if (!found) {
      return null;
    }
    return new Timerange(found.start, found.duration);
  }

  addAnimation(animation: VideoAnimation | TextAnimation): void {
    if (this.animations.some((item) => item.animationType === animation.animationType)) {
      throw new Error(`Animation type "${animation.animationType}" already exists on this segment`);
    }

    if (animation instanceof VideoAnimation) {
      const hasGroup = this.animations.some((item) => item.animationType === "group");
      if (hasGroup) {
        throw new Error("Cannot add other animations when group animation already exists");
      }
      if (animation.animationType === "group" && this.animations.length > 0) {
        throw new Error("Cannot add group animation when another animation already exists");
      }
    } else {
      const hasLoop = this.animations.some((item) => item.animationType === "loop");
      if (hasLoop) {
        throw new Error("Cannot add more text animations when loop animation already exists");
      }
    }

    this.animations.push(animation);
  }

  exportJson(): Record<string, unknown> {
    return {
      id: this.animationId,
      type: "sticker_animation",
      multi_language_current: "none",
      animations: this.animations.map((item) => item.exportJson())
    };
  }
}

export interface EffectParam {
  name: string;
  defaultValue: number;
  minValue: number;
  maxValue: number;
}

export interface EffectMeta {
  name: string;
  effectId: string;
  resourceId: string;
  params?: ReadonlyArray<EffectParam>;
}

export type VideoEffectType = "video_effect" | "face_effect";

class EffectParamInstance {
  readonly name: string;
  readonly defaultValue: number;
  readonly minValue: number;
  readonly maxValue: number;
  readonly index: number;
  value: number;

  constructor(meta: EffectParam, index: number, value: number) {
    this.name = meta.name;
    this.defaultValue = meta.defaultValue;
    this.minValue = meta.minValue;
    this.maxValue = meta.maxValue;
    this.index = index;
    this.value = value;
  }

  exportJson(): Record<string, unknown> {
    return {
      default_value: this.defaultValue,
      max_value: this.maxValue,
      min_value: this.minValue,
      name: this.name,
      parameterIndex: this.index,
      portIndex: 0,
      value: this.value
    };
  }
}

function parseEffectParams(meta: EffectMeta, params: Array<number | null> = []): EffectParamInstance[] {
  const paramDefs = meta.params ?? [];
  if (params.length > paramDefs.length) {
    throw new RangeError(`Too many params for effect "${meta.name}": got ${params.length}, expected ${paramDefs.length}`);
  }

  return paramDefs.map((paramDef, index) => {
    const input = params[index];
    let value = paramDef.defaultValue;
    if (input !== undefined && input !== null) {
      if (input < 0 || input > 100) {
        throw new RangeError(`Effect param "${paramDef.name}" should be in [0, 100], got ${input}`);
      }
      value = paramDef.minValue + ((paramDef.maxValue - paramDef.minValue) * input) / 100;
    }
    return new EffectParamInstance(paramDef, index, value);
  });
}

export type AudioEffectCategory = "sound_effect" | "tone" | "speech_to_song";

export interface AudioEffectMeta extends EffectMeta {
  categoryId: AudioEffectCategory;
  categoryName?: string;
  categoryIndex?: 1 | 2 | 3;
}

function audioCategoryName(categoryId: AudioEffectCategory): string {
  if (categoryId === "sound_effect") {
    return "场景音";
  }
  if (categoryId === "tone") {
    return "音色";
  }
  return "声音成曲";
}

function audioCategoryIndex(categoryId: AudioEffectCategory): 1 | 2 | 3 {
  if (categoryId === "sound_effect") {
    return 1;
  }
  if (categoryId === "tone") {
    return 2;
  }
  return 3;
}

export class AudioEffect {
  readonly name: string;
  readonly effectId: string;
  readonly resourceId: string;
  readonly categoryId: AudioEffectCategory;
  readonly categoryName: string;
  readonly categoryIndex: 1 | 2 | 3;
  readonly adjustParams: EffectParamInstance[];

  constructor(meta: AudioEffectMeta, params?: Array<number | null>) {
    this.name = meta.name;
    this.effectId = randomUUID().replaceAll("-", "");
    this.resourceId = meta.resourceId;
    this.categoryId = meta.categoryId;
    this.categoryName = meta.categoryName ?? audioCategoryName(meta.categoryId);
    this.categoryIndex = meta.categoryIndex ?? audioCategoryIndex(meta.categoryId);
    this.adjustParams = parseEffectParams(meta, params);
  }

  exportJson(): Record<string, unknown> {
    return {
      audio_adjust_params: this.adjustParams.map((item) => item.exportJson()),
      category_id: this.categoryId,
      category_name: this.categoryName,
      id: this.effectId,
      is_ugc: false,
      name: this.name,
      production_path: "",
      resource_id: this.resourceId,
      speaker_id: "",
      sub_type: this.categoryIndex,
      time_range: { duration: 0, start: 0 },
      type: "audio_effect"
    };
  }
}

export interface VideoEffectOptions {
  params?: Array<number | null>;
  effectType?: VideoEffectType;
  applyTargetType?: 0 | 2;
}

export class VideoEffect {
  readonly globalId: string;
  readonly name: string;
  readonly effectId: string;
  readonly resourceId: string;
  readonly effectType: VideoEffectType;
  readonly applyTargetType: 0 | 2;
  readonly adjustParams: EffectParamInstance[];

  constructor(meta: EffectMeta, options: VideoEffectOptions = {}) {
    this.globalId = randomUUID().replaceAll("-", "");
    this.name = meta.name;
    this.effectId = meta.effectId;
    this.resourceId = meta.resourceId;
    this.effectType = options.effectType ?? "video_effect";
    this.applyTargetType = options.applyTargetType ?? 0;
    this.adjustParams = parseEffectParams(meta, options.params);
  }

  exportJson(): Record<string, unknown> {
    return {
      adjust_params: this.adjustParams.map((item) => item.exportJson()),
      apply_target_type: this.applyTargetType,
      apply_time_range: null,
      category_id: "",
      category_name: "",
      common_keyframes: [],
      disable_effect_faces: [],
      effect_id: this.effectId,
      formula_id: "",
      id: this.globalId,
      name: this.name,
      platform: "all",
      render_index: 11_000,
      resource_id: this.resourceId,
      source_platform: 0,
      time_range: null,
      track_render_index: 0,
      type: this.effectType,
      value: 1.0,
      version: ""
    };
  }
}

export class Filter {
  readonly globalId: string;
  readonly meta: EffectMeta;
  readonly applyTargetType: 0 | 2;
  intensity: number;

  constructor(meta: EffectMeta, intensity = 1.0, applyTargetType: 0 | 2 = 0) {
    if (intensity < 0 || intensity > 1) {
      throw new RangeError(`Filter intensity should be in [0, 1], got ${intensity}`);
    }
    this.globalId = randomUUID().replaceAll("-", "");
    this.meta = meta;
    this.intensity = intensity;
    this.applyTargetType = applyTargetType;
  }

  exportJson(): Record<string, unknown> {
    return {
      adjust_params: [],
      algorithm_artifact_path: "",
      apply_target_type: this.applyTargetType,
      bloom_params: null,
      category_id: "",
      category_name: "",
      color_match_info: {
        source_feature_path: "",
        target_feature_path: "",
        target_image_path: ""
      },
      effect_id: this.meta.effectId,
      enable_skin_tone_correction: false,
      exclusion_group: [],
      face_adjust_params: [],
      formula_id: "",
      id: this.globalId,
      intensity_key: "",
      multi_language_current: "",
      name: this.meta.name,
      panel_id: "",
      platform: "all",
      resource_id: this.meta.resourceId,
      source_platform: 1,
      sub_type: "none",
      time_range: null,
      type: "filter",
      value: this.intensity,
      version: ""
    };
  }
}

export interface MaskMeta {
  name: string;
  resourceType: string;
  resourceId: string;
  effectId: string;
  defaultAspectRatio: number;
}

export class Mask {
  readonly maskMeta: MaskMeta;
  readonly globalId: string;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  aspectRatio: number;
  rotation: number;
  invert: boolean;
  feather: number;
  roundCorner: number;

  constructor(
    maskMeta: MaskMeta,
    cx: number,
    cy: number,
    width: number,
    height: number,
    aspectRatio: number,
    rotation: number,
    invert: boolean,
    feather: number,
    roundCorner: number
  ) {
    this.maskMeta = maskMeta;
    this.globalId = randomUUID().replaceAll("-", "");
    this.centerX = cx;
    this.centerY = cy;
    this.width = width;
    this.height = height;
    this.aspectRatio = aspectRatio;
    this.rotation = rotation;
    this.invert = invert;
    this.feather = feather;
    this.roundCorner = roundCorner;
  }

  exportJson(): Record<string, unknown> {
    return {
      config: {
        aspectRatio: this.aspectRatio,
        centerX: this.centerX,
        centerY: this.centerY,
        feather: this.feather,
        height: this.height,
        invert: this.invert,
        rotation: this.rotation,
        roundCorner: this.roundCorner,
        width: this.width
      },
      id: this.globalId,
      name: this.maskMeta.name,
      platform: "all",
      position_info: "",
      resource_type: this.maskMeta.resourceType,
      resource_id: this.maskMeta.resourceId,
      type: "mask"
    };
  }
}

export interface TransitionMeta {
  name: string;
  resourceId: string;
  effectId: string;
  defaultDuration: number;
  isOverlap: boolean;
}

export class Transition {
  readonly name: string;
  readonly globalId: string;
  readonly effectId: string;
  readonly resourceId: string;
  duration: number;
  isOverlap: boolean;

  constructor(meta: TransitionMeta, duration?: number) {
    this.name = meta.name;
    this.globalId = randomUUID().replaceAll("-", "");
    this.effectId = meta.effectId;
    this.resourceId = meta.resourceId;
    this.duration = Math.round(duration ?? meta.defaultDuration);
    this.isOverlap = meta.isOverlap;
  }

  exportJson(): Record<string, unknown> {
    return {
      category_id: "",
      category_name: "",
      duration: this.duration,
      effect_id: this.effectId,
      id: this.globalId,
      is_overlap: this.isOverlap,
      name: this.name,
      platform: "all",
      resource_id: this.resourceId,
      type: "transition"
    };
  }
}

export type BackgroundFillingType = "canvas_blur" | "canvas_color";

export class BackgroundFilling {
  readonly globalId: string;
  fillType: BackgroundFillingType;
  blur: number;
  color: string;

  constructor(fillType: BackgroundFillingType, blur: number, color: string) {
    this.globalId = randomUUID().replaceAll("-", "");
    this.fillType = fillType;
    this.blur = blur;
    this.color = color;
  }

  exportJson(): Record<string, unknown> {
    return {
      id: this.globalId,
      type: this.fillType,
      blur: this.blur,
      color: this.color,
      source_platform: 0
    };
  }
}

export class MixMode {
  readonly globalId: string;
  readonly meta: EffectMeta;
  readonly applyTargetType: 0 | 2;

  constructor(meta: EffectMeta, applyTargetType: 0 | 2 = 0) {
    this.globalId = randomUUID().replaceAll("-", "");
    this.meta = meta;
    this.applyTargetType = applyTargetType;
  }

  exportJson(): Record<string, unknown> {
    return {
      type: "mix_mode",
      name: this.meta.name,
      effect_id: this.meta.effectId,
      resource_id: this.meta.resourceId,
      value: 1.0,
      apply_target_type: this.applyTargetType,
      platform: "all",
      source_platform: 0,
      category_id: "",
      category_name: "",
      sub_type: "none",
      time_range: null,
      id: this.globalId
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
  animationsInstance: SegmentAnimations | null;

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

  addKeyframe(property: KeyframeProperty, timeOffset: string | number, value: number): this {
    let finalProperty = property;
    if (
      (finalProperty === KeyframeProperty.scaleX || finalProperty === KeyframeProperty.scaleY) &&
      this.uniformScale
    ) {
      this.uniformScale = false;
    } else if (finalProperty === KeyframeProperty.uniformScale) {
      if (!this.uniformScale) {
        throw new Error("Cannot set uniformScale keyframe after scaleX/scaleY keyframes are set");
      }
      finalProperty = KeyframeProperty.scaleX;
    }

    const offsetUs = tim(timeOffset);
    const existed = this.commonKeyframes.find((item) => item.keyframeProperty === finalProperty);
    if (existed) {
      existed.addKeyframe(offsetUs, value);
      return this;
    }

    const keyframeList = new KeyframeList(finalProperty);
    keyframeList.addKeyframe(offsetUs, value);
    this.commonKeyframes.push(keyframeList);
    return this;
  }

  /** @deprecated Use addKeyframe instead. */
  add_keyframe(property: KeyframeProperty, timeOffset: string | number, value: number): this {
    return this.addKeyframe(property, timeOffset, value);
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

export interface AddMaskOptions {
  centerX?: number;
  centerY?: number;
  size?: number;
  rotation?: number;
  feather?: number;
  invert?: boolean;
  rectWidth?: number;
  roundCorner?: number;
}

export class VideoSegment extends VisualSegment {
  readonly materialInstance: VideoMaterial;
  readonly materialSize: [number, number];
  fade: AudioFade | null;
  effects: VideoEffect[];
  filters: Filter[];
  mixModes: MixMode[];
  mask: Mask | null;
  transition: Transition | null;
  backgroundFilling: BackgroundFilling | null;

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
    this.materialSize = [material.width, material.height];
    this.fade = null;
    this.effects = [];
    this.filters = [];
    this.mixModes = [];
    this.mask = null;
    this.transition = null;
    this.backgroundFilling = null;
  }

  addFade(inDuration: string | number, outDuration: string | number): this {
    if (this.fade !== null) {
      throw new Error("Audio fade already exists on this segment");
    }
    this.fade = new AudioFade(tim(inDuration), tim(outDuration));
    if (!this.extraMaterialRefs.includes(this.fade.fadeId)) {
      this.extraMaterialRefs.push(this.fade.fadeId);
    }
    return this;
  }

  addAnimation(animationMeta: VideoAnimationMeta | VideoAnimationPresetInput, duration?: string | number): this {
    const resolved = resolveVideoAnimationMeta(animationMeta);
    let start = 0;
    let finalDuration = duration === undefined ? resolved.duration : tim(duration);

    if (resolved.animationType === "in") {
      start = 0;
    } else if (resolved.animationType === "out") {
      start = this.targetTimerange.duration - finalDuration;
    } else if (resolved.animationType === "group") {
      start = 0;
      finalDuration = duration === undefined ? this.targetTimerange.duration : tim(duration);
    } else {
      throw new TypeError(`Invalid video animation type "${String(resolved.animationType)}"`);
    }

    if (this.animationsInstance === null) {
      this.animationsInstance = new SegmentAnimations();
      this.extraMaterialRefs.push(this.animationsInstance.animationId);
    }

    this.animationsInstance.addAnimation(new VideoAnimation(resolved, start, finalDuration));
    return this;
  }

  addEffect(
    meta: EffectMeta | VideoEffectPresetInput,
    options: Omit<VideoEffectOptions, "applyTargetType"> = {}
  ): this {
    const resolved = resolveVideoEffectMeta(meta);
    const effect = new VideoEffect(resolved.meta, {
      ...options,
      effectType: options.effectType ?? resolved.effectType,
      applyTargetType: 0
    });
    this.effects.push(effect);
    this.extraMaterialRefs.push(effect.globalId);
    return this;
  }

  addFilter(meta: EffectMeta | FilterPresetInput, intensity = 100): this {
    if (intensity < 0 || intensity > 100) {
      throw new RangeError(`Filter intensity should be in [0, 100], got ${intensity}`);
    }
    const filter = new Filter(resolveFilterMeta(meta), intensity / 100, 0);
    this.filters.push(filter);
    this.extraMaterialRefs.push(filter.globalId);
    return this;
  }

  setMixMode(meta: EffectMeta | MixModePresetInput): this {
    const mixMode = new MixMode(resolveMixModeMeta(meta));
    this.mixModes.push(mixMode);
    this.extraMaterialRefs.push(mixMode.globalId);
    return this;
  }

  addMask(maskMeta: MaskMeta | MaskPresetInput, options: AddMaskOptions = {}): this {
    const resolvedMaskMeta = resolveMaskMeta(maskMeta);
    if (this.mask !== null) {
      throw new Error("Mask already exists on this segment");
    }

    const centerX = options.centerX ?? 0.0;
    const centerY = options.centerY ?? 0.0;
    const size = options.size ?? 0.5;
    const rotation = options.rotation ?? 0.0;
    const feather = options.feather ?? 0.0;
    const invert = options.invert ?? false;

    if (
      (options.rectWidth !== undefined || options.roundCorner !== undefined) &&
      resolvedMaskMeta.resourceType !== "rectangle"
    ) {
      throw new Error("rectWidth and roundCorner are only valid for rectangle mask");
    }

    const materialWidth = this.materialSize[0];
    const materialHeight = this.materialSize[1];
    const rectWidth = options.rectWidth ?? (resolvedMaskMeta.resourceType === "rectangle" ? size : undefined);
    const roundCorner = options.roundCorner ?? 0.0;
    const width =
      rectWidth ??
      (size * materialHeight * resolvedMaskMeta.defaultAspectRatio) / (materialWidth === 0 ? 1 : materialWidth);

    this.mask = new Mask(
      resolvedMaskMeta,
      centerX / (materialWidth / 2),
      centerY / (materialHeight / 2),
      width,
      size,
      resolvedMaskMeta.defaultAspectRatio,
      rotation,
      invert,
      feather / 100,
      roundCorner / 100
    );
    this.extraMaterialRefs.push(this.mask.globalId);
    return this;
  }

  addTransition(transitionMeta: TransitionMeta | TransitionPresetInput, duration?: string | number): this {
    const resolvedTransitionMeta = resolveTransitionMeta(transitionMeta);
    if (this.transition !== null) {
      throw new Error("Transition already exists on this segment");
    }

    const durationUs = duration === undefined ? undefined : tim(duration);
    this.transition = new Transition(resolvedTransitionMeta, durationUs);
    this.extraMaterialRefs.push(this.transition.globalId);
    return this;
  }

  addBackgroundFilling(fillType: "blur" | "color", blur = 0.0625, color = "#00000000"): this {
    if (this.backgroundFilling !== null) {
      throw new Error("Background filling already exists on this segment");
    }

    if (fillType === "blur") {
      this.backgroundFilling = new BackgroundFilling("canvas_blur", blur, color);
    } else if (fillType === "color") {
      this.backgroundFilling = new BackgroundFilling("canvas_color", blur, color);
    } else {
      throw new Error(`Invalid background filling type "${String(fillType)}"`);
    }

    this.extraMaterialRefs.push(this.backgroundFilling.globalId);
    return this;
  }

  /** @deprecated Use addFade instead. */
  add_fade(inDuration: string | number, outDuration: string | number): this {
    return this.addFade(inDuration, outDuration);
  }

  /** @deprecated Use addAnimation instead. */
  add_animation(animationMeta: VideoAnimationMeta | VideoAnimationPresetInput, duration?: string | number): this {
    return this.addAnimation(animationMeta, duration);
  }

  /** @deprecated Use addEffect instead. */
  add_effect(meta: EffectMeta | VideoEffectPresetInput, options: Omit<VideoEffectOptions, "applyTargetType"> = {}): this {
    return this.addEffect(meta, options);
  }

  /** @deprecated Use addFilter instead. */
  add_filter(meta: EffectMeta | FilterPresetInput, intensity = 100): this {
    return this.addFilter(meta, intensity);
  }

  /** @deprecated Use setMixMode instead. */
  set_mix_mode(meta: EffectMeta | MixModePresetInput): this {
    return this.setMixMode(meta);
  }

  /** @deprecated Use addMask instead. */
  add_mask(maskMeta: MaskMeta | MaskPresetInput, options: AddMaskOptions = {}): this {
    return this.addMask(maskMeta, options);
  }

  /** @deprecated Use addTransition instead. */
  add_transition(transitionMeta: TransitionMeta | TransitionPresetInput, duration?: string | number): this {
    return this.addTransition(transitionMeta, duration);
  }

  /** @deprecated Use addBackgroundFilling instead. */
  add_background_filling(fillType: "blur" | "color", blur = 0.0625, color = "#00000000"): this {
    return this.addBackgroundFilling(fillType, blur, color);
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
  effects: AudioEffect[];

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
    this.effects = [];
  }

  addFade(inDuration: string | number, outDuration: string | number): this {
    if (this.fade !== null) {
      throw new Error("Audio fade already exists on this segment");
    }
    this.fade = new AudioFade(tim(inDuration), tim(outDuration));
    if (!this.extraMaterialRefs.includes(this.fade.fadeId)) {
      this.extraMaterialRefs.push(this.fade.fadeId);
    }
    return this;
  }

  addEffect(meta: AudioEffectMeta | AudioEffectPresetInput, params?: Array<number | null>): this {
    const effect = new AudioEffect(resolveAudioEffectMeta(meta), params);
    if (this.effects.some((item) => item.categoryId === effect.categoryId)) {
      throw new Error(`Audio effect category "${effect.categoryName}" already exists on this segment`);
    }
    this.effects.push(effect);
    this.extraMaterialRefs.push(effect.effectId);
    return this;
  }

  addKeyframe(timeOffset: string | number, volume: number): this {
    const offsetUs = tim(timeOffset);
    const existed = this.commonKeyframes.find((item) => item.keyframeProperty === KeyframeProperty.volume);
    if (existed) {
      existed.addKeyframe(offsetUs, volume);
      return this;
    }

    const keyframeList = new KeyframeList(KeyframeProperty.volume);
    keyframeList.addKeyframe(offsetUs, volume);
    this.commonKeyframes.push(keyframeList);
    return this;
  }

  /** @deprecated Use addFade instead. */
  add_fade(inDuration: string | number, outDuration: string | number): this {
    return this.addFade(inDuration, outDuration);
  }

  /** @deprecated Use addEffect instead. */
  add_effect(meta: AudioEffectMeta | AudioEffectPresetInput, params?: Array<number | null>): this {
    return this.addEffect(meta, params);
  }

  /** @deprecated Use addKeyframe instead. */
  add_keyframe(timeOffset: string | number, volume: number): this {
    return this.addKeyframe(timeOffset, volume);
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

export interface EffectSegmentOptions {
  params?: Array<number | null>;
  effectType?: VideoEffectType;
}

export class EffectSegment extends BaseSegment {
  readonly effectInst: VideoEffect;

  constructor(
    meta: EffectMeta | VideoEffectPresetInput,
    targetTimerange: Timerange,
    options: EffectSegmentOptions = {}
  ) {
    const resolved = resolveVideoEffectMeta(meta);
    const effectInst = new VideoEffect(resolved.meta, {
      params: options.params,
      effectType: options.effectType ?? resolved.effectType,
      applyTargetType: 2
    });
    super(TrackType.effect, effectInst.globalId, targetTimerange);
    this.effectInst = effectInst;
  }
}

export class FilterSegment extends BaseSegment {
  readonly material: Filter;

  constructor(meta: EffectMeta | FilterPresetInput, targetTimerange: Timerange, intensity = 1.0) {
    const material = new Filter(resolveFilterMeta(meta), intensity, 0);
    super(TrackType.filter, material.globalId, targetTimerange);
    this.material = material;
  }
}

export interface StickerSegmentOptions {
  clipSettings?: ClipSettings;
}

export class StickerSegment extends VisualSegment {
  resourceId: string;

  constructor(resourceId: string, targetTimerange: Timerange, options: StickerSegmentOptions = {}) {
    super(
      TrackType.sticker,
      randomUUID().replaceAll("-", ""),
      null,
      targetTimerange,
      1.0,
      1.0,
      false,
      options.clipSettings
    );
    this.resourceId = resourceId;
  }

  exportMaterial(): Record<string, unknown> {
    return {
      id: this.materialId,
      resource_id: this.resourceId,
      sticker_id: this.resourceId,
      source_platform: 1,
      type: "sticker"
    };
  }
}

export class TextStyle {
  size: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: [number, number, number];
  align: number;
  vertical: boolean;
  letterSpacing: number;
  lineSpacing: number;
  alpha: number;
  autoWrapping: boolean;
  maxLineWidth: number;

  constructor(init: Partial<TextStyle> = {}) {
    this.size = init.size ?? 8.0;
    this.bold = init.bold ?? false;
    this.italic = init.italic ?? false;
    this.underline = init.underline ?? false;
    this.color = init.color ?? [1.0, 1.0, 1.0];
    this.align = init.align ?? 1;
    this.vertical = init.vertical ?? false;
    this.letterSpacing = init.letterSpacing ?? 0;
    this.lineSpacing = init.lineSpacing ?? 0;
    this.alpha = init.alpha ?? 1.0;
    this.autoWrapping = init.autoWrapping ?? false;
    this.maxLineWidth = init.maxLineWidth ?? 0.82;
  }
}

export interface TextBorderOptions {
  alpha?: number;
  color?: [number, number, number];
  width?: number;
}

export class TextBorder {
  alpha: number;
  color: [number, number, number];
  width: number;

  constructor(init: TextBorderOptions = {}) {
    this.alpha = init.alpha ?? 1.0;
    this.color = init.color ?? [0.0, 0.0, 0.0];
    this.width = init.width ?? 40.0;
  }

  exportJson(): Record<string, unknown> {
    return {
      content: {
        solid: {
          alpha: this.alpha,
          color: [...this.color]
        }
      },
      // Keep Python mapping for compatibility with pyJianYingDraft behavior.
      width: (this.width / 100.0) * 0.2
    };
  }
}

export interface TextBackgroundOptions {
  style?: 1 | 2;
  color?: string;
  alpha?: number;
  roundRadius?: number;
  height?: number;
  width?: number;
  horizontalOffset?: number;
  verticalOffset?: number;
}

export class TextBackground {
  style: 1 | 2;
  color: string;
  alpha: number;
  roundRadius: number;
  height: number;
  width: number;
  horizontalOffset: number;
  verticalOffset: number;

  constructor(init: TextBackgroundOptions = {}) {
    this.style = init.style ?? 1;
    this.color = init.color ?? "#000000";
    this.alpha = init.alpha ?? 1.0;
    this.roundRadius = init.roundRadius ?? 0.0;
    this.height = init.height ?? 0.14;
    this.width = init.width ?? 0.14;
    this.horizontalOffset = init.horizontalOffset ?? 0.5;
    this.verticalOffset = init.verticalOffset ?? 0.5;
  }

  exportJson(): Record<string, unknown> {
    return {
      background_style: this.style,
      background_color: this.color,
      background_alpha: this.alpha,
      background_round_radius: this.roundRadius,
      background_height: this.height,
      background_width: this.width,
      background_horizontal_offset: this.horizontalOffset * 2 - 1,
      background_vertical_offset: this.verticalOffset * 2 - 1
    };
  }
}

export class TextBubble {
  readonly globalId: string;
  effectId: string;
  resourceId: string;

  constructor(effectId: string, resourceId: string) {
    this.globalId = randomUUID().replaceAll("-", "");
    this.effectId = effectId;
    this.resourceId = resourceId;
  }

  exportJson(): Record<string, unknown> {
    return {
      apply_target_type: 0,
      effect_id: this.effectId,
      id: this.globalId,
      resource_id: this.resourceId,
      type: "text_shape",
      value: 1.0
    };
  }
}

export class TextEffect extends TextBubble {
  override exportJson(): Record<string, unknown> {
    const payload = super.exportJson();
    payload.type = "text_effect";
    payload.source_platform = 1;
    return payload;
  }
}

export interface TextShadowOptions {
  alpha?: number;
  color?: [number, number, number];
  diffuse?: number;
  distance?: number;
  angle?: number;
}

export class TextShadow {
  alpha: number;
  color: [number, number, number];
  diffuse: number;
  distance: number;
  angle: number;

  constructor(init: TextShadowOptions = {}) {
    this.alpha = init.alpha ?? 1.0;
    this.color = init.color ?? [0.0, 0.0, 0.0];
    this.diffuse = init.diffuse ?? 15.0;
    this.distance = init.distance ?? 5.0;
    this.angle = init.angle ?? -45.0;
  }

  exportJson(): Record<string, unknown> {
    return {
      diffuse: this.diffuse / 100.0 / 6.0,
      alpha: this.alpha,
      distance: this.distance,
      content: {
        solid: {
          color: [...this.color]
        }
      },
      angle: this.angle
    };
  }
}

export interface TextSegmentOptions {
  font?: FontMeta | null;
  style?: TextStyle;
  clipSettings?: ClipSettings;
  border?: TextBorder | null;
  background?: TextBackground | null;
  shadow?: TextShadow | null;
}

export interface FontMeta {
  name: string;
  resourceId: string;
  effectId?: string;
}

export class TextSegment extends VisualSegment {
  text: string;
  font: FontMeta | null;
  style: TextStyle;
  border: TextBorder | null;
  background: TextBackground | null;
  shadow: TextShadow | null;
  bubble: TextBubble | null;
  effect: TextEffect | null;

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
    this.font = options.font ? { ...options.font } : null;
    this.style = options.style ?? new TextStyle();
    this.border = options.border ?? null;
    this.background = options.background ?? null;
    this.shadow = options.shadow ?? null;
    this.bubble = null;
    this.effect = null;
  }

  static createFromTemplate(text: string, timerange: Timerange, template: TextSegment): TextSegment {
    const copied = new TextSegment(text, timerange, {
      font: template.font ? { ...template.font } : null,
      style: new TextStyle({ ...template.style }),
      clipSettings: new ClipSettings({ ...template.clipSettings }),
      border: template.border
        ? new TextBorder({
            alpha: template.border.alpha,
            color: [...template.border.color] as [number, number, number],
            width: template.border.width
          })
        : null,
      background: template.background
        ? new TextBackground({
            style: template.background.style,
            color: template.background.color,
            alpha: template.background.alpha,
            roundRadius: template.background.roundRadius,
            height: template.background.height,
            width: template.background.width,
            horizontalOffset: template.background.horizontalOffset,
            verticalOffset: template.background.verticalOffset
          })
        : null,
      shadow: template.shadow
        ? new TextShadow({
            alpha: template.shadow.alpha,
            color: [...template.shadow.color] as [number, number, number],
            diffuse: template.shadow.diffuse,
            distance: template.shadow.distance,
            angle: template.shadow.angle
          })
        : null
    });

    if (template.animationsInstance) {
      copied.animationsInstance = new SegmentAnimations();
      copied.extraMaterialRefs.push(copied.animationsInstance.animationId);

      for (const animation of template.animationsInstance.animations) {
        if (animation instanceof VideoAnimation) {
          copied.animationsInstance.addAnimation(
            new VideoAnimation(
              {
                title: animation.name,
                effectId: animation.effectId,
                resourceId: animation.resourceId,
                duration: animation.duration,
                animationType: animation.animationType as VideoAnimationType
              },
              animation.start,
              animation.duration
            )
          );
        } else {
          copied.animationsInstance.addAnimation(
            new TextAnimation(
              {
                title: animation.name,
                effectId: animation.effectId,
                resourceId: animation.resourceId,
                duration: animation.duration,
                animationType: animation.animationType as TextAnimationType
              },
              animation.start,
              animation.duration
            )
          );
        }
      }
    }

    if (template.bubble) {
      copied.addBubble(template.bubble.effectId, template.bubble.resourceId);
    }
    if (template.effect) {
      copied.addEffect(template.effect.effectId);
    }

    return copied;
  }

  /** @deprecated Use createFromTemplate instead. */
  static create_from_template(text: string, timerange: Timerange, template: TextSegment): TextSegment {
    return TextSegment.createFromTemplate(text, timerange, template);
  }

  setFont(fontMeta: FontMeta): this {
    this.font = { ...fontMeta };
    return this;
  }

  /** @deprecated Use setFont instead. */
  set_font(fontMeta: FontMeta): this {
    return this.setFont(fontMeta);
  }

  addAnimation(animationMeta: TextAnimationMeta | TextAnimationPresetInput, duration?: string | number): this {
    const resolved = resolveTextAnimationMeta(animationMeta);
    let finalDuration = duration === undefined ? resolved.duration : tim(duration);
    finalDuration = Math.min(finalDuration, this.targetTimerange.duration);
    let start = 0;

    if (resolved.animationType === "in") {
      start = 0;
    } else if (resolved.animationType === "out") {
      start = this.targetTimerange.duration - finalDuration;
    } else if (resolved.animationType === "loop") {
      const introTrange = this.animationsInstance?.getAnimationTrange("in");
      const outroTrange = this.animationsInstance?.getAnimationTrange("out");
      start = introTrange ? introTrange.start : 0;
      finalDuration = this.targetTimerange.duration - start - (outroTrange ? outroTrange.duration : 0);
    } else {
      throw new TypeError(`Invalid text animation type "${String(resolved.animationType)}"`);
    }

    if (this.animationsInstance === null) {
      this.animationsInstance = new SegmentAnimations();
      this.extraMaterialRefs.push(this.animationsInstance.animationId);
    }

    this.animationsInstance.addAnimation(new TextAnimation(resolved, start, finalDuration));
    return this;
  }

  /** @deprecated Use addAnimation instead. */
  add_animation(animationMeta: TextAnimationMeta | TextAnimationPresetInput, duration?: string | number): this {
    return this.addAnimation(animationMeta, duration);
  }

  addBubble(effectId: string, resourceId: string): this {
    this.bubble = new TextBubble(effectId, resourceId);
    this.extraMaterialRefs.push(this.bubble.globalId);
    return this;
  }

  /** @deprecated Use addBubble instead. */
  add_bubble(effectId: string, resourceId: string): this {
    return this.addBubble(effectId, resourceId);
  }

  addEffect(effectId: string): this {
    this.effect = new TextEffect(effectId, effectId);
    this.extraMaterialRefs.push(this.effect.globalId);
    return this;
  }

  /** @deprecated Use addEffect instead. */
  add_effect(effectId: string): this {
    return this.addEffect(effectId);
  }

  exportMaterial(): Record<string, unknown> {
    let checkFlag = 7;
    if (this.border) {
      checkFlag |= 8;
    }
    if (this.background) {
      checkFlag |= 16;
    }
    if (this.shadow) {
      checkFlag |= 32;
    }

    const styleRecord: Record<string, unknown> = {
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
      size: this.style.size,
      bold: this.style.bold,
      italic: this.style.italic,
      underline: this.style.underline,
      strokes: this.border ? [this.border.exportJson()] : []
    };
    if (this.shadow) {
      styleRecord.shadows = [this.shadow.exportJson()];
    }
    if (this.font) {
      styleRecord.font = {
        id: this.font.resourceId,
        // Match pyJianYingDraft behavior: path is a placeholder drive letter.
        path: "D:"
      };
    }
    if (this.effect) {
      styleRecord.effectStyle = {
        id: this.effect.effectId,
        // Match pyJianYingDraft behavior: path is a placeholder drive letter.
        path: "C:"
      };
    }

    const contentJson = {
      styles: [styleRecord],
      text: this.text
    };

    const material: Record<string, unknown> = {
      id: this.materialId,
      content: JSON.stringify(contentJson),
      typesetting: Number(this.style.vertical),
      alignment: this.style.align,
      letter_spacing: this.style.letterSpacing * 0.05,
      line_spacing: 0.02 + this.style.lineSpacing * 0.05,
      line_feed: 1,
      line_max_width: this.style.maxLineWidth,
      force_apply_line_max_width: false,
      check_flag: checkFlag,
      type: this.style.autoWrapping ? "subtitle" : "text",
      global_alpha: this.style.alpha
    };
    if (this.background) {
      Object.assign(material, this.background.exportJson());
    }

    return material;
  }
}

import type { EffectMeta, VideoEffectType } from "./segment.js";
import {
  GENERATED_FILTER_PRESETS,
  GENERATED_VIDEO_CHARACTER_EFFECT_PRESETS,
  GENERATED_VIDEO_SCENE_EFFECT_PRESETS
} from "./metadata.generated.js";
import {
  AUDIO_EFFECT_PRESETS,
  MASK_PRESETS,
  MIX_MODE_PRESETS,
  TEXT_ANIMATION_PRESETS,
  TRANSITION_PRESETS,
  VIDEO_ANIMATION_PRESETS,
  resolveAudioEffectMeta,
  resolveMaskMeta,
  resolveMixModeMeta,
  resolveTextAnimationMeta,
  resolveTransitionMeta,
  resolveVideoAnimationMeta
} from "./metadata-lite.js";

const VIDEO_SCENE_ALIASES = {
  n1998: "_1998",
  s70: "_70s",
  dvUi: "DV界面",
  jvc: "JVC",
  vcr: "VCR",
  betamax: "betamax",
  xSignal: "X_Signal",
  newYear: "New_Year"
} as const satisfies Record<string, keyof typeof GENERATED_VIDEO_SCENE_EFFECT_PRESETS>;

const VIDEO_CHARACTER_ALIASES = {
  boom: "BOOM",
  x: "X",
  crash: "crash",
  hit: "击中",
  split: "分身",
  halo1: "光环_I"
} as const satisfies Record<string, keyof typeof GENERATED_VIDEO_CHARACTER_EFFECT_PRESETS>;

const FILTER_ALIASES = {
  n1980: "_1980",
  abg: "ABG",
  ditto: "Ditto",
  ke1: "KE1",
  kv5d: "KV5D",
  lofi2: "Lofi_II",
  vhs3: "VHS_III",
  brightSummer: "亮夏"
} as const satisfies Record<string, keyof typeof GENERATED_FILTER_PRESETS>;

function withAliases<T extends Record<string, EffectMeta>, A extends Record<string, keyof T>>(
  source: T,
  aliases: A
): T & { [K in keyof A]: T[A[K]] } {
  const output: Record<string, EffectMeta> = { ...source };
  for (const [alias, originalKey] of Object.entries(aliases)) {
    output[alias] = source[originalKey as keyof T] as EffectMeta;
  }
  return output as T & { [K in keyof A]: T[A[K]] };
}

export const VIDEO_SCENE_EFFECT_PRESETS = withAliases(GENERATED_VIDEO_SCENE_EFFECT_PRESETS, VIDEO_SCENE_ALIASES);
export const VIDEO_CHARACTER_EFFECT_PRESETS = withAliases(
  GENERATED_VIDEO_CHARACTER_EFFECT_PRESETS,
  VIDEO_CHARACTER_ALIASES
);
export const FILTER_PRESETS = withAliases(GENERATED_FILTER_PRESETS, FILTER_ALIASES);

export type VideoSceneEffectPresetKey = keyof typeof VIDEO_SCENE_EFFECT_PRESETS;
export type VideoCharacterEffectPresetKey = keyof typeof VIDEO_CHARACTER_EFFECT_PRESETS;
export type VideoEffectPresetKey = VideoSceneEffectPresetKey | VideoCharacterEffectPresetKey;
export type FilterPresetKey = keyof typeof FILTER_PRESETS;
export type VideoEffectPresetInput = VideoEffectPresetKey | string;
export type FilterPresetInput = FilterPresetKey | string;

export interface ResolvedVideoEffectMeta {
  meta: EffectMeta;
  effectType: VideoEffectType;
}

function hasOwn<T extends object>(value: T, key: string): key is Extract<keyof T, string> {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[\s_-]+/g, "");
}

const videoEffectNameIndex = new Map<string, ResolvedVideoEffectMeta>();
for (const [key, meta] of Object.entries(VIDEO_SCENE_EFFECT_PRESETS)) {
  const resolved: ResolvedVideoEffectMeta = { meta, effectType: "video_effect" };
  videoEffectNameIndex.set(normalizeName(key), resolved);
  videoEffectNameIndex.set(normalizeName(meta.name), resolved);
}
for (const [key, meta] of Object.entries(VIDEO_CHARACTER_EFFECT_PRESETS)) {
  const resolved: ResolvedVideoEffectMeta = { meta, effectType: "face_effect" };
  videoEffectNameIndex.set(normalizeName(key), resolved);
  videoEffectNameIndex.set(normalizeName(meta.name), resolved);
}

const filterNameIndex = new Map<string, EffectMeta>();
for (const [key, meta] of Object.entries(FILTER_PRESETS)) {
  filterNameIndex.set(normalizeName(key), meta);
  filterNameIndex.set(normalizeName(meta.name), meta);
}

export function resolveVideoEffectMeta(effectMeta: EffectMeta | VideoEffectPresetInput): ResolvedVideoEffectMeta {
  if (typeof effectMeta !== "string") {
    return { meta: effectMeta, effectType: "video_effect" };
  }

  if (hasOwn(VIDEO_SCENE_EFFECT_PRESETS, effectMeta)) {
    return {
      meta: VIDEO_SCENE_EFFECT_PRESETS[effectMeta],
      effectType: "video_effect"
    };
  }
  if (hasOwn(VIDEO_CHARACTER_EFFECT_PRESETS, effectMeta)) {
    return {
      meta: VIDEO_CHARACTER_EFFECT_PRESETS[effectMeta],
      effectType: "face_effect"
    };
  }

  const fromName = videoEffectNameIndex.get(normalizeName(effectMeta));
  if (fromName) {
    return fromName;
  }
  throw new Error(`Unknown video effect preset "${effectMeta}"`);
}

export function resolveFilterMeta(filterMeta: EffectMeta | FilterPresetInput): EffectMeta {
  if (typeof filterMeta !== "string") {
    return filterMeta;
  }

  if (hasOwn(FILTER_PRESETS, filterMeta)) {
    return FILTER_PRESETS[filterMeta];
  }

  const fromName = filterNameIndex.get(normalizeName(filterMeta));
  if (fromName) {
    return fromName;
  }
  throw new Error(`Unknown filter preset "${filterMeta}"`);
}

export {
  AUDIO_EFFECT_PRESETS,
  MASK_PRESETS,
  MIX_MODE_PRESETS,
  TEXT_ANIMATION_PRESETS,
  TRANSITION_PRESETS,
  VIDEO_ANIMATION_PRESETS,
  resolveAudioEffectMeta,
  resolveMaskMeta,
  resolveMixModeMeta,
  resolveTextAnimationMeta,
  resolveTransitionMeta,
  resolveVideoAnimationMeta
};

export type {
  AudioEffectPresetInput,
  MaskPresetInput,
  MixModePresetInput,
  TextAnimationPresetInput,
  TransitionPresetInput,
  VideoAnimationPresetInput
} from "./metadata-lite.js";

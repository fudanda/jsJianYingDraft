import type { EffectMeta, FontMeta, VideoEffectType } from "./segment.js";
import {
  GENERATED_FONT_PRESETS,
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

function pickByProp<
  T extends Record<string, object>,
  P extends string,
  V extends string | number | boolean
>(source: T, prop: P, value: V): T {
  const output: Record<string, object> = {};
  for (const [key, meta] of Object.entries(source) as Array<[keyof T & string, T[keyof T]]>) {
    if ((meta as Record<string, unknown>)[prop] === value) {
      output[key] = meta;
    }
  }
  return output as T;
}

export const VIDEO_SCENE_EFFECT_PRESETS = withAliases(GENERATED_VIDEO_SCENE_EFFECT_PRESETS, VIDEO_SCENE_ALIASES);
export const VIDEO_CHARACTER_EFFECT_PRESETS = withAliases(
  GENERATED_VIDEO_CHARACTER_EFFECT_PRESETS,
  VIDEO_CHARACTER_ALIASES
);
export const FILTER_PRESETS = withAliases(GENERATED_FILTER_PRESETS, FILTER_ALIASES);
export const FONT_PRESETS = GENERATED_FONT_PRESETS;

// Python metadata enum-style exports for migration friendliness.
export const VideoSceneEffectType = VIDEO_SCENE_EFFECT_PRESETS;
export const VideoCharacterEffectType = VIDEO_CHARACTER_EFFECT_PRESETS;
export const FilterType = FILTER_PRESETS;
export const AudioSceneEffectType = pickByProp(AUDIO_EFFECT_PRESETS, "categoryId", "sound_effect");
export const ToneEffectType = pickByProp(AUDIO_EFFECT_PRESETS, "categoryId", "tone");
export const SpeechToSongType = pickByProp(AUDIO_EFFECT_PRESETS, "categoryId", "speech_to_song");
export const IntroType = pickByProp(VIDEO_ANIMATION_PRESETS, "animationType", "in");
export const OutroType = pickByProp(VIDEO_ANIMATION_PRESETS, "animationType", "out");
export const GroupAnimationType = pickByProp(VIDEO_ANIMATION_PRESETS, "animationType", "group");
export const TextIntro = pickByProp(TEXT_ANIMATION_PRESETS, "animationType", "in");
export const TextOutro = pickByProp(TEXT_ANIMATION_PRESETS, "animationType", "out");
export const TextLoopAnim = pickByProp(TEXT_ANIMATION_PRESETS, "animationType", "loop");
export const TransitionType = TRANSITION_PRESETS;
export const MaskType = MASK_PRESETS;
export const MixModeType = MIX_MODE_PRESETS;
export const FontType = FONT_PRESETS;

// Deprecated snake_case compatibility aliases.
/** @deprecated Use VideoSceneEffectType instead. */
export const Video_scene_effect_type = VideoSceneEffectType;
/** @deprecated Use VideoCharacterEffectType instead. */
export const Video_character_effect_type = VideoCharacterEffectType;
/** @deprecated Use FilterType instead. */
export const Filter_type = FilterType;
/** @deprecated Use AudioSceneEffectType instead. */
export const Audio_scene_effect_type = AudioSceneEffectType;
/** @deprecated Use ToneEffectType instead. */
export const Tone_effect_type = ToneEffectType;
/** @deprecated Use SpeechToSongType instead. */
export const Speech_to_song_type = SpeechToSongType;
/** @deprecated Use IntroType instead. */
export const Intro_type = IntroType;
/** @deprecated Use OutroType instead. */
export const Outro_type = OutroType;
/** @deprecated Use GroupAnimationType instead. */
export const Group_animation_type = GroupAnimationType;
/** @deprecated Use TextIntro instead. */
export const Text_intro = TextIntro;
/** @deprecated Use TextOutro instead. */
export const Text_outro = TextOutro;
/** @deprecated Use TextLoopAnim instead. */
export const Text_loop_anim = TextLoopAnim;
/** @deprecated Use TransitionType instead. */
export const Transition_type = TransitionType;
/** @deprecated Use MaskType instead. */
export const Mask_type = MaskType;
/** @deprecated Use MixModeType instead. */
export const Mix_mode_type = MixModeType;
/** @deprecated Use FontType instead. */
export const Font_type = FontType;

export type VideoSceneEffectPresetKey = keyof typeof VIDEO_SCENE_EFFECT_PRESETS;
export type VideoCharacterEffectPresetKey = keyof typeof VIDEO_CHARACTER_EFFECT_PRESETS;
export type VideoEffectPresetKey = VideoSceneEffectPresetKey | VideoCharacterEffectPresetKey;
export type FilterPresetKey = keyof typeof FILTER_PRESETS;
export type FontPresetKey = keyof typeof FONT_PRESETS;
export type VideoEffectPresetInput = VideoEffectPresetKey | string;
export type FilterPresetInput = FilterPresetKey | string;
export type FontPresetInput = FontPresetKey | string;

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

const fontNameIndex = new Map<string, FontMeta>();
for (const [key, meta] of Object.entries(FONT_PRESETS)) {
  fontNameIndex.set(normalizeName(key), meta);
  fontNameIndex.set(normalizeName(meta.name), meta);
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

export function resolveFontMeta(fontMeta: FontMeta | FontPresetInput): FontMeta {
  if (typeof fontMeta !== "string") {
    return fontMeta;
  }

  if (hasOwn(FONT_PRESETS, fontMeta)) {
    return FONT_PRESETS[fontMeta];
  }

  const fromName = fontNameIndex.get(normalizeName(fontMeta));
  if (fromName) {
    return fromName;
  }
  throw new Error(`Unknown font preset "${fontMeta}"`);
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

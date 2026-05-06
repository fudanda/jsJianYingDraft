import type { EffectMeta, FontMeta } from "./segment.js";
import { GENERATED_FONT_PRESETS } from "./metadata.generated.js";
import {
  AUDIO_EFFECT_PRESETS,
  AUDIO_SCENE_EFFECT_PRESETS,
  FILTER_PRESETS,
  MASK_PRESETS,
  MIX_MODE_PRESETS,
  SPEECH_TO_SONG_PRESETS,
  TEXT_ANIMATION_PRESETS,
  TEXT_INTRO_PRESETS,
  TEXT_LOOP_ANIMATION_PRESETS,
  TEXT_OUTRO_PRESETS,
  TONE_EFFECT_PRESETS,
  TRANSITION_PRESETS,
  VIDEO_ANIMATION_PRESETS,
  VIDEO_CHARACTER_EFFECT_PRESETS,
  VIDEO_GROUP_ANIMATION_PRESETS,
  VIDEO_INTRO_PRESETS,
  VIDEO_OUTRO_PRESETS,
  VIDEO_SCENE_EFFECT_PRESETS,
  resolveAudioEffectMeta,
  resolveFilterMeta,
  resolveMaskMeta,
  resolveMixModeMeta,
  resolveTextAnimationMeta,
  resolveTransitionMeta,
  resolveVideoAnimationMeta,
  resolveVideoEffectMeta
} from "./metadata-lite.js";

type EnumLookupMethods<TValue> = {
  fromName(name: string): TValue;
  from_name(name: string): TValue;
};

function normalizeEnumMemberName(name: string): string {
  return name.toLowerCase().replace(/[\s_]+/g, "");
}

function withFromNameMethods<T extends Record<string, unknown>>(
  source: T
): T & EnumLookupMethods<T[keyof T]> {
  const output = { ...source } as T & EnumLookupMethods<T[keyof T]>;
  const index = new Map<string, T[keyof T]>();
  for (const [key, value] of Object.entries(source) as Array<[string, T[keyof T]]>) {
    index.set(normalizeEnumMemberName(key), value);
  }

  const lookup = (name: string): T[keyof T] => {
    const found = index.get(normalizeEnumMemberName(name));
    if (found !== undefined) {
      return found;
    }
    throw new Error(`Effect named '${name}' not found`);
  };

  Object.defineProperty(output, "fromName", { value: lookup, enumerable: false });
  Object.defineProperty(output, "from_name", { value: lookup, enumerable: false });
  return output;
}

export const FONT_PRESETS = GENERATED_FONT_PRESETS;

// Python metadata enum-style exports for migration friendliness.
export const VideoSceneEffectType = withFromNameMethods(VIDEO_SCENE_EFFECT_PRESETS);
export const VideoCharacterEffectType = withFromNameMethods(VIDEO_CHARACTER_EFFECT_PRESETS);
export const FilterType = withFromNameMethods(FILTER_PRESETS);
export const AudioSceneEffectType = withFromNameMethods(AUDIO_SCENE_EFFECT_PRESETS);
export const ToneEffectType = withFromNameMethods(TONE_EFFECT_PRESETS);
export const SpeechToSongType = withFromNameMethods(SPEECH_TO_SONG_PRESETS);
export const IntroType = withFromNameMethods(VIDEO_INTRO_PRESETS);
export const OutroType = withFromNameMethods(VIDEO_OUTRO_PRESETS);
export const GroupAnimationType = withFromNameMethods(VIDEO_GROUP_ANIMATION_PRESETS);
export const TextIntro = withFromNameMethods(TEXT_INTRO_PRESETS);
export const TextOutro = withFromNameMethods(TEXT_OUTRO_PRESETS);
export const TextLoopAnim = withFromNameMethods(TEXT_LOOP_ANIMATION_PRESETS);
export const TransitionType = withFromNameMethods(TRANSITION_PRESETS);
export const MaskType = withFromNameMethods(MASK_PRESETS);
export const MixModeType = withFromNameMethods(MIX_MODE_PRESETS);
export const FontType = withFromNameMethods(FONT_PRESETS);

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

function hasOwn<T extends object>(value: T, key: string): key is Extract<keyof T, string> {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[\s_-]+/g, "");
}

const fontNameIndex = new Map<string, FontMeta>();
for (const [key, meta] of Object.entries(FONT_PRESETS)) {
  fontNameIndex.set(normalizeName(key), meta);
  fontNameIndex.set(normalizeName(meta.name), meta);
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
  AUDIO_SCENE_EFFECT_PRESETS,
  FILTER_PRESETS,
  MASK_PRESETS,
  MIX_MODE_PRESETS,
  SPEECH_TO_SONG_PRESETS,
  TEXT_ANIMATION_PRESETS,
  TEXT_INTRO_PRESETS,
  TEXT_LOOP_ANIMATION_PRESETS,
  TEXT_OUTRO_PRESETS,
  TONE_EFFECT_PRESETS,
  TRANSITION_PRESETS,
  VIDEO_ANIMATION_PRESETS,
  VIDEO_CHARACTER_EFFECT_PRESETS,
  VIDEO_GROUP_ANIMATION_PRESETS,
  VIDEO_INTRO_PRESETS,
  VIDEO_OUTRO_PRESETS,
  VIDEO_SCENE_EFFECT_PRESETS,
  resolveAudioEffectMeta,
  resolveFilterMeta,
  resolveMaskMeta,
  resolveMixModeMeta,
  resolveTextAnimationMeta,
  resolveTransitionMeta,
  resolveVideoAnimationMeta,
  resolveVideoEffectMeta
};

export type {
  AudioEffectPresetInput,
  MaskPresetInput,
  MixModePresetInput,
  ResolvedVideoEffectMeta,
  TextAnimationPresetInput,
  TransitionPresetInput,
  VideoAnimationPresetInput
} from "./metadata-lite.js";

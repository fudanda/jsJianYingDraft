import type {
  AnimationMeta,
  AudioEffectMeta,
  EffectMeta,
  MaskMeta,
  TextAnimationMeta,
  TransitionMeta,
  VideoAnimationMeta,
  VideoEffectType
} from "./segment.js";
import {
  GENERATED_AUDIO_SCENE_EFFECT_PRESETS,
  GENERATED_FILTER_PRESETS,
  GENERATED_MASK_PRESETS,
  GENERATED_MIX_MODE_PRESETS,
  GENERATED_SPEECH_TO_SONG_PRESETS,
  GENERATED_TEXT_INTRO_PRESETS,
  GENERATED_TEXT_LOOP_ANIMATION_PRESETS,
  GENERATED_TEXT_OUTRO_PRESETS,
  GENERATED_TONE_EFFECT_PRESETS,
  GENERATED_TRANSITION_PRESETS,
  GENERATED_VIDEO_CHARACTER_EFFECT_PRESETS,
  GENERATED_VIDEO_GROUP_ANIMATION_PRESETS,
  GENERATED_VIDEO_INTRO_PRESETS,
  GENERATED_VIDEO_OUTRO_PRESETS,
  GENERATED_VIDEO_SCENE_EFFECT_PRESETS
} from "./metadata.generated.js";

function withAudioCategory<T extends Record<string, EffectMeta>, C extends AudioEffectMeta["categoryId"]>(
  source: T,
  categoryId: C
): { [K in keyof T]: AudioEffectMeta } {
  const output = {} as { [K in keyof T]: AudioEffectMeta };
  for (const [key, meta] of Object.entries(source) as Array<[keyof T & string, T[keyof T]]>) {
    output[key] = { ...meta, categoryId };
  }
  return output;
}

function withVideoAnimationType<T extends Record<string, AnimationMeta>, C extends VideoAnimationMeta["animationType"]>(
  source: T,
  animationType: C
): { [K in keyof T]: VideoAnimationMeta } {
  const output = {} as { [K in keyof T]: VideoAnimationMeta };
  for (const [key, meta] of Object.entries(source) as Array<[keyof T & string, T[keyof T]]>) {
    output[key] = { ...meta, animationType };
  }
  return output;
}

function withTextAnimationType<T extends Record<string, AnimationMeta>, C extends TextAnimationMeta["animationType"]>(
  source: T,
  animationType: C
): { [K in keyof T]: TextAnimationMeta } {
  const output = {} as { [K in keyof T]: TextAnimationMeta };
  for (const [key, meta] of Object.entries(source) as Array<[keyof T & string, T[keyof T]]>) {
    output[key] = { ...meta, animationType };
  }
  return output;
}

export const VIDEO_SCENE_EFFECT_PRESETS = GENERATED_VIDEO_SCENE_EFFECT_PRESETS;
export const VIDEO_CHARACTER_EFFECT_PRESETS = GENERATED_VIDEO_CHARACTER_EFFECT_PRESETS;
export const FILTER_PRESETS = GENERATED_FILTER_PRESETS;

export const AUDIO_SCENE_EFFECT_PRESETS = withAudioCategory(GENERATED_AUDIO_SCENE_EFFECT_PRESETS, "sound_effect");
export const TONE_EFFECT_PRESETS = withAudioCategory(GENERATED_TONE_EFFECT_PRESETS, "tone");
export const SPEECH_TO_SONG_PRESETS = withAudioCategory(GENERATED_SPEECH_TO_SONG_PRESETS, "speech_to_song");
export const AUDIO_EFFECT_PRESETS = {
  ...AUDIO_SCENE_EFFECT_PRESETS,
  ...TONE_EFFECT_PRESETS,
  ...SPEECH_TO_SONG_PRESETS
};

export const VIDEO_INTRO_PRESETS = withVideoAnimationType(GENERATED_VIDEO_INTRO_PRESETS, "in");
export const VIDEO_OUTRO_PRESETS = withVideoAnimationType(GENERATED_VIDEO_OUTRO_PRESETS, "out");
export const VIDEO_GROUP_ANIMATION_PRESETS = withVideoAnimationType(GENERATED_VIDEO_GROUP_ANIMATION_PRESETS, "group");
export const VIDEO_ANIMATION_PRESETS = {
  in: VIDEO_INTRO_PRESETS,
  out: VIDEO_OUTRO_PRESETS,
  group: VIDEO_GROUP_ANIMATION_PRESETS
} as const;

export const TEXT_INTRO_PRESETS = withTextAnimationType(GENERATED_TEXT_INTRO_PRESETS, "in");
export const TEXT_OUTRO_PRESETS = withTextAnimationType(GENERATED_TEXT_OUTRO_PRESETS, "out");
export const TEXT_LOOP_ANIMATION_PRESETS = withTextAnimationType(GENERATED_TEXT_LOOP_ANIMATION_PRESETS, "loop");
export const TEXT_ANIMATION_PRESETS = {
  in: TEXT_INTRO_PRESETS,
  out: TEXT_OUTRO_PRESETS,
  loop: TEXT_LOOP_ANIMATION_PRESETS
} as const;

export const TRANSITION_PRESETS = GENERATED_TRANSITION_PRESETS;
export const MASK_PRESETS = GENERATED_MASK_PRESETS;
export const MIX_MODE_PRESETS = GENERATED_MIX_MODE_PRESETS;

export type CommonVideoSceneEffectPresetKey = keyof typeof VIDEO_SCENE_EFFECT_PRESETS;
export type CommonVideoCharacterEffectPresetKey = keyof typeof VIDEO_CHARACTER_EFFECT_PRESETS;
export type CommonVideoEffectPresetKey = CommonVideoSceneEffectPresetKey | CommonVideoCharacterEffectPresetKey;
export type CommonFilterPresetKey = keyof typeof FILTER_PRESETS;
export type CommonAudioSceneEffectPresetKey = keyof typeof AUDIO_SCENE_EFFECT_PRESETS;
export type CommonToneEffectPresetKey = keyof typeof TONE_EFFECT_PRESETS;
export type CommonSpeechToSongPresetKey = keyof typeof SPEECH_TO_SONG_PRESETS;
export type CommonAudioEffectPresetKey =
  | CommonAudioSceneEffectPresetKey
  | CommonToneEffectPresetKey
  | CommonSpeechToSongPresetKey;
export type CommonVideoIntroPresetKey = keyof typeof VIDEO_INTRO_PRESETS;
export type CommonVideoOutroPresetKey = keyof typeof VIDEO_OUTRO_PRESETS;
export type CommonVideoGroupAnimationPresetKey = keyof typeof VIDEO_GROUP_ANIMATION_PRESETS;
export type CommonVideoAnimationPresetKey =
  | CommonVideoIntroPresetKey
  | CommonVideoOutroPresetKey
  | CommonVideoGroupAnimationPresetKey;
export type CommonTextIntroPresetKey = keyof typeof TEXT_INTRO_PRESETS;
export type CommonTextOutroPresetKey = keyof typeof TEXT_OUTRO_PRESETS;
export type CommonTextLoopAnimationPresetKey = keyof typeof TEXT_LOOP_ANIMATION_PRESETS;
export type CommonTextAnimationPresetKey =
  | CommonTextIntroPresetKey
  | CommonTextOutroPresetKey
  | CommonTextLoopAnimationPresetKey;
export type CommonTransitionPresetKey = keyof typeof TRANSITION_PRESETS;
export type CommonMaskPresetKey = keyof typeof MASK_PRESETS;
export type CommonMixModePresetKey = keyof typeof MIX_MODE_PRESETS;

export type VideoEffectPresetInput = CommonVideoEffectPresetKey | string;
export type FilterPresetInput = CommonFilterPresetKey | string;
export type AudioEffectPresetInput = CommonAudioEffectPresetKey | string;
export type VideoAnimationPresetInput = CommonVideoAnimationPresetKey | string;
export type TextAnimationPresetInput = CommonTextAnimationPresetKey | string;
export type TransitionPresetInput = CommonTransitionPresetKey | string;
export type MaskPresetInput = CommonMaskPresetKey | string;
export type MixModePresetInput = CommonMixModePresetKey | string;

export interface ResolvedVideoEffectMeta {
  meta: EffectMeta;
  effectType: VideoEffectType;
}

interface ResolverCandidate<T> {
  source: string;
  key: string;
  identity: string;
  value: T;
}

function hasOwn<T extends object>(value: T, key: string): key is Extract<keyof T, string> {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[\s_-]+/g, "");
}

function indexCandidate<T>(
  index: Map<string, Array<ResolverCandidate<T>>>,
  token: string,
  candidate: ResolverCandidate<T>
): void {
  const normalized = normalizeName(token);
  if (!normalized) {
    return;
  }
  const found = index.get(normalized);
  if (found) {
    found.push(candidate);
    return;
  }
  index.set(normalized, [candidate]);
}

function uniqueCandidates<T>(candidates: ReadonlyArray<ResolverCandidate<T>>): Array<ResolverCandidate<T>> {
  const unique = new Map<string, ResolverCandidate<T>>();
  for (const candidate of candidates) {
    if (!unique.has(candidate.identity)) {
      unique.set(candidate.identity, candidate);
    }
  }
  return [...unique.values()];
}

function describeCandidates<T>(candidates: ReadonlyArray<ResolverCandidate<T>>): string {
  return candidates
    .slice(0, 8)
    .map((item) => `${item.source}.${item.key}`)
    .join(", ");
}

function resolveFromExactAndIndex<T>(
  input: string,
  exactCandidates: ReadonlyArray<ResolverCandidate<T>>,
  normalizedIndex: Map<string, Array<ResolverCandidate<T>>>,
  kindLabel: string,
  unknownMessage: string
): T {
  const uniqueExact = uniqueCandidates(exactCandidates);
  const exactResolved = uniqueExact[0];
  if (uniqueExact.length === 1 && exactResolved) {
    return exactResolved.value;
  }
  if (uniqueExact.length > 1) {
    throw new Error(
      `Ambiguous ${kindLabel} preset "${input}" matched multiple entries: ${describeCandidates(uniqueExact)}`
    );
  }

  const uniqueFromName = uniqueCandidates(normalizedIndex.get(normalizeName(input)) ?? []);
  const normalizedResolved = uniqueFromName[0];
  if (uniqueFromName.length === 1 && normalizedResolved) {
    return normalizedResolved.value;
  }
  if (uniqueFromName.length > 1) {
    throw new Error(
      `Ambiguous ${kindLabel} preset "${input}" matched multiple entries: ${describeCandidates(uniqueFromName)}`
    );
  }
  throw new Error(unknownMessage);
}

const videoEffectNameIndex = new Map<string, Array<ResolverCandidate<ResolvedVideoEffectMeta>>>();
for (const [key, meta] of Object.entries(VIDEO_SCENE_EFFECT_PRESETS)) {
  const candidate: ResolverCandidate<ResolvedVideoEffectMeta> = {
    source: "VideoSceneEffectType",
    key,
    identity: `video_effect:${key}`,
    value: { meta, effectType: "video_effect" }
  };
  indexCandidate(videoEffectNameIndex, key, candidate);
  indexCandidate(videoEffectNameIndex, meta.name, candidate);
}
for (const [key, meta] of Object.entries(VIDEO_CHARACTER_EFFECT_PRESETS)) {
  const candidate: ResolverCandidate<ResolvedVideoEffectMeta> = {
    source: "VideoCharacterEffectType",
    key,
    identity: `face_effect:${key}`,
    value: { meta, effectType: "face_effect" }
  };
  indexCandidate(videoEffectNameIndex, key, candidate);
  indexCandidate(videoEffectNameIndex, meta.name, candidate);
}

const filterNameIndex = new Map<string, Array<ResolverCandidate<EffectMeta>>>();
for (const [key, meta] of Object.entries(FILTER_PRESETS)) {
  const candidate: ResolverCandidate<EffectMeta> = {
    source: "FilterType",
    key,
    identity: key,
    value: meta
  };
  indexCandidate(filterNameIndex, key, candidate);
  indexCandidate(filterNameIndex, meta.name, candidate);
}

const audioEffectNameIndex = new Map<string, Array<ResolverCandidate<AudioEffectMeta>>>();
for (const [key, meta] of Object.entries(AUDIO_SCENE_EFFECT_PRESETS)) {
  const candidate: ResolverCandidate<AudioEffectMeta> = {
    source: "AudioSceneEffectType",
    key,
    identity: `sound_effect:${key}`,
    value: meta
  };
  indexCandidate(audioEffectNameIndex, key, candidate);
  indexCandidate(audioEffectNameIndex, meta.name, candidate);
}
for (const [key, meta] of Object.entries(TONE_EFFECT_PRESETS)) {
  const candidate: ResolverCandidate<AudioEffectMeta> = {
    source: "ToneEffectType",
    key,
    identity: `tone:${key}`,
    value: meta
  };
  indexCandidate(audioEffectNameIndex, key, candidate);
  indexCandidate(audioEffectNameIndex, meta.name, candidate);
}
for (const [key, meta] of Object.entries(SPEECH_TO_SONG_PRESETS)) {
  const candidate: ResolverCandidate<AudioEffectMeta> = {
    source: "SpeechToSongType",
    key,
    identity: `speech_to_song:${key}`,
    value: meta
  };
  indexCandidate(audioEffectNameIndex, key, candidate);
  indexCandidate(audioEffectNameIndex, meta.name, candidate);
}

const videoAnimationNameIndex = new Map<string, Array<ResolverCandidate<VideoAnimationMeta>>>();
for (const [key, meta] of Object.entries(VIDEO_INTRO_PRESETS)) {
  const candidate: ResolverCandidate<VideoAnimationMeta> = {
    source: "IntroType",
    key,
    identity: `in:${key}`,
    value: meta
  };
  indexCandidate(videoAnimationNameIndex, key, candidate);
  indexCandidate(videoAnimationNameIndex, meta.title, candidate);
}
for (const [key, meta] of Object.entries(VIDEO_OUTRO_PRESETS)) {
  const candidate: ResolverCandidate<VideoAnimationMeta> = {
    source: "OutroType",
    key,
    identity: `out:${key}`,
    value: meta
  };
  indexCandidate(videoAnimationNameIndex, key, candidate);
  indexCandidate(videoAnimationNameIndex, meta.title, candidate);
}
for (const [key, meta] of Object.entries(VIDEO_GROUP_ANIMATION_PRESETS)) {
  const candidate: ResolverCandidate<VideoAnimationMeta> = {
    source: "GroupAnimationType",
    key,
    identity: `group:${key}`,
    value: meta
  };
  indexCandidate(videoAnimationNameIndex, key, candidate);
  indexCandidate(videoAnimationNameIndex, meta.title, candidate);
}

const textAnimationNameIndex = new Map<string, Array<ResolverCandidate<TextAnimationMeta>>>();
for (const [key, meta] of Object.entries(TEXT_INTRO_PRESETS)) {
  const candidate: ResolverCandidate<TextAnimationMeta> = {
    source: "TextIntro",
    key,
    identity: `in:${key}`,
    value: meta
  };
  indexCandidate(textAnimationNameIndex, key, candidate);
  indexCandidate(textAnimationNameIndex, meta.title, candidate);
}
for (const [key, meta] of Object.entries(TEXT_OUTRO_PRESETS)) {
  const candidate: ResolverCandidate<TextAnimationMeta> = {
    source: "TextOutro",
    key,
    identity: `out:${key}`,
    value: meta
  };
  indexCandidate(textAnimationNameIndex, key, candidate);
  indexCandidate(textAnimationNameIndex, meta.title, candidate);
}
for (const [key, meta] of Object.entries(TEXT_LOOP_ANIMATION_PRESETS)) {
  const candidate: ResolverCandidate<TextAnimationMeta> = {
    source: "TextLoopAnim",
    key,
    identity: `loop:${key}`,
    value: meta
  };
  indexCandidate(textAnimationNameIndex, key, candidate);
  indexCandidate(textAnimationNameIndex, meta.title, candidate);
}

const transitionNameIndex = new Map<string, Array<ResolverCandidate<TransitionMeta>>>();
for (const [key, meta] of Object.entries(TRANSITION_PRESETS)) {
  const candidate: ResolverCandidate<TransitionMeta> = {
    source: "TransitionType",
    key,
    identity: key,
    value: meta
  };
  indexCandidate(transitionNameIndex, key, candidate);
  indexCandidate(transitionNameIndex, meta.name, candidate);
}

const maskNameIndex = new Map<string, Array<ResolverCandidate<MaskMeta>>>();
for (const [key, meta] of Object.entries(MASK_PRESETS)) {
  const candidate: ResolverCandidate<MaskMeta> = {
    source: "MaskType",
    key,
    identity: key,
    value: meta
  };
  indexCandidate(maskNameIndex, key, candidate);
  indexCandidate(maskNameIndex, meta.name, candidate);
}

const mixModeNameIndex = new Map<string, Array<ResolverCandidate<EffectMeta>>>();
for (const [key, meta] of Object.entries(MIX_MODE_PRESETS)) {
  const candidate: ResolverCandidate<EffectMeta> = {
    source: "MixModeType",
    key,
    identity: key,
    value: meta
  };
  indexCandidate(mixModeNameIndex, key, candidate);
  indexCandidate(mixModeNameIndex, meta.name, candidate);
}

export function resolveVideoEffectMeta(effectMeta: EffectMeta | VideoEffectPresetInput): ResolvedVideoEffectMeta {
  if (typeof effectMeta !== "string") {
    return { meta: effectMeta, effectType: "video_effect" };
  }

  const exactCandidates: Array<ResolverCandidate<ResolvedVideoEffectMeta>> = [];
  if (hasOwn(VIDEO_SCENE_EFFECT_PRESETS, effectMeta)) {
    exactCandidates.push({
      source: "VideoSceneEffectType",
      key: effectMeta,
      identity: `video_effect:${effectMeta}`,
      value: { meta: VIDEO_SCENE_EFFECT_PRESETS[effectMeta], effectType: "video_effect" }
    });
  }
  if (hasOwn(VIDEO_CHARACTER_EFFECT_PRESETS, effectMeta)) {
    exactCandidates.push({
      source: "VideoCharacterEffectType",
      key: effectMeta,
      identity: `face_effect:${effectMeta}`,
      value: { meta: VIDEO_CHARACTER_EFFECT_PRESETS[effectMeta], effectType: "face_effect" }
    });
  }

  return resolveFromExactAndIndex(
    effectMeta,
    exactCandidates,
    videoEffectNameIndex,
    "video effect",
    `Unknown video effect preset "${effectMeta}"`
  );
}

export function resolveFilterMeta(filterMeta: EffectMeta | FilterPresetInput): EffectMeta {
  if (typeof filterMeta !== "string") {
    return filterMeta;
  }

  const exactCandidates: Array<ResolverCandidate<EffectMeta>> = [];
  if (hasOwn(FILTER_PRESETS, filterMeta)) {
    exactCandidates.push({
      source: "FilterType",
      key: filterMeta,
      identity: filterMeta,
      value: FILTER_PRESETS[filterMeta]
    });
  }

  return resolveFromExactAndIndex(
    filterMeta,
    exactCandidates,
    filterNameIndex,
    "filter",
    `Unknown filter preset "${filterMeta}". Import from "jsjianyingdraft/metadata" for full preset catalog.`
  );
}

export function resolveAudioEffectMeta(effectMeta: AudioEffectMeta | AudioEffectPresetInput): AudioEffectMeta {
  if (typeof effectMeta !== "string") {
    return effectMeta;
  }

  const exactCandidates: Array<ResolverCandidate<AudioEffectMeta>> = [];
  if (hasOwn(AUDIO_SCENE_EFFECT_PRESETS, effectMeta)) {
    exactCandidates.push({
      source: "AudioSceneEffectType",
      key: effectMeta,
      identity: `sound_effect:${effectMeta}`,
      value: AUDIO_SCENE_EFFECT_PRESETS[effectMeta]
    });
  }
  if (hasOwn(TONE_EFFECT_PRESETS, effectMeta)) {
    exactCandidates.push({
      source: "ToneEffectType",
      key: effectMeta,
      identity: `tone:${effectMeta}`,
      value: TONE_EFFECT_PRESETS[effectMeta]
    });
  }
  if (hasOwn(SPEECH_TO_SONG_PRESETS, effectMeta)) {
    exactCandidates.push({
      source: "SpeechToSongType",
      key: effectMeta,
      identity: `speech_to_song:${effectMeta}`,
      value: SPEECH_TO_SONG_PRESETS[effectMeta]
    });
  }

  return resolveFromExactAndIndex(
    effectMeta,
    exactCandidates,
    audioEffectNameIndex,
    "audio effect",
    `Unknown audio effect preset "${effectMeta}". Import from "jsjianyingdraft/metadata" for full preset catalog.`
  );
}

export function resolveVideoAnimationMeta(
  animationMeta: VideoAnimationMeta | VideoAnimationPresetInput
): VideoAnimationMeta {
  if (typeof animationMeta !== "string") {
    return animationMeta;
  }

  const exactCandidates: Array<ResolverCandidate<VideoAnimationMeta>> = [];
  if (hasOwn(VIDEO_INTRO_PRESETS, animationMeta)) {
    exactCandidates.push({
      source: "IntroType",
      key: animationMeta,
      identity: `in:${animationMeta}`,
      value: VIDEO_INTRO_PRESETS[animationMeta]
    });
  }
  if (hasOwn(VIDEO_OUTRO_PRESETS, animationMeta)) {
    exactCandidates.push({
      source: "OutroType",
      key: animationMeta,
      identity: `out:${animationMeta}`,
      value: VIDEO_OUTRO_PRESETS[animationMeta]
    });
  }
  if (hasOwn(VIDEO_GROUP_ANIMATION_PRESETS, animationMeta)) {
    exactCandidates.push({
      source: "GroupAnimationType",
      key: animationMeta,
      identity: `group:${animationMeta}`,
      value: VIDEO_GROUP_ANIMATION_PRESETS[animationMeta]
    });
  }

  return resolveFromExactAndIndex(
    animationMeta,
    exactCandidates,
    videoAnimationNameIndex,
    "video animation",
    `Unknown video animation preset "${animationMeta}". Import from "jsjianyingdraft/metadata" for full preset catalog.`
  );
}

export function resolveTextAnimationMeta(animationMeta: TextAnimationMeta | TextAnimationPresetInput): TextAnimationMeta {
  if (typeof animationMeta !== "string") {
    return animationMeta;
  }

  const exactCandidates: Array<ResolverCandidate<TextAnimationMeta>> = [];
  if (hasOwn(TEXT_INTRO_PRESETS, animationMeta)) {
    exactCandidates.push({
      source: "TextIntro",
      key: animationMeta,
      identity: `in:${animationMeta}`,
      value: TEXT_INTRO_PRESETS[animationMeta]
    });
  }
  if (hasOwn(TEXT_OUTRO_PRESETS, animationMeta)) {
    exactCandidates.push({
      source: "TextOutro",
      key: animationMeta,
      identity: `out:${animationMeta}`,
      value: TEXT_OUTRO_PRESETS[animationMeta]
    });
  }
  if (hasOwn(TEXT_LOOP_ANIMATION_PRESETS, animationMeta)) {
    exactCandidates.push({
      source: "TextLoopAnim",
      key: animationMeta,
      identity: `loop:${animationMeta}`,
      value: TEXT_LOOP_ANIMATION_PRESETS[animationMeta]
    });
  }

  return resolveFromExactAndIndex(
    animationMeta,
    exactCandidates,
    textAnimationNameIndex,
    "text animation",
    `Unknown text animation preset "${animationMeta}". Import from "jsjianyingdraft/metadata" for full preset catalog.`
  );
}

export function resolveTransitionMeta(transitionMeta: TransitionMeta | TransitionPresetInput): TransitionMeta {
  if (typeof transitionMeta !== "string") {
    return transitionMeta;
  }

  const exactCandidates: Array<ResolverCandidate<TransitionMeta>> = [];
  if (hasOwn(TRANSITION_PRESETS, transitionMeta)) {
    exactCandidates.push({
      source: "TransitionType",
      key: transitionMeta,
      identity: transitionMeta,
      value: TRANSITION_PRESETS[transitionMeta]
    });
  }

  return resolveFromExactAndIndex(
    transitionMeta,
    exactCandidates,
    transitionNameIndex,
    "transition",
    `Unknown transition preset "${transitionMeta}". Import from "jsjianyingdraft/metadata" for full preset catalog.`
  );
}

export function resolveMaskMeta(maskMeta: MaskMeta | MaskPresetInput): MaskMeta {
  if (typeof maskMeta !== "string") {
    return maskMeta;
  }

  const exactCandidates: Array<ResolverCandidate<MaskMeta>> = [];
  if (hasOwn(MASK_PRESETS, maskMeta)) {
    exactCandidates.push({
      source: "MaskType",
      key: maskMeta,
      identity: maskMeta,
      value: MASK_PRESETS[maskMeta]
    });
  }

  return resolveFromExactAndIndex(
    maskMeta,
    exactCandidates,
    maskNameIndex,
    "mask",
    `Unknown mask preset "${maskMeta}". Import from "jsjianyingdraft/metadata" for full preset catalog.`
  );
}

export function resolveMixModeMeta(mixModeMeta: EffectMeta | MixModePresetInput): EffectMeta {
  if (typeof mixModeMeta !== "string") {
    return mixModeMeta;
  }

  const exactCandidates: Array<ResolverCandidate<EffectMeta>> = [];
  if (hasOwn(MIX_MODE_PRESETS, mixModeMeta)) {
    exactCandidates.push({
      source: "MixModeType",
      key: mixModeMeta,
      identity: mixModeMeta,
      value: MIX_MODE_PRESETS[mixModeMeta]
    });
  }

  return resolveFromExactAndIndex(
    mixModeMeta,
    exactCandidates,
    mixModeNameIndex,
    "mix mode",
    `Unknown mix mode preset "${mixModeMeta}". Import from "jsjianyingdraft/metadata" for full preset catalog.`
  );
}

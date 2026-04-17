import type {
  AudioEffectMeta,
  EffectMeta,
  EffectParam,
  MaskMeta,
  TextAnimationMeta,
  TransitionMeta,
  VideoAnimationMeta,
  VideoEffectType
} from "./segment.js";

function param(name: string, defaultValue: number, minValue: number, maxValue: number): EffectParam {
  return { name, defaultValue, minValue, maxValue };
}

function audioEffect(
  name: string,
  resourceId: string,
  effectId: string,
  categoryId: AudioEffectMeta["categoryId"],
  params?: ReadonlyArray<EffectParam>
): AudioEffectMeta {
  return { name, resourceId, effectId, categoryId, params };
}

function videoAnimation(
  title: string,
  duration: number,
  resourceId: string,
  effectId: string,
  animationType: VideoAnimationMeta["animationType"]
): VideoAnimationMeta {
  return { title, duration, resourceId, effectId, animationType };
}

function textAnimation(
  title: string,
  duration: number,
  resourceId: string,
  effectId: string,
  animationType: TextAnimationMeta["animationType"]
): TextAnimationMeta {
  return { title, duration, resourceId, effectId, animationType };
}

function transition(
  name: string,
  defaultDuration: number,
  resourceId: string,
  effectId: string,
  isOverlap: boolean
): TransitionMeta {
  return { name, defaultDuration, resourceId, effectId, isOverlap };
}

function mask(
  name: string,
  resourceType: string,
  resourceId: string,
  effectId: string,
  defaultAspectRatio: number
): MaskMeta {
  return { name, resourceType, resourceId, effectId, defaultAspectRatio };
}

const COMMON_VIDEO_SCENE_EFFECT_PRESETS = {
  n1998: {
    name: "1998",
    resourceId: "6981791065204331044",
    effectId: "1183068",
    params: [
      param("effects_adjust_filter", 1.0, 0.0, 1.0),
      param("effects_adjust_texture", 1.0, 0.0, 1.0)
    ]
  },
  s70: {
    name: "70s",
    resourceId: "6706773500792689165",
    effectId: "634717",
    params: [param("effects_adjust_speed", 0.33, 0.0, 1.0)]
  },
  dvUi: {
    name: "DV界面",
    resourceId: "6974600764027048462",
    effectId: "1164160"
  },
  jvc: {
    name: "JVC",
    resourceId: "7102302420310430215",
    effectId: "2254788",
    params: [
      param("effects_adjust_color", 0.5, 0.0, 1.0),
      param("effects_adjust_intensity", 0.35, 0.0, 1.0),
      param("effects_adjust_filter", 0.9, 0.0, 1.0)
    ]
  },
  vcr: {
    name: "VCR",
    resourceId: "6876012864679711245",
    effectId: "931458",
    params: [
      param("effects_adjust_speed", 0.33, 0.0, 1.0),
      param("effects_adjust_sharpen", 0.3, 0.0, 1.0),
      param("effects_adjust_filter", 1.0, 0.0, 1.0),
      param("effects_adjust_horizontal_chromatic", 0.6, 0.0, 1.0),
      param("effects_adjust_vertical_chromatic", 0.5, 0.0, 1.0)
    ]
  },
  betamax: {
    name: "betamax",
    resourceId: "7239937281937642041",
    effectId: "14578173",
    params: [
      param("effects_adjust_filter", 0.7, 0.0, 1.0),
      param("effects_adjust_blur", 0.65, 0.0, 1.0),
      param("effects_adjust_sharpen", 0.25, 0.0, 1.0),
      param("effects_adjust_distortion", 0.4, 0.0, 1.0),
      param("effects_adjust_texture", 0.55, 0.0, 1.0),
      param("effects_adjust_size", 0.6, 0.0, 1.0)
    ]
  },
  xSignal: {
    name: "X-Signal",
    resourceId: "6709706971638927875",
    effectId: "634719",
    params: [param("effects_adjust_speed", 0.33, 0.0, 1.0)]
  },
  newYear: {
    name: "New Year",
    resourceId: "7041771617315197453",
    effectId: "1483460",
    params: [
      param("effects_adjust_size", 0.16, 0.0, 1.0),
      param("effects_adjust_speed", 0.336, 0.0, 1.0),
      param("effects_adjust_color", 0.0, 0.0, 1.0),
      param("effects_adjust_filter", 0.339, 0.0, 1.0),
      param("effects_adjust_background_animation", 1.0, 0.0, 1.0)
    ]
  }
} as const satisfies Record<string, EffectMeta>;

const COMMON_VIDEO_CHARACTER_EFFECT_PRESETS = {
  boom: {
    name: "BOOM！",
    resourceId: "6999560597230588429",
    effectId: "1378605",
    params: [
      param("effects_adjust_speed", 0.33, 0.0, 1.0),
      param("effects_adjust_vertical_shift", 0.5, 0.0, 1.0),
      param("effects_adjust_size", 0.5, 0.0, 1.0),
      param("effects_adjust_color", 1.0, 0.0, 1.0)
    ]
  },
  x: {
    name: "X",
    resourceId: "7037006820749087246",
    effectId: "1464226",
    params: [
      param("effects_adjust_size", 0.5, 0.0, 1.0),
      param("effects_adjust_vertical_shift", 0.5, 0.0, 1.0),
      param("effects_adjust_speed", 0.33, 0.0, 1.0)
    ]
  },
  crash: {
    name: "crash！",
    resourceId: "6999887184018805285",
    effectId: "1378609",
    params: [
      param("effects_adjust_speed", 0.33, 0.0, 1.0),
      param("effects_adjust_vertical_shift", 0.5, 0.0, 1.0),
      param("effects_adjust_size", 0.5, 0.0, 1.0),
      param("effects_adjust_color", 1.0, 0.0, 1.0)
    ]
  },
  hit: {
    name: "击中",
    resourceId: "7008009586581967397",
    effectId: "1404729",
    params: [param("effects_adjust_color", 1.0, 0.0, 1.0)]
  },
  split: {
    name: "分身",
    resourceId: "7194734735434715704",
    effectId: "9010351",
    params: [
      param("effects_adjust_distortion", 0.2, 0.0, 1.0),
      param("effects_adjust_speed", 0.5, 0.0, 1.0),
      param("effects_adjust_number", 1.0, 0.0, 1.0),
      param("effects_adjust_intensity", 1.0, 0.0, 1.0),
      param("effects_adjust_rotate", 0.0, 0.0, 1.0)
    ]
  },
  halo1: {
    name: "光环 I",
    resourceId: "6999584193848021535",
    effectId: "1378551",
    params: [
      param("effects_adjust_vertical_shift", 0.5, 0.0, 1.0),
      param("effects_adjust_size", 0.5, 0.0, 1.0),
      param("effects_adjust_color", 1.0, 0.0, 1.0)
    ]
  }
} as const satisfies Record<string, EffectMeta>;

const COMMON_FILTER_PRESETS = {
  n1980: {
    name: "1980",
    resourceId: "7127828208690433311",
    effectId: "7127828208690433311"
  },
  abg: {
    name: "ABG",
    resourceId: "7127679308897832206",
    effectId: "7127679308897832206"
  },
  ditto: {
    name: "Ditto",
    resourceId: "7195816046077496635",
    effectId: "7195816046077496635"
  },
  ke1: {
    name: "KE1",
    resourceId: "7127819154018536741",
    effectId: "7127819154018536741"
  },
  kv5d: {
    name: "KV5D",
    resourceId: "7127578859217620254",
    effectId: "7127578859217620254"
  },
  lofi2: {
    name: "Lofi II",
    resourceId: "7232216810031025468",
    effectId: "7232216810031025468"
  },
  vhs3: {
    name: "VHS III",
    resourceId: "7127669764905782542",
    effectId: "7127669764905782542"
  },
  brightSummer: {
    name: "亮夏",
    resourceId: "7505804389395877120",
    effectId: "7505804389395877120",
    params: [param("effects_adjust_filter", 1.0, 0.0, 1.0)]
  }
} as const satisfies Record<string, EffectMeta>;

export const AUDIO_EFFECT_PRESETS = {
  echo: audioEffect("回音", "7018011608408396325", "5723901", "sound_effect", [
    param("change_voice_param_quantity", 0.8, 0.0, 1.0),
    param("change_voice_param_strength", 0.762, 0.0, 1.0)
  ]),
  underwater: audioEffect("水下", "7106404450444513806", "2673077", "sound_effect", [
    param("深度", 0.5, 0.0, 1.0)
  ]),
  robotTone: audioEffect("机器人", "7018011705414259213", "2672750", "tone", [param("强弱", 1.0, 0.0, 1.0)]),
  maleTone: audioEffect("男生", "7020345085233467917", "2672758", "tone", [
    param("音调", 0.375, 0.0, 1.0),
    param("音色", 0.25, 0.0, 1.0)
  ]),
  lofiSong: audioEffect("Lofi", "7252917861948068410", "17345060", "speech_to_song"),
  folkSong: audioEffect("民谣", "7251868698170888759", "17046923", "speech_to_song")
} as const satisfies Record<string, AudioEffectMeta>;

export const VIDEO_ANIMATION_PRESETS = {
  fadeIn: videoAnimation("渐显", 500_000, "6798320778182922760", "624705", "in"),
  fadeOut: videoAnimation("渐隐", 500_000, "6798320902548230669", "624707", "out"),
  split3: videoAnimation("三分割", 500_000, "6873360856541827591", "922958", "group")
} as const satisfies Record<string, VideoAnimationMeta>;

export const TEXT_ANIMATION_PRESETS = {
  textFadeIn: textAnimation("渐显", 500_000, "6724916044072227332", "1644304", "in"),
  textFadeOut: textAnimation("渐隐", 500_000, "6724919382104871427", "1644600", "out"),
  textGlitchLoop: textAnimation("色差故障", 500_000, "6835878163575214605", "1644522", "loop"),
  textTypewriterIn: textAnimation("复古打字机", 800_000, "7253888335163167291", "17639720", "in")
} as const satisfies Record<string, TextAnimationMeta>;

export const TRANSITION_PRESETS = {
  dissolve: transition("叠化", 500_000, "6724845717472416269", "322577", true),
  slideLeft: transition("左移", 1_000_000, "6726711499676455435", "2917286", true),
  whiteFlash: transition("白光快闪", 400_000, "7343136487182963211", "49272367", true)
} as const satisfies Record<string, TransitionMeta>;

export const MASK_PRESETS = {
  line: mask("线性", "line", "6791652175668843016", "636071", 1.0),
  mirror: mask("镜面", "mirror", "6791699060140020232", "636073", 1.0),
  circle: mask("圆形", "circle", "6791700663249146381", "636075", 1.0),
  rectangle: mask("矩形", "rectangle", "6791700809454195207", "636077", 1.0),
  heart: mask("爱心", "geometric_shape", "6794051276482023949", "636079", 1.115),
  star: mask("星形", "geometric_shape", "6794051169434997255", "636081", 1.05)
} as const satisfies Record<string, MaskMeta>;

export const MIX_MODE_PRESETS = {
  multiply: { name: "正片叠底", resourceId: "6758325895519277582", effectId: "871333" },
  colorDodge: { name: "颜色减淡", resourceId: "6758325800031752712", effectId: "871334" },
  colorBurn: { name: "颜色加深", resourceId: "6758325724848853518", effectId: "871335" },
  linearBurn: { name: "线性加深", resourceId: "6758325619253056013", effectId: "871336" },
  softLight: { name: "柔光", resourceId: "6758325439212556814", effectId: "871337" },
  hardLight: { name: "强光", resourceId: "6758325264670790152", effectId: "871338" },
  screen: { name: "滤色", resourceId: "6758325170760323597", effectId: "871339" },
  overlay: { name: "叠加", resourceId: "6758324989931295240", effectId: "871340" },
  lighten: { name: "变亮", resourceId: "6758324919789949453", effectId: "871341" },
  darken: { name: "变暗", resourceId: "6758324839670354445", effectId: "871342" }
} as const satisfies Record<string, EffectMeta>;

export type CommonVideoSceneEffectPresetKey = keyof typeof COMMON_VIDEO_SCENE_EFFECT_PRESETS;
export type CommonVideoCharacterEffectPresetKey = keyof typeof COMMON_VIDEO_CHARACTER_EFFECT_PRESETS;
export type CommonVideoEffectPresetKey = CommonVideoSceneEffectPresetKey | CommonVideoCharacterEffectPresetKey;
export type CommonFilterPresetKey = keyof typeof COMMON_FILTER_PRESETS;
export type CommonAudioEffectPresetKey = keyof typeof AUDIO_EFFECT_PRESETS;
export type CommonVideoAnimationPresetKey = keyof typeof VIDEO_ANIMATION_PRESETS;
export type CommonTextAnimationPresetKey = keyof typeof TEXT_ANIMATION_PRESETS;
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

function hasOwn<T extends object>(value: T, key: string): key is Extract<keyof T, string> {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[\s_-]+/g, "");
}

const videoEffectNameIndex = new Map<string, ResolvedVideoEffectMeta>();
for (const [key, meta] of Object.entries(COMMON_VIDEO_SCENE_EFFECT_PRESETS)) {
  const resolved: ResolvedVideoEffectMeta = { meta, effectType: "video_effect" };
  videoEffectNameIndex.set(normalizeName(key), resolved);
  videoEffectNameIndex.set(normalizeName(meta.name), resolved);
}
for (const [key, meta] of Object.entries(COMMON_VIDEO_CHARACTER_EFFECT_PRESETS)) {
  const resolved: ResolvedVideoEffectMeta = { meta, effectType: "face_effect" };
  videoEffectNameIndex.set(normalizeName(key), resolved);
  videoEffectNameIndex.set(normalizeName(meta.name), resolved);
}

const filterNameIndex = new Map<string, EffectMeta>();
for (const [key, meta] of Object.entries(COMMON_FILTER_PRESETS)) {
  filterNameIndex.set(normalizeName(key), meta);
  filterNameIndex.set(normalizeName(meta.name), meta);
}

const audioEffectNameIndex = new Map<string, AudioEffectMeta>();
for (const [key, meta] of Object.entries(AUDIO_EFFECT_PRESETS)) {
  audioEffectNameIndex.set(normalizeName(key), meta);
  audioEffectNameIndex.set(normalizeName(meta.name), meta);
}

const videoAnimationNameIndex = new Map<string, VideoAnimationMeta>();
for (const [key, meta] of Object.entries(VIDEO_ANIMATION_PRESETS)) {
  videoAnimationNameIndex.set(normalizeName(key), meta);
  videoAnimationNameIndex.set(normalizeName(meta.title), meta);
}

const textAnimationNameIndex = new Map<string, TextAnimationMeta>();
for (const [key, meta] of Object.entries(TEXT_ANIMATION_PRESETS)) {
  textAnimationNameIndex.set(normalizeName(key), meta);
  textAnimationNameIndex.set(normalizeName(meta.title), meta);
}

const transitionNameIndex = new Map<string, TransitionMeta>();
for (const [key, meta] of Object.entries(TRANSITION_PRESETS)) {
  transitionNameIndex.set(normalizeName(key), meta);
  transitionNameIndex.set(normalizeName(meta.name), meta);
}

const maskNameIndex = new Map<string, MaskMeta>();
for (const [key, meta] of Object.entries(MASK_PRESETS)) {
  maskNameIndex.set(normalizeName(key), meta);
  maskNameIndex.set(normalizeName(meta.name), meta);
}

const mixModeNameIndex = new Map<string, EffectMeta>();
for (const [key, meta] of Object.entries(MIX_MODE_PRESETS)) {
  mixModeNameIndex.set(normalizeName(key), meta);
  mixModeNameIndex.set(normalizeName(meta.name), meta);
}

export function resolveVideoEffectMeta(effectMeta: EffectMeta | VideoEffectPresetInput): ResolvedVideoEffectMeta {
  if (typeof effectMeta !== "string") {
    return { meta: effectMeta, effectType: "video_effect" };
  }

  const fromName = videoEffectNameIndex.get(normalizeName(effectMeta));
  if (fromName) {
    return fromName;
  }
  throw new Error(
    `Unknown built-in video effect preset "${effectMeta}". Import from "jsjianyingdraft/metadata" for full preset catalog.`
  );
}

export function resolveFilterMeta(filterMeta: EffectMeta | FilterPresetInput): EffectMeta {
  if (typeof filterMeta !== "string") {
    return filterMeta;
  }

  const fromName = filterNameIndex.get(normalizeName(filterMeta));
  if (fromName) {
    return fromName;
  }
  throw new Error(
    `Unknown built-in filter preset "${filterMeta}". Import from "jsjianyingdraft/metadata" for full preset catalog.`
  );
}

export function resolveAudioEffectMeta(effectMeta: AudioEffectMeta | AudioEffectPresetInput): AudioEffectMeta {
  if (typeof effectMeta !== "string") {
    return effectMeta;
  }

  if (hasOwn(AUDIO_EFFECT_PRESETS, effectMeta)) {
    return AUDIO_EFFECT_PRESETS[effectMeta];
  }

  const fromName = audioEffectNameIndex.get(normalizeName(effectMeta));
  if (fromName) {
    return fromName;
  }
  throw new Error(
    `Unknown built-in audio effect preset "${effectMeta}". Import from "jsjianyingdraft/metadata" for full preset catalog.`
  );
}

export function resolveVideoAnimationMeta(
  animationMeta: VideoAnimationMeta | VideoAnimationPresetInput
): VideoAnimationMeta {
  if (typeof animationMeta !== "string") {
    return animationMeta;
  }

  if (hasOwn(VIDEO_ANIMATION_PRESETS, animationMeta)) {
    return VIDEO_ANIMATION_PRESETS[animationMeta];
  }

  const fromName = videoAnimationNameIndex.get(normalizeName(animationMeta));
  if (fromName) {
    return fromName;
  }
  throw new Error(
    `Unknown built-in video animation preset "${animationMeta}". Import from "jsjianyingdraft/metadata" for full preset catalog.`
  );
}

export function resolveTextAnimationMeta(animationMeta: TextAnimationMeta | TextAnimationPresetInput): TextAnimationMeta {
  if (typeof animationMeta !== "string") {
    return animationMeta;
  }

  if (hasOwn(TEXT_ANIMATION_PRESETS, animationMeta)) {
    return TEXT_ANIMATION_PRESETS[animationMeta];
  }

  const fromName = textAnimationNameIndex.get(normalizeName(animationMeta));
  if (fromName) {
    return fromName;
  }
  throw new Error(
    `Unknown built-in text animation preset "${animationMeta}". Import from "jsjianyingdraft/metadata" for full preset catalog.`
  );
}

export function resolveTransitionMeta(transitionMeta: TransitionMeta | TransitionPresetInput): TransitionMeta {
  if (typeof transitionMeta !== "string") {
    return transitionMeta;
  }

  if (hasOwn(TRANSITION_PRESETS, transitionMeta)) {
    return TRANSITION_PRESETS[transitionMeta];
  }

  const fromName = transitionNameIndex.get(normalizeName(transitionMeta));
  if (fromName) {
    return fromName;
  }
  throw new Error(
    `Unknown built-in transition preset "${transitionMeta}". Import from "jsjianyingdraft/metadata" for full preset catalog.`
  );
}

export function resolveMaskMeta(maskMeta: MaskMeta | MaskPresetInput): MaskMeta {
  if (typeof maskMeta !== "string") {
    return maskMeta;
  }

  if (hasOwn(MASK_PRESETS, maskMeta)) {
    return MASK_PRESETS[maskMeta];
  }

  const fromName = maskNameIndex.get(normalizeName(maskMeta));
  if (fromName) {
    return fromName;
  }
  throw new Error(
    `Unknown built-in mask preset "${maskMeta}". Import from "jsjianyingdraft/metadata" for full preset catalog.`
  );
}

export function resolveMixModeMeta(mixModeMeta: EffectMeta | MixModePresetInput): EffectMeta {
  if (typeof mixModeMeta !== "string") {
    return mixModeMeta;
  }

  if (hasOwn(MIX_MODE_PRESETS, mixModeMeta)) {
    return MIX_MODE_PRESETS[mixModeMeta];
  }

  const fromName = mixModeNameIndex.get(normalizeName(mixModeMeta));
  if (fromName) {
    return fromName;
  }
  throw new Error(
    `Unknown built-in mix mode preset "${mixModeMeta}". Import from "jsjianyingdraft/metadata" for full preset catalog.`
  );
}

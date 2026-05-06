import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  ScriptFile,
  TrackType,
  VideoMaterial,
  VideoSegment
} from "../src/index.js";
import {
  AUDIO_EFFECT_PRESETS,
  AUDIO_SCENE_EFFECT_PRESETS,
  AudioSceneEffectType,
  FILTER_PRESETS,
  FilterType,
  FONT_PRESETS,
  FontType,
  Font_type,
  GroupAnimationType,
  IntroType,
  MASK_PRESETS,
  MaskType,
  MIX_MODE_PRESETS,
  MixModeType,
  OutroType,
  SPEECH_TO_SONG_PRESETS,
  SpeechToSongType,
  TEXT_ANIMATION_PRESETS,
  TEXT_INTRO_PRESETS,
  TEXT_LOOP_ANIMATION_PRESETS,
  TEXT_OUTRO_PRESETS,
  TextIntro,
  TextLoopAnim,
  TextOutro,
  TONE_EFFECT_PRESETS,
  ToneEffectType,
  TRANSITION_PRESETS,
  TransitionType,
  VIDEO_ANIMATION_PRESETS,
  VIDEO_CHARACTER_EFFECT_PRESETS,
  VIDEO_GROUP_ANIMATION_PRESETS,
  VIDEO_INTRO_PRESETS,
  VIDEO_OUTRO_PRESETS,
  VIDEO_SCENE_EFFECT_PRESETS,
  VideoCharacterEffectType,
  VideoSceneEffectType,
  Video_scene_effect_type,
  resolveAudioEffectMeta,
  resolveFilterMeta,
  resolveFontMeta,
  resolveMaskMeta,
  resolveMixModeMeta,
  resolveTextAnimationMeta,
  resolveTransitionMeta,
  resolveVideoAnimationMeta,
  resolveVideoEffectMeta
} from "../src/metadata.js";
import { Timerange } from "../src/time.js";

const tempDirs: string[] = [];

function createTempFile(name: string): string {
  const dir = mkdtempSync(join(tmpdir(), "jydraft-"));
  tempDirs.push(dir);
  const filePath = join(dir, name);
  writeFileSync(filePath, "dummy");
  return filePath;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0, tempDirs.length)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("metadata presets", () => {
  it("matches py full preset counts", () => {
    expect(Object.keys(VIDEO_SCENE_EFFECT_PRESETS).length).toBe(1_097);
    expect(Object.keys(VIDEO_CHARACTER_EFFECT_PRESETS).length).toBe(240);
    expect(Object.keys(FILTER_PRESETS).length).toBe(1_052);
    expect(Object.keys(FONT_PRESETS).length).toBe(798);

    expect(Object.keys(AUDIO_SCENE_EFFECT_PRESETS).length).toBe(85);
    expect(Object.keys(TONE_EFFECT_PRESETS).length).toBe(57);
    expect(Object.keys(SPEECH_TO_SONG_PRESETS).length).toBe(6);
    expect(Object.keys(AUDIO_EFFECT_PRESETS).length).toBe(148);

    expect(Object.keys(VIDEO_INTRO_PRESETS).length).toBe(155);
    expect(Object.keys(VIDEO_OUTRO_PRESETS).length).toBe(124);
    expect(Object.keys(VIDEO_GROUP_ANIMATION_PRESETS).length).toBe(123);

    expect(Object.keys(TEXT_INTRO_PRESETS).length).toBe(145);
    expect(Object.keys(TEXT_OUTRO_PRESETS).length).toBe(97);
    expect(Object.keys(TEXT_LOOP_ANIMATION_PRESETS).length).toBe(93);

    expect(Object.keys(TRANSITION_PRESETS).length).toBe(453);
    expect(Object.keys(MASK_PRESETS).length).toBe(6);
    expect(Object.keys(MIX_MODE_PRESETS).length).toBe(10);
  });

  it("exports grouped animation helpers", () => {
    expect(Object.keys(VIDEO_ANIMATION_PRESETS.in).length).toBe(155);
    expect(Object.keys(VIDEO_ANIMATION_PRESETS.out).length).toBe(124);
    expect(Object.keys(VIDEO_ANIMATION_PRESETS.group).length).toBe(123);
    expect(Object.keys(TEXT_ANIMATION_PRESETS.in).length).toBe(145);
    expect(Object.keys(TEXT_ANIMATION_PRESETS.out).length).toBe(97);
    expect(Object.keys(TEXT_ANIMATION_PRESETS.loop).length).toBe(93);
  });

  it("resolves py-style preset keys and names", () => {
    expect(resolveAudioEffectMeta("回音").categoryId).toBe("sound_effect");
    expect(resolveVideoAnimationMeta("渐显").animationType).toBe("in");
    expect(resolveTextAnimationMeta("VHS").animationType).toBe("loop");
    expect(resolveTransitionMeta("叠化").effectId).toBe(TRANSITION_PRESETS.叠化.effectId);
    expect(resolveMaskMeta("圆形").resourceType).toBe("circle");
    expect(resolveMixModeMeta("滤色").effectId).toBe(MIX_MODE_PRESETS.滤色.effectId);

    const byDisplayName = resolveVideoEffectMeta("BOOM！");
    expect(byDisplayName.effectType).toBe("face_effect");
    expect(resolveFilterMeta("Lofi II").effectId).toBe(FILTER_PRESETS.Lofi_II.effectId);
  });

  it("exports python-style enum members and snake_case aliases", () => {
    expect(VideoSceneEffectType.VCR.effectId).toBe(VIDEO_SCENE_EFFECT_PRESETS.VCR.effectId);
    expect(VideoCharacterEffectType.BOOM.effectId).toBe(VIDEO_CHARACTER_EFFECT_PRESETS.BOOM.effectId);
    expect(FilterType.Lofi_II.effectId).toBe(FILTER_PRESETS.Lofi_II.effectId);

    expect(AudioSceneEffectType.回音.categoryId).toBe("sound_effect");
    expect(ToneEffectType.男生.categoryId).toBe("tone");
    expect(SpeechToSongType.Lofi.categoryId).toBe("speech_to_song");

    expect(IntroType.渐显.animationType).toBe("in");
    expect(OutroType.渐隐.animationType).toBe("out");
    expect(GroupAnimationType.三分割.animationType).toBe("group");
    expect(TextIntro.卡拉OK.animationType).toBe("in");
    expect(TextOutro.渐隐.animationType).toBe("out");
    expect(TextLoopAnim.VHS.animationType).toBe("loop");

    expect(TransitionType.叠化.effectId).toBe(TRANSITION_PRESETS.叠化.effectId);
    expect(MaskType.圆形.resourceType).toBe("circle");
    expect(MixModeType.滤色.effectId).toBe(MIX_MODE_PRESETS.滤色.effectId);
    expect(FontType.Anton.resourceId).toBe(FONT_PRESETS.Anton.resourceId);

    expect(Video_scene_effect_type.VCR.effectId).toBe(VideoSceneEffectType.VCR.effectId);
    expect(Font_type.Anton.resourceId).toBe(FontType.Anton.resourceId);
  });

  it("supports python-style from_name lookups", () => {
    expect(VideoSceneEffectType.from_name("V_C_R").effectId).toBe(VideoSceneEffectType.VCR.effectId);
    expect(VideoCharacterEffectType.fromName("B O O M").effectId).toBe(VideoCharacterEffectType.BOOM.effectId);
    expect(FilterType.from_name("lofi_ii").effectId).toBe(FilterType.Lofi_II.effectId);
    expect(FontType.from_name("HarmonyOS Sans SC Regular").resourceId).toBe(FontType.HarmonyOS_Sans_SC_Regular.resourceId);
    expect(TextLoopAnim.from_name("v h s").animationType).toBe("loop");

    expect(Video_scene_effect_type.from_name("v c r").effectId).toBe(VideoSceneEffectType.VCR.effectId);
    expect(Font_type.fromName("anton").resourceId).toBe(FontType.Anton.resourceId);
    expect(() => FilterType.from_name("not_exist")).toThrow();
  });

  it("throws on ambiguous animation/effect names", () => {
    expect(() => resolveVideoAnimationMeta("Kira游动")).toThrow(/Ambiguous/);
    expect(() => resolveTextAnimationMeta("弹簧")).toThrow(/Ambiguous/);
    expect(() => resolveVideoEffectMeta("梦境")).toThrow(/Ambiguous/);
  });

  it("removes old english shortcut keys", () => {
    expect(() => resolveAudioEffectMeta("echo")).toThrow();
    expect(() => resolveVideoAnimationMeta("fadeIn")).toThrow();
    expect(() => resolveTextAnimationMeta("textFadeIn")).toThrow();
    expect(() => resolveTransitionMeta("dissolve")).toThrow();
    expect(() => resolveMaskMeta("circle")).toThrow();
    expect(() => resolveMixModeMeta("screen")).toThrow();
    expect(() => resolveVideoEffectMeta("n1998")).toThrow();
    expect(() => resolveFilterMeta("lofi2")).toThrow();
  });

  it("resolves font presets by key and display name", () => {
    expect(resolveFontMeta("Anton").resourceId).toBe(FONT_PRESETS.Anton.resourceId);
    expect(resolveFontMeta("HarmonyOS_Sans_SC_Regular").resourceId).toBe(
      FONT_PRESETS.HarmonyOS_Sans_SC_Regular.resourceId
    );
  });

  it("accepts py preset keys in ScriptFile addEffect/addFilter", () => {
    const script = new ScriptFile(1920, 1080);
    script.addTrack(TrackType.effect).addTrack(TrackType.filter);

    script.addEffect("VCR", new Timerange(0, 1_000_000));
    script.addEffect("BOOM", new Timerange(1_000_000, 1_000_000));
    script.addFilter("Lofi_II", new Timerange(0, 2_000_000), undefined, 70);

    expect(script.materials.videoEffects.length).toBe(2);
    expect(script.materials.filters.length).toBe(1);

    const effectPayloads = script.materials.videoEffects.map((item) => item.exportJson());
    expect(effectPayloads[0]?.type).toBe("video_effect");
    expect(effectPayloads[1]?.type).toBe("face_effect");
    expect(script.materials.filters[0]?.exportJson().value).toBeCloseTo(0.7);
  });

  it("accepts py preset keys in VideoSegment addEffect/addFilter", () => {
    const videoPath = createTempFile("video.mp4");
    const video = new VideoMaterial(videoPath, { duration: 2_000_000, width: 1920, height: 1080 });

    const segment = new VideoSegment(video, new Timerange(0, 2_000_000));
    segment.addEffect("BOOM");
    segment.addFilter("Lofi_II", 60);

    const effectPayload = segment.effects[0]?.exportJson();
    expect(effectPayload?.type).toBe("face_effect");
    expect(segment.filters[0]?.exportJson().value).toBeCloseTo(0.6);
    expect(segment.extraMaterialRefs.length).toBe(3);
  });
});

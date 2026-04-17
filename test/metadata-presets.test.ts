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
  AudioSceneEffectType,
  FILTER_PRESETS,
  FilterType,
  FONT_PRESETS,
  GroupAnimationType,
  IntroType,
  MASK_PRESETS,
  MaskType,
  MIX_MODE_PRESETS,
  MixModeType,
  OutroType,
  SpeechToSongType,
  TEXT_ANIMATION_PRESETS,
  TextIntro,
  TextLoopAnim,
  TextOutro,
  ToneEffectType,
  TRANSITION_PRESETS,
  TransitionType,
  VIDEO_ANIMATION_PRESETS,
  VideoCharacterEffectType,
  VIDEO_CHARACTER_EFFECT_PRESETS,
  FontType,
  Font_type,
  VideoSceneEffectType,
  VIDEO_SCENE_EFFECT_PRESETS,
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
  it("contains full generated preset collections", () => {
    expect(Object.keys(VIDEO_SCENE_EFFECT_PRESETS).length).toBeGreaterThan(1_090);
    expect(Object.keys(VIDEO_CHARACTER_EFFECT_PRESETS).length).toBeGreaterThan(230);
    expect(Object.keys(FILTER_PRESETS).length).toBeGreaterThan(1_040);
    expect(Object.keys(FONT_PRESETS).length).toBeGreaterThan(700);

    const byDisplayName = resolveVideoEffectMeta("BOOM！");
    expect(byDisplayName.effectType).toBe("face_effect");

    const filterByDisplayName = resolveFilterMeta("Lofi II");
    expect(filterByDisplayName.effectId).toBe(FILTER_PRESETS.Lofi_II.effectId);
  });

  it("exports additional preset helpers from metadata subpath", () => {
    expect(Object.keys(AUDIO_EFFECT_PRESETS).length).toBeGreaterThanOrEqual(6);
    expect(Object.keys(VIDEO_ANIMATION_PRESETS).length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(TEXT_ANIMATION_PRESETS).length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(TRANSITION_PRESETS).length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(MASK_PRESETS).length).toBeGreaterThanOrEqual(6);
    expect(Object.keys(MIX_MODE_PRESETS).length).toBeGreaterThanOrEqual(10);

    expect(resolveAudioEffectMeta("echo").categoryId).toBe("sound_effect");
    expect(resolveVideoAnimationMeta("fadeIn").animationType).toBe("in");
    expect(resolveTextAnimationMeta("textGlitchLoop").animationType).toBe("loop");
    expect(resolveTransitionMeta("dissolve").effectId).toBe(TRANSITION_PRESETS.dissolve.effectId);
    expect(resolveMaskMeta("circle").resourceType).toBe("circle");
    expect(resolveMixModeMeta("screen").effectId).toBe(MIX_MODE_PRESETS.screen.effectId);
  });

  it("exports python-style metadata enum aliases", () => {
    expect(VideoSceneEffectType.vcr.effectId).toBe(VIDEO_SCENE_EFFECT_PRESETS.vcr.effectId);
    expect(VideoCharacterEffectType.boom.effectId).toBe(VIDEO_CHARACTER_EFFECT_PRESETS.boom.effectId);
    expect(FilterType.lofi2.effectId).toBe(FILTER_PRESETS.lofi2.effectId);

    expect(AudioSceneEffectType.echo.categoryId).toBe("sound_effect");
    expect(ToneEffectType.maleTone.categoryId).toBe("tone");
    expect(SpeechToSongType.lofiSong.categoryId).toBe("speech_to_song");

    expect(IntroType.fadeIn.animationType).toBe("in");
    expect(OutroType.fadeOut.animationType).toBe("out");
    expect(GroupAnimationType.split3.animationType).toBe("group");
    expect(TextIntro.textFadeIn.animationType).toBe("in");
    expect(TextOutro.textFadeOut.animationType).toBe("out");
    expect(TextLoopAnim.textGlitchLoop.animationType).toBe("loop");

    expect(TransitionType.dissolve.effectId).toBe(TRANSITION_PRESETS.dissolve.effectId);
    expect(MaskType.circle.resourceType).toBe("circle");
    expect(MixModeType.screen.effectId).toBe(MIX_MODE_PRESETS.screen.effectId);
    expect(FontType.Anton.resourceId).toBe(FONT_PRESETS.Anton.resourceId);

    // snake_case compatibility alias
    expect(Video_scene_effect_type.vcr.effectId).toBe(VideoSceneEffectType.vcr.effectId);
    expect(Font_type.Anton.resourceId).toBe(FontType.Anton.resourceId);
  });

  it("supports python-style from_name lookups on enum-style metadata exports", () => {
    expect(VideoSceneEffectType.from_name("V_C_R").effectId).toBe(VideoSceneEffectType.vcr.effectId);
    expect(VideoCharacterEffectType.fromName("B O O M").effectId).toBe(VideoCharacterEffectType.boom.effectId);
    expect(FilterType.from_name("lofi_2").effectId).toBe(FilterType.lofi2.effectId);
    expect(FontType.from_name("HarmonyOS Sans SC Regular").resourceId).toBe(FontType.HarmonyOS_Sans_SC_Regular.resourceId);
    expect(TextLoopAnim.from_name("text glitch loop").animationType).toBe("loop");

    // snake_case enum aliases should preserve from_name
    expect(Video_scene_effect_type.from_name("v c r").effectId).toBe(VideoSceneEffectType.vcr.effectId);
    expect(Font_type.fromName("anton").resourceId).toBe(FontType.Anton.resourceId);

    expect(() => FilterType.from_name("not_exist")).toThrow();
  });

  it("resolves font presets by key and display name", () => {
    expect(resolveFontMeta("Anton").resourceId).toBe(FONT_PRESETS.Anton.resourceId);
    expect(resolveFontMeta("Anton").name).toBe("Anton");
    expect(resolveFontMeta("HarmonyOS_Sans_SC_Regular").resourceId).toBe(
      FONT_PRESETS.HarmonyOS_Sans_SC_Regular.resourceId
    );
  });

  it("resolves scene/character effect preset keys", () => {
    const vcr = resolveVideoEffectMeta("vcr");
    expect(vcr.meta.effectId).toBe(VIDEO_SCENE_EFFECT_PRESETS.vcr.effectId);
    expect(vcr.effectType).toBe("video_effect");

    const boom = resolveVideoEffectMeta("boom");
    expect(boom.meta.effectId).toBe(VIDEO_CHARACTER_EFFECT_PRESETS.boom.effectId);
    expect(boom.effectType).toBe("face_effect");

    const lofi = resolveFilterMeta("lofi2");
    expect(lofi.effectId).toBe(FILTER_PRESETS.lofi2.effectId);
  });

  it("accepts preset keys in ScriptFile addEffect/addFilter", () => {
    const script = new ScriptFile(1920, 1080);
    script.addTrack(TrackType.effect).addTrack(TrackType.filter);

    script.addEffect("vcr", new Timerange(0, 1_000_000));
    script.addEffect("boom", new Timerange(1_000_000, 1_000_000));
    script.addFilter("lofi2", new Timerange(0, 2_000_000), undefined, 70);

    expect(script.materials.videoEffects.length).toBe(2);
    expect(script.materials.filters.length).toBe(1);

    const effectPayloads = script.materials.videoEffects.map((item) => item.exportJson());
    expect(effectPayloads[0]?.type).toBe("video_effect");
    expect(effectPayloads[1]?.type).toBe("face_effect");
    expect(script.materials.filters[0]?.exportJson().value).toBeCloseTo(0.7);
  });

  it("accepts preset keys in VideoSegment addEffect/addFilter", () => {
    const videoPath = createTempFile("video.mp4");
    const video = new VideoMaterial(videoPath, { duration: 2_000_000, width: 1920, height: 1080 });

    const segment = new VideoSegment(video, new Timerange(0, 2_000_000));
    segment.addEffect("boom");
    segment.addFilter("n1980", 60);

    const effectPayload = segment.effects[0]?.exportJson();
    expect(effectPayload?.type).toBe("face_effect");
    expect(segment.filters[0]?.exportJson().value).toBeCloseTo(0.6);
    expect(segment.extraMaterialRefs.length).toBe(3);
  });
});

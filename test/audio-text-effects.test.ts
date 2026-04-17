import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { AudioMaterial } from "../src/materials.js";
import { ScriptFile } from "../src/script-file.js";
import {
  AudioSegment,
  AudioEffectMeta,
  TextAnimationMeta,
  TextSegment
} from "../src/segment.js";
import { TrackType } from "../src/track.js";
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

describe("audio and text effect features", () => {
  it("adds audio effects and enforces category uniqueness", () => {
    const audioPath = createTempFile("audio.mp3");
    const audio = new AudioMaterial(audioPath, { duration: 2_000_000 });

    const sceneFx: AudioEffectMeta = {
      name: "Robot",
      effectId: "meta-effect-id",
      resourceId: "resource-scene",
      categoryId: "sound_effect",
      params: [{ name: "strength", defaultValue: 0.5, minValue: 0, maxValue: 1 }]
    };
    const toneFx: AudioEffectMeta = {
      name: "Tone",
      effectId: "meta-effect-id-2",
      resourceId: "resource-tone",
      categoryId: "tone"
    };

    const segment = new AudioSegment(audio, new Timerange(0, 1_000_000));
    segment.addEffect(sceneFx, [60]);
    expect(segment.effects.length).toBe(1);
    expect(segment.extraMaterialRefs.includes(segment.effects[0]?.effectId ?? "")).toBe(true);

    expect(() => segment.addEffect({ ...sceneFx, effectId: "x2", resourceId: "resource-scene-2" })).toThrow();
    segment.addEffect(toneFx);
    expect(segment.effects.length).toBe(2);

    const script = new ScriptFile(1920, 1080);
    script.addTrack(TrackType.audio).addSegment(segment);

    expect(script.materials.audioEffects.length).toBe(2);
    const dumped = JSON.parse(script.dumps()) as { materials: Record<string, unknown[]> };
    const audioEffects = dumped.materials.audio_effects ?? [];
    expect(audioEffects.length).toBe(2);
    expect((audioEffects[0] as { category_id?: string }).category_id).toBe("sound_effect");
    expect((audioEffects[1] as { category_id?: string }).category_id).toBe("tone");
  });

  it("supports text bubble/effect and template cloning of these assets", () => {
    const animationMeta: TextAnimationMeta = {
      title: "Text In",
      effectId: "anim-text-1",
      resourceId: "anim-text-res-1",
      duration: 400_000,
      animationType: "in"
    };

    const template = new TextSegment("template", new Timerange(0, 1_000_000));
    template
      .setFont({ name: "Demo Font", resourceId: "font-resource-id" })
      .addAnimation(animationMeta)
      .addBubble("bubble-effect-id", "bubble-resource-id")
      .addEffect("flower-id");

    const copied = TextSegment.createFromTemplate("copied", new Timerange(1_000_000, 1_000_000), template);
    expect(copied.font).not.toBeNull();
    expect(copied.font?.resourceId).toBe("font-resource-id");
    expect(copied.font).not.toBe(template.font);
    expect(copied.bubble).not.toBeNull();
    expect(copied.effect).not.toBeNull();
    expect(copied.bubble?.effectId).toBe("bubble-effect-id");
    expect(copied.effect?.effectId).toBe("flower-id");
    expect(copied.bubble?.globalId).not.toBe(template.bubble?.globalId);
    expect(copied.effect?.globalId).not.toBe(template.effect?.globalId);
    expect(copied.animationsInstance).not.toBeNull();
    expect(copied.animationsInstance?.animationId).not.toBe(template.animationsInstance?.animationId);

    const script = new ScriptFile(1920, 1080);
    script.addTrack(TrackType.text).addSegment(copied);

    expect(script.materials.filters.length).toBe(2);
    expect(script.materials.animations.length).toBe(1);

    const dumped = JSON.parse(script.dumps()) as { materials: Record<string, unknown[]> };
    const effects = dumped.materials.effects ?? [];
    const textMaterials = dumped.materials.texts ?? [];
    const textContent = JSON.parse((textMaterials[0] as { content: string }).content) as {
      styles: Array<Record<string, unknown>>;
    };

    expect((textContent.styles[0]?.font as { id?: string } | undefined)?.id).toBe("font-resource-id");
    expect((textContent.styles[0]?.effectStyle as { id?: string } | undefined)?.id).toBe("flower-id");
    expect((effects[0] as { type?: string }).type).toBe("text_shape");
    expect((effects[1] as { type?: string }).type).toBe("text_effect");
    expect((dumped.materials.material_animations ?? []).length).toBe(1);
  });
});

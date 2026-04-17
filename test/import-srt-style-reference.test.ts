import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  ClipSettings,
  ScriptFile,
  TextBackground,
  TextBorder,
  TextSegment,
  TextShadow,
  TextStyle,
  Timerange
} from "../src/index.js";

const tempDirs: string[] = [];

function createTempWorkspace(): string {
  const dir = mkdtempSync(join(tmpdir(), "jydraft-srt-"));
  tempDirs.push(dir);
  return dir;
}

function createSrt(path: string): void {
  writeFileSync(
    path,
    "1\n00:00:01,000 --> 00:00:02,000\nline one\n\n2\n00:00:03,000 --> 00:00:04,500\nline two\n",
    "utf8"
  );
}

function createStyleReference(): TextSegment {
  const segment = new TextSegment("template", new Timerange(0, 1_000_000), {
    font: { name: "TemplateFont", resourceId: "font-template" },
    style: new TextStyle({ bold: true, size: 12, autoWrapping: false }),
    clipSettings: new ClipSettings({ transformY: 0.66 }),
    border: new TextBorder({ width: 30 }),
    background: new TextBackground({ color: "#112233", alpha: 0.8 }),
    shadow: new TextShadow({ distance: 8 })
  });
  segment.addAnimation({
    title: "Template Intro",
    effectId: "anim-intro",
    resourceId: "anim-res",
    duration: 400_000,
    animationType: "in"
  });
  segment.addBubble("bubble-effect", "bubble-resource");
  segment.addEffect("text-effect");
  return segment;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0, tempDirs.length)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("importSrt advanced options", () => {
  it("supports styleReference and does not copy clipSettings by default", () => {
    const root = createTempWorkspace();
    const srtPath = join(root, "sample.srt");
    createSrt(srtPath);

    const script = new ScriptFile(1920, 1080);
    const styleReference = createStyleReference();
    script.importSrt(srtPath, "subtitle", { styleReference });

    const exported = JSON.parse(script.dumps()) as Record<string, unknown>;
    const tracks = exported.tracks as Array<Record<string, unknown>>;
    const segments = (tracks[0]?.segments ?? []) as Array<Record<string, unknown>>;
    const firstClip = (segments[0]?.clip ?? {}) as Record<string, unknown>;
    const firstTransform = (firstClip.transform ?? {}) as Record<string, unknown>;

    // Default behavior aligns with pyJianYingDraft: style_reference does not imply clip_settings.
    expect(firstTransform.y).toBe(0);

    const materials = exported.materials as Record<string, unknown>;
    const textMaterials = (materials.texts ?? []) as Array<Record<string, unknown>>;
    const firstTextContent = JSON.parse(String(textMaterials[0]?.content ?? "{}")) as Record<string, unknown>;
    const styles = (firstTextContent.styles ?? []) as Array<Record<string, unknown>>;
    const firstStyle = styles[0] ?? {};
    expect(firstStyle.bold).toBe(true);
    expect((firstStyle.font as Record<string, unknown>).id).toBe("font-template");

    const animations = (materials.material_animations ?? []) as Array<unknown>;
    expect(animations.length).toBe(2);
    const effectTypes = ((materials.effects ?? []) as Array<Record<string, unknown>>).map((item) => item.type);
    expect(effectTypes).toContain("text_shape");
    expect(effectTypes).toContain("text_effect");
  });

  it("supports clipSettings null and snake_case option aliases", () => {
    const root = createTempWorkspace();
    const srtPath = join(root, "sample.srt");
    createSrt(srtPath);

    const script = new ScriptFile(1920, 1080);
    const styleReference = createStyleReference();
    script.import_srt(srtPath, "subtitle", {
      style_reference: styleReference,
      clip_settings: null,
      text_style: new TextStyle({ size: 20, autoWrapping: true }),
      time_offset: "1s"
    });

    const exported = JSON.parse(script.dumps()) as Record<string, unknown>;
    const tracks = exported.tracks as Array<Record<string, unknown>>;
    const segments = (tracks[0]?.segments ?? []) as Array<Record<string, unknown>>;
    const firstSegment = segments[0] ?? {};
    const firstClip = (firstSegment.clip ?? {}) as Record<string, unknown>;
    const firstTransform = (firstClip.transform ?? {}) as Record<string, unknown>;

    // Explicit null keeps style_reference clip settings.
    expect(firstTransform.y).toBeCloseTo(0.66);
    // time_offset alias should shift the subtitle start.
    expect((firstSegment.target_timerange as Record<string, unknown>).start).toBe(2_000_000);

    const materials = exported.materials as Record<string, unknown>;
    const textMaterials = (materials.texts ?? []) as Array<Record<string, unknown>>;
    const firstTextContent = JSON.parse(String(textMaterials[0]?.content ?? "{}")) as Record<string, unknown>;
    const styles = (firstTextContent.styles ?? []) as Array<Record<string, unknown>>;
    expect(styles[0]?.size).toBe(20);
  });
});

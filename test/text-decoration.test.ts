import { describe, expect, it } from "vitest";

import { TextBackground, TextBorder, TextSegment, TextShadow, TextStyle } from "../src/segment.js";
import { Timerange } from "../src/time.js";

describe("text decorations", () => {
  it("exports border/background/shadow fields into text material", () => {
    const segment = new TextSegment("hello", new Timerange(0, 1_000_000), {
      style: new TextStyle({
        size: 9,
        bold: true,
        italic: true,
        underline: true,
        vertical: true,
        letterSpacing: 2,
        lineSpacing: 3,
        align: 2,
        autoWrapping: true,
        alpha: 0.85
      }),
      border: new TextBorder({ alpha: 0.8, color: [1, 0, 0], width: 50 }),
      background: new TextBackground({
        style: 2,
        color: "#112233",
        alpha: 0.6,
        roundRadius: 0.2,
        horizontalOffset: 0.75,
        verticalOffset: 0.25
      }),
      shadow: new TextShadow({
        alpha: 0.4,
        color: [0.2, 0.3, 0.4],
        diffuse: 12,
        distance: 8,
        angle: 30
      })
    });

    const material = segment.exportMaterial();
    expect(material.check_flag).toBe(63);
    expect(material.background_style).toBe(2);
    expect(material.background_color).toBe("#112233");
    expect(material.background_horizontal_offset).toBeCloseTo(0.5);
    expect(material.background_vertical_offset).toBeCloseTo(-0.5);
    expect(material.typesetting).toBe(1);
    expect(material.letter_spacing).toBeCloseTo(0.1);
    expect(material.line_spacing).toBeCloseTo(0.17);
    expect(material.type).toBe("subtitle");
    expect(material.global_alpha).toBeCloseTo(0.85);

    const content = JSON.parse(String(material.content)) as {
      styles: Array<Record<string, unknown>>;
    };
    const style0 = content.styles[0] as Record<string, unknown>;
    expect(style0.bold).toBe(true);
    expect(style0.italic).toBe(true);
    expect(style0.underline).toBe(true);
    expect(Array.isArray(style0.strokes)).toBe(true);
    expect((style0.strokes as unknown[]).length).toBe(1);
    expect(Array.isArray(style0.shadows)).toBe(true);
    expect((style0.shadows as unknown[]).length).toBe(1);
  });

  it("clones decoration settings in createFromTemplate", () => {
    const template = new TextSegment("template", new Timerange(0, 1_000_000), {
      style: new TextStyle({ bold: true, size: 8.5 }),
      border: new TextBorder({ width: 32 }),
      background: new TextBackground({ color: "#abcdef" }),
      shadow: new TextShadow({ distance: 9 })
    });

    const copied = TextSegment.createFromTemplate("copied", new Timerange(1_000_000, 2_000_000), template);

    expect(copied.border).not.toBe(template.border);
    expect(copied.background).not.toBe(template.background);
    expect(copied.shadow).not.toBe(template.shadow);
    expect(copied.style).not.toBe(template.style);
    expect(copied.border?.width).toBe(template.border?.width);
    expect(copied.background?.color).toBe(template.background?.color);
    expect(copied.shadow?.distance).toBe(template.shadow?.distance);
  });
});

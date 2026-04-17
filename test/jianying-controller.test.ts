import { describe, expect, it } from "vitest";

import {
  AutomationError,
  DraftNotFoundError,
  ExportTimeoutError,
  Export_framerate,
  Export_resolution,
  ExportFramerate,
  ExportResolution,
  Jianying_controller,
  JianyingController
} from "../src/index.js";

describe("JianyingController", () => {
  it("exports compatibility aliases from root entry", () => {
    expect(Jianying_controller).toBe(JianyingController);
    expect(Export_resolution).toBe(ExportResolution);
    expect(Export_framerate).toBe(ExportFramerate);
  });

  it("passes export options into generated PowerShell script", () => {
    const scripts: string[] = [];
    const controller = new JianyingController({
      runner: (script) => {
        scripts.push(script);
        return { status: 0, stdout: "OK", stderr: "" };
      },
      skipPlatformCheck: true
    });

    controller.getWindow();
    controller.switchToHome();
    controller.exportDraft("demo'01", {
      outputPath: "C:\\exports\\demo'01.mp4",
      resolution: ExportResolution.RES_1080P,
      framerate: ExportFramerate.FR_24,
      timeout: 90
    });

    expect(scripts).toHaveLength(3);
    expect(scripts[0]).toContain("$Action = 'getWindow'");
    expect(scripts[1]).toContain("$Action = 'switchToHome'");

    const exportScript = scripts[2];
    expect(exportScript).toContain("$Action = 'exportDraft'");
    expect(exportScript).toContain("$DraftName = 'demo''01'");
    expect(exportScript).toContain("$OutputPath = 'C:\\exports\\demo''01.mp4'");
    expect(exportScript).toContain("$Resolution = '1080P'");
    expect(exportScript).toContain("$Framerate = '24fps'");
    expect(exportScript).toContain("$TimeoutSeconds = 90");
  });

  it("maps DraftNotFound failures to DraftNotFoundError", () => {
    const controller = new JianyingController({
      runner: () => ({
        status: 1,
        stdout: "",
        stderr: "DraftNotFound: 未找到名为foo的剪映草稿"
      }),
      skipPlatformCheck: true
    });

    expect(() => controller.exportDraft("foo")).toThrowError(DraftNotFoundError);
    expect(() => controller.exportDraft("foo")).toThrowError("未找到名为foo的剪映草稿");
  });

  it("maps ExportTimeout failures to ExportTimeoutError", () => {
    const controller = new JianyingController({
      runner: () => ({
        status: 1,
        stdout: "",
        stderr: "ExportTimeout: 导出超时，时限为1200秒"
      }),
      skipPlatformCheck: true
    });

    expect(() => controller.exportDraft("foo")).toThrowError(ExportTimeoutError);
    expect(() => controller.exportDraft("foo")).toThrowError("导出超时，时限为1200秒");
  });

  it("maps other failures to AutomationError", () => {
    const controller = new JianyingController({
      runner: () => ({
        status: 1,
        stdout: "AutomationError: 导出失败",
        stderr: ""
      }),
      skipPlatformCheck: true
    });

    expect(() => controller.exportDraft("foo")).toThrowError(AutomationError);
    expect(() => controller.exportDraft("foo")).toThrowError("AutomationError: 导出失败");
  });

  it("supports snake_case instance methods", () => {
    const scripts: string[] = [];
    const controller = new JianyingController({
      runner: (script) => {
        scripts.push(script);
        return { status: 0, stdout: "", stderr: "" };
      },
      skipPlatformCheck: true
    });

    controller.get_window();
    controller.switch_to_home();
    controller.export_draft("snake_case_demo");

    expect(scripts).toHaveLength(3);
    expect(scripts[0]).toContain("$Action = 'getWindow'");
    expect(scripts[1]).toContain("$Action = 'switchToHome'");
    expect(scripts[2]).toContain("$Action = 'exportDraft'");
  });

  it("checks Windows platform by default", () => {
    if (process.platform === "win32") {
      expect(
        () =>
          new JianyingController({
            runner: () => ({ status: 0, stdout: "", stderr: "" })
          })
      ).not.toThrow();
      return;
    }

    expect(
      () =>
        new JianyingController({
          runner: () => ({ status: 0, stdout: "", stderr: "" })
        })
    ).toThrowError(AutomationError);
  });
});
